import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { executeCheckInOperation } from '@/lib/attendance/checkin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const overrideSchema = z.object({
  attendeeId: z.string().uuid().optional().nullable(),
  registrationNumber: z.string().trim().optional().nullable(),
  qrToken: z.string().trim().optional().nullable(),
  reason: z.string().trim().min(3, 'A valid justification reason is required for check-in override'),
  action: z.enum(['check_in', 'check_out']).default('check_in'),
  deviceInfo: z.string().trim().max(255).optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:override_checkin');

    const body = await request.json().catch(() => null);
    const parsed = overrideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid override request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { attendeeId, registrationNumber, qrToken, reason, action, deviceInfo } = parsed.data;

    const result = await executeCheckInOperation({
      eventId: context.event.id,
      organizationId: context.organization.id,
      operatorUserId: context.user.id,
      attendeeId,
      registrationNumber,
      qrToken,
      action,
      isOverride: true,
      overrideReason: reason,
      deviceInfo: `[OPERATOR_OVERRIDE: ${context.user.email}] ${deviceInfo || ''}`,
      ipAddress: request.headers.get('x-forwarded-for') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    const statusCode = result.success ? 200 : 400;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    return handleApiError(error);
  }
}
