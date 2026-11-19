import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { attendees, importBatches } from '@/db/schema/index';
import { eq, inArray } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * Sanitizes spreadsheet cell strings to prevent CSV/Formula injection attacks.
 */
function sanitizeFormula(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = String(value).trim();
  // Strip dangerous formula trigger characters if placed at the start of a cell
  while (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    str = str.substring(1).trim();
  }
  return str;
}

export interface ImportRowInput {
  [key: string]: unknown;
  name: string;
  registrationNumber?: string;
  category: string;
  phoneNumber?: string;
  email?: string;
  foodPreference?: string;
  paymentStatus?: string;
  gender?: string;
  medicalCouncilNumber?: string;
}

/**
 * GET /api/events/[eventId]/import
 * Lists previous import batches for the event.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const batches = await db
      .select()
      .from(importBatches)
      .where(eq(importBatches.eventId, context.event.id))
      .orderBy(importBatches.createdAt);

    return NextResponse.json({ batches });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/events/[eventId]/import
 * Performs multi-tenant bulk import of attendees into an event.
 * Validates columns, sanitizes formulas, catches duplicates, creates an import_batch record,
 * and writes an immutable audit log entry.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:import_attendees');

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid import payload: "rows" array is required and must not be empty.' },
        { status: 400 }
      );
    }

    const fileName = (body.fileName && typeof body.fileName === 'string')
      ? body.fileName.trim().slice(0, 255)
      : 'imported_attendees.xlsx';

    const inputRows: ImportRowInput[] = body.rows;
    if (inputRows.length > 5000) {
      return NextResponse.json(
        { error: 'Import batch size exceeds the limit of 5,000 attendees per batch.' },
        { status: 400 }
      );
    }

    // Enforce Plan Attendee Capacity & Extra Attendee Quotas
    const { checkAttendeeCapacity } = await import('@/lib/payments/capacity');
    const capacityCheck = await checkAttendeeCapacity(context.organization.id, context.event.id, inputRows.length);
    if (!capacityCheck.allowed) {
      return NextResponse.json(
        {
          error: capacityCheck.reason,
          code: 'CAPACITY_LIMIT_EXCEEDED',
          details: {
            currentCount: capacityCheck.currentCount,
            maxAllowed: capacityCheck.maxAllowed,
            planId: capacityCheck.planId,
            planName: capacityCheck.planName,
            isExpired: capacityCheck.isExpired,
            upgradeRequired: capacityCheck.upgradeRequired,
            payExtraAllowed: capacityCheck.payExtraAllowed,
            extraAttendeePriceInPaise: capacityCheck.extraAttendeePriceInPaise,
          },
        },
        { status: 403 }
      );
    }

    // Step 1: Pre-validate and normalize rows in memory
    const validRows: Array<{
      index: number;
      name: string;
      registrationNumber: string;
      category: string;
      phoneNumber: string | null;
      email: string | null;
      foodPreference: string;
      paymentStatus: string;
      gender: string | null;
      medicalCouncilNumber: string | null;
    }> = [];

    const rejectedRows: Array<{
      rowNumber: number;
      reason: string;
      data: Record<string, unknown>;
    }> = [];

    const seenRegNumbersInBatch = new Set<string>();

    inputRows.forEach((row, idx) => {
      const rowNum = idx + 1;
      const rawName = sanitizeFormula(row.name);
      const rawCategory = sanitizeFormula(row.category);
      let rawRegNo = sanitizeFormula(row.registrationNumber);

      if (!rawName) {
        rejectedRows.push({
          rowNumber: rowNum,
          reason: 'Missing attendee name',
          data: row,
        });
        return;
      }

      if (!rawCategory) {
        rejectedRows.push({
          rowNumber: rowNum,
          reason: 'Missing category',
          data: row,
        });
        return;
      }

      // Auto-assign sequential registration number if omitted
      if (!rawRegNo) {
        rawRegNo = `REG-${Date.now().toString(36).toUpperCase()}-${idx + 1}`;
      }

      const regKey = rawRegNo.toLowerCase();
      if (seenRegNumbersInBatch.has(regKey)) {
        rejectedRows.push({
          rowNumber: rowNum,
          reason: `Duplicate registration number within file: "${rawRegNo}"`,
          data: row,
        });
        return;
      }

      seenRegNumbersInBatch.add(regKey);

      validRows.push({
        index: idx,
        name: rawName.slice(0, 255),
        registrationNumber: rawRegNo.slice(0, 100),
        category: rawCategory.slice(0, 100),
        phoneNumber: row.phoneNumber ? sanitizeFormula(row.phoneNumber).slice(0, 50) : null,
        email: row.email ? sanitizeFormula(row.email).toLowerCase().slice(0, 255) : null,
        foodPreference: row.foodPreference ? sanitizeFormula(row.foodPreference).slice(0, 50) : 'Not Specified',
        paymentStatus: row.paymentStatus ? sanitizeFormula(row.paymentStatus).slice(0, 50) : 'Paid',
        gender: row.gender ? sanitizeFormula(row.gender).slice(0, 50) : null,
        medicalCouncilNumber: row.medicalCouncilNumber ? sanitizeFormula(row.medicalCouncilNumber).slice(0, 100) : null,
      });
    });

    // Step 2: Check for collisions against existing database records for this event
    const regNumbersToCheck = validRows.map((r) => r.registrationNumber);
    const existingDuplicates = new Set<string>();

    if (regNumbersToCheck.length > 0) {
      // Chunk check in blocks of 500
      for (let i = 0; i < regNumbersToCheck.length; i += 500) {
        const slice = regNumbersToCheck.slice(i, i + 500);
        const matches = await db
          .select({ regNo: attendees.registrationNumber })
          .from(attendees)
          .where(
            eq(attendees.eventId, context.event.id)
          );
        
        matches.forEach((m) => {
          if (regNumbersToCheck.includes(m.regNo)) {
            existingDuplicates.add(m.regNo.toLowerCase());
          }
        });
      }
    }

    // Filter out rows that collide with existing attendees in database
    const finalToInsert: typeof validRows = [];
    validRows.forEach((row) => {
      if (existingDuplicates.has(row.registrationNumber.toLowerCase())) {
        rejectedRows.push({
          rowNumber: row.index + 1,
          reason: `Registration number "${row.registrationNumber}" already exists for this event`,
          data: row,
        });
      } else {
        finalToInsert.push(row);
      }
    });

    // Step 3: Run atomic insertion
    const [batchRecord] = await db
      .insert(importBatches)
      .values({
        eventId: context.event.id,
        fileName,
        rowCount: inputRows.length,
        importedCount: finalToInsert.length,
        rejectedCount: rejectedRows.length,
        rejectionSummary: rejectedRows.slice(0, 100), // persist top 100 error details
        createdBy: context.user.id,
      })
      .returning();

    if (finalToInsert.length > 0) {
      // Chunk insert into attendees table
      const CHUNK_SIZE = 250;
      for (let i = 0; i < finalToInsert.length; i += CHUNK_SIZE) {
        const chunk = finalToInsert.slice(i, i + CHUNK_SIZE);
        await db.insert(attendees).values(
          chunk.map((item) => ({
            eventId: context.event.id,
            importBatchId: batchRecord.id,
            name: item.name,
            registrationNumber: item.registrationNumber,
            category: item.category,
            phoneNumber: item.phoneNumber,
            email: item.email,
            foodPreference: item.foodPreference,
            paymentStatus: item.paymentStatus,
            gender: item.gender,
            medicalCouncilNumber: item.medicalCouncilNumber,
            registrationType: 'pre_registered',
            attendanceStatus: 'not_checked_in',
            createdBy: context.user.id,
          }))
        );
      }
    }

    // Step 4: Write audit log
    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'attendee.imported_batch',
      entityType: 'import_batch',
      entityId: batchRecord.id,
      details: {
        fileName,
        totalRows: inputRows.length,
        importedCount: finalToInsert.length,
        rejectedCount: rejectedRows.length,
      },
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      success: true,
      batch: batchRecord,
      summary: {
        totalRows: inputRows.length,
        importedCount: finalToInsert.length,
        rejectedCount: rejectedRows.length,
      },
      errors: rejectedRows,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
