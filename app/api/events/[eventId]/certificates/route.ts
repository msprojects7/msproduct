import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import {
  certificateTemplates,
  issuedCertificates,
  attendees,
  sessionAttendance,
} from '@/db/schema/index';
import { eq, and, sql, count, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const templateSchema = z.object({
  title: z.string().trim().min(2).max(255),
  bodyText: z.string().trim().min(5),
  signatoryName: z.string().trim().min(2).max(255),
  signatoryTitle: z.string().trim().min(2).max(255),
  criteriaType: z.enum(['check_in', 'session_count', 'manual']).default('check_in'),
  minSessionCount: z.number().int().min(1).default(1),
  logoUrl: z.string().url().optional().nullable(),
  signatureUrl: z.string().url().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_certificates');

    const templates = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.eventId, context.event.id))
      .orderBy(desc(certificateTemplates.createdAt));

    const issued = await db
      .select({
        id: issuedCertificates.id,
        certificateReference: issuedCertificates.certificateReference,
        status: issuedCertificates.status,
        issuedAt: issuedCertificates.issuedAt,
        revokedAt: issuedCertificates.revokedAt,
        revocationReason: issuedCertificates.revocationReason,
        templateId: issuedCertificates.templateId,
        attendeeId: issuedCertificates.attendeeId,
        attendeeName: attendees.name,
        registrationNumber: attendees.registrationNumber,
        category: attendees.category,
      })
      .from(issuedCertificates)
      .innerJoin(attendees, eq(issuedCertificates.attendeeId, attendees.id))
      .where(eq(issuedCertificates.eventId, context.event.id))
      .orderBy(desc(issuedCertificates.issuedAt))
      .limit(50);

    const [totalIssuedRes, checkedInRes] = await Promise.all([
      db
        .select({ val: count() })
        .from(issuedCertificates)
        .where(
          and(
            eq(issuedCertificates.eventId, context.event.id),
            eq(issuedCertificates.status, 'valid')
          )
        ),
      db
        .select({ val: count() })
        .from(attendees)
        .where(
          and(
            eq(attendees.eventId, context.event.id),
            eq(attendees.attendanceStatus, 'checked_in')
          )
        ),
    ]);

    return NextResponse.json({
      templates,
      issuedCertificates: issued,
      stats: {
        totalIssued: Number(totalIssuedRes[0]?.val || 0),
        eligibleAttendees: Number(checkedInRes[0]?.val || 0),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    const body = await request.json().catch(() => null);

    const action = body?.action || 'create_template';

    // 1. Create Template
    if (action === 'create_template') {
      context.assertPermission('event:manage_certificates');
      const parsed = templateSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid certificate template', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const [template] = await db
        .insert(certificateTemplates)
        .values({
          eventId: context.event.id,
          title: parsed.data.title,
          bodyText: parsed.data.bodyText,
          signatoryName: parsed.data.signatoryName,
          signatoryTitle: parsed.data.signatoryTitle,
          criteriaType: parsed.data.criteriaType,
          minSessionCount: parsed.data.minSessionCount,
          logoUrl: parsed.data.logoUrl || null,
          signatureUrl: parsed.data.signatureUrl || null,
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Certificate template created',
        template,
      });
    }

    // Update Template
    if (action === 'update_template') {
      context.assertPermission('event:manage_certificates');
      const templateId = body?.templateId;
      if (!templateId) {
        return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
      }

      const parsed = templateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid certificate template', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const [updated] = await db
        .update(certificateTemplates)
        .set({
          title: parsed.data.title,
          bodyText: parsed.data.bodyText,
          signatoryName: parsed.data.signatoryName,
          signatoryTitle: parsed.data.signatoryTitle,
          criteriaType: parsed.data.criteriaType,
          minSessionCount: parsed.data.minSessionCount,
          logoUrl: parsed.data.logoUrl || null,
          signatureUrl: parsed.data.signatureUrl || null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(certificateTemplates.id, templateId),
            eq(certificateTemplates.eventId, context.event.id)
          )
        )
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Certificate template updated successfully',
        template: updated,
      });
    }

    // Delete Template
    if (action === 'delete_template') {
      context.assertPermission('event:manage_certificates');
      const templateId = body?.templateId;
      if (!templateId) {
        return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
      }

      await db
        .delete(certificateTemplates)
        .where(
          and(
            eq(certificateTemplates.id, templateId),
            eq(certificateTemplates.eventId, context.event.id)
          )
        );

      return NextResponse.json({
        success: true,
        message: 'Certificate template deleted successfully',
      });
    }

    // 2. Issue Bulk Certificates
    if (action === 'issue_bulk') {
      context.assertPermission('event:issue_certificates');
      const templateId = body?.templateId;

      if (!templateId) {
        return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
      }

      const [template] = await db
        .select()
        .from(certificateTemplates)
        .where(
          and(
            eq(certificateTemplates.id, templateId),
            eq(certificateTemplates.eventId, context.event.id)
          )
        )
        .limit(1);

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      // Determine eligible attendees
      let eligibleAttendeeRows: { id: string; name: string }[] = [];

      if (template.criteriaType === 'check_in') {
        eligibleAttendeeRows = await db
          .select({ id: attendees.id, name: attendees.name })
          .from(attendees)
          .where(
            and(
              eq(attendees.eventId, context.event.id),
              eq(attendees.attendanceStatus, 'checked_in')
            )
          );
      } else if (template.criteriaType === 'session_count') {
        const minCount = template.minSessionCount || 1;
        const attendeesWithSessionCount = await db
          .select({
            id: attendees.id,
            name: attendees.name,
            sessionCount: count(sessionAttendance.id),
          })
          .from(attendees)
          .innerJoin(sessionAttendance, eq(attendees.id, sessionAttendance.attendeeId))
          .where(
            and(
              eq(attendees.eventId, context.event.id),
              eq(sessionAttendance.action, 'check_in')
            )
          )
          .groupBy(attendees.id, attendees.name)
          .having(sql`count(${sessionAttendance.id}) >= ${minCount}`);

        eligibleAttendeeRows = attendeesWithSessionCount;
      } else {
        // manual: check all registered attendees
        eligibleAttendeeRows = await db
          .select({ id: attendees.id, name: attendees.name })
          .from(attendees)
          .where(eq(attendees.eventId, context.event.id));
      }

      // Filter out those who already received this certificate
      const alreadyIssued = await db
        .select({ attendeeId: issuedCertificates.attendeeId })
        .from(issuedCertificates)
        .where(
          and(
            eq(issuedCertificates.eventId, context.event.id),
            eq(issuedCertificates.templateId, template.id)
          )
        );

      const alreadyIssuedSet = new Set(alreadyIssued.map((i) => i.attendeeId));
      const toIssue = eligibleAttendeeRows.filter((att) => !alreadyIssuedSet.has(att.id));

      if (toIssue.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'All eligible attendees already have issued certificates',
          count: 0,
        });
      }

      // Batch insert issued certificates
      const insertValues = toIssue.map((att) => {
        const refSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
        const certRef = `CERT-${context.event.slug.toUpperCase().slice(0, 6)}-${refSuffix}`;
        const token = crypto.randomBytes(24).toString('hex');
        return {
          eventId: context.event.id,
          attendeeId: att.id,
          templateId: template.id,
          certificateReference: certRef,
          verificationToken: token,
          status: 'valid' as const,
        };
      });

      await db.insert(issuedCertificates).values(insertValues);

      return NextResponse.json({
        success: true,
        message: `Successfully issued ${toIssue.length} certificates`,
        count: toIssue.length,
      });
    }

    // 3. Issue Single Certificate
    if (action === 'issue_single') {
      context.assertPermission('event:issue_certificates');
      const { templateId, attendeeId } = body;

      if (!templateId || !attendeeId) {
        return NextResponse.json(
          { error: 'templateId and attendeeId are required' },
          { status: 400 }
        );
      }

      const [attendee] = await db
        .select()
        .from(attendees)
        .where(and(eq(attendees.id, attendeeId), eq(attendees.eventId, context.event.id)))
        .limit(1);

      if (!attendee) {
        return NextResponse.json({ error: 'Attendee not found' }, { status: 404 });
      }

      const refSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
      const certRef = `CERT-${context.event.slug.toUpperCase().slice(0, 6)}-${refSuffix}`;
      const token = crypto.randomBytes(24).toString('hex');

      const [newCert] = await db
        .insert(issuedCertificates)
        .values({
          eventId: context.event.id,
          attendeeId: attendee.id,
          templateId,
          certificateReference: certRef,
          verificationToken: token,
          status: 'valid',
        })
        .onConflictDoNothing()
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Certificate issued successfully',
        certificate: newCert,
      });
    }

    // 4. Revoke Certificate
    if (action === 'revoke') {
      context.assertPermission('event:revoke_certificates');
      const { certificateId, reason } = body;

      if (!certificateId || !reason) {
        return NextResponse.json(
          { error: 'certificateId and reason are required' },
          { status: 400 }
        );
      }

      await db
        .update(issuedCertificates)
        .set({
          status: 'revoked',
          revokedAt: new Date(),
          revocationReason: reason,
        })
        .where(
          and(
            eq(issuedCertificates.id, certificateId),
            eq(issuedCertificates.eventId, context.event.id)
          )
        );

      return NextResponse.json({
        success: true,
        message: 'Certificate revoked successfully',
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
