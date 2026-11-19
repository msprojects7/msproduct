import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import {
  issuedCertificates,
  certificateTemplates,
  attendees,
  events,
  organizations,
} from '@/db/schema/index';
import { eq, or } from 'drizzle-orm';
import { generateCertificatePdf } from '@/lib/certificates/pdf';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { certificateReference: string } }
) {
  try {
    const certRef = params.certificateReference.trim();
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';

    // Find certificate
    const [cert] = await db
      .select({
        id: issuedCertificates.id,
        certificateReference: issuedCertificates.certificateReference,
        verificationToken: issuedCertificates.verificationToken,
        status: issuedCertificates.status,
        issuedAt: issuedCertificates.issuedAt,
        revokedAt: issuedCertificates.revokedAt,
        revocationReason: issuedCertificates.revocationReason,
        templateId: issuedCertificates.templateId,
        attendeeId: issuedCertificates.attendeeId,
        eventId: issuedCertificates.eventId,
      })
      .from(issuedCertificates)
      .where(
        or(
          eq(issuedCertificates.certificateReference, certRef),
          eq(issuedCertificates.verificationToken, certRef)
        )
      )
      .limit(1);

    if (!cert) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Certificate not found',
          message: 'The requested certificate reference is invalid or does not exist.',
        },
        { status: 404 }
      );
    }

    // Load template, attendee, event, and organization
    const [template] = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.id, cert.templateId))
      .limit(1);

    const [attendee] = await db
      .select()
      .from(attendees)
      .where(eq(attendees.id, cert.attendeeId))
      .limit(1);

    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, cert.eventId))
      .limit(1);

    const [org] = event
      ? await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, event.organizationId))
          .limit(1)
      : [null];

    const isRevoked = cert.status === 'revoked';

    if (download && !isRevoked && template && attendee && event) {
      const host = request.headers.get('host') || 'localhost:3333';
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const verificationUrl = `${protocol}://${host}/p/${event.slug}/certificate/${cert.certificateReference}`;

      const pdfBuffer = generateCertificatePdf({
        certificateReference: cert.certificateReference,
        eventName: event.name,
        organizationName: org?.name || 'MS Backstage',
        recipientName: attendee.name,
        title: template.title,
        bodyText: template.bodyText,
        signatoryName: template.signatoryName,
        signatoryTitle: template.signatoryTitle,
        issuedDate: new Date(cert.issuedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        verificationUrl,
      });

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="Certificate-${cert.certificateReference}.pdf"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return NextResponse.json({
      valid: !isRevoked,
      certificateReference: cert.certificateReference,
      status: cert.status,
      issuedAt: cert.issuedAt,
      revokedAt: cert.revokedAt,
      revocationReason: cert.revocationReason,
      recipient: {
        name: attendee?.name || 'Attendee',
        registrationNumber: attendee?.registrationNumber || '',
        category: attendee?.category || '',
      },
      event: {
        name: event?.name || 'Event',
        slug: event?.slug || '',
        organizationName: org?.name || 'Organization',
      },
      template: {
        title: template?.title || 'Certificate of Attendance',
        bodyText: template?.bodyText || '',
        signatoryName: template?.signatoryName || '',
        signatoryTitle: template?.signatoryTitle || '',
      },
    });
  } catch (error: unknown) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error verifying certificate' },
      { status: 500 }
    );
  }
}
