import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext, AuthorizationError } from '@/lib/auth/context';
import { db } from '@/db/index';
import { eventSettings } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const elementSchema = z.object({
  top: z.number().min(0).max(24),
  left: z.number().min(0).max(24),
  width: z.number().min(0.1).max(24),
  fontSize: z.number().min(0.05).max(3),
  color: z.string().regex(hexColorRegex, 'Invalid hex color'),
  textAlign: z.enum(['left', 'center', 'right']).optional().default('center'),
  visible: z.boolean().optional().default(true),
});

const qrSchema = z.object({
  top: z.number().min(0).max(24),
  left: z.number().min(0).max(24),
  size: z.number().min(0.2).max(10),
});

const badgeLayoutSchema = z.object({
  badgeWidthIn: z.number().min(1).max(24).default(4),
  badgeHeightIn: z.number().min(1).max(24).default(6),
  backgroundImageUrl: z.string().max(500).optional().nullable(),
  showBackground: z.boolean().default(true),
  registration: elementSchema,
  qr: qrSchema,
  name: elementSchema,
  category: elementSchema.optional(),
  organizationName: elementSchema.optional(),
  eventName: elementSchema.optional(),
  medicalCouncilNumber: elementSchema.optional(),
  pageSize: z
    .object({
      preset: z.enum(['A4', 'A6', 'A3', 'custom', 'single']).default('A6'),
      name: z.string().max(100).default('A6 (4 Badges per page • 2×2)'),
      width_mm: z.number().min(50).max(1000).default(210),
      height_mm: z.number().min(50).max(1000).default(297),
      columns: z.number().int().min(1).max(10).default(2),
      rows: z.number().int().min(1).max(10).default(2),
      badge_width_mm: z.number().min(20).max(500).optional(),
      badge_height_mm: z.number().min(20).max(500).optional(),
    })
    .optional(),
  spotSticker: z
    .object({
      preset: z.string().max(50).default('100x100'),
      name: z.string().max(100).default('100 × 100 mm'),
      width_mm: z.number().min(20).max(500).default(100),
      height_mm: z.number().min(20).max(500).default(100),
    })
    .optional(),
});

const DEFAULT_BADGE_LAYOUT = {
  badgeWidthIn: 4,
  badgeHeightIn: 6,
  backgroundImageUrl: '/Empty_Sample.png',
  showBackground: true,
  registration: {
    top: 2.10,
    left: 0.25,
    width: 3.50,
    fontSize: 0.22,
    color: '#cf252b',
    textAlign: 'center',
    visible: true,
  },
  qr: {
    top: 2.42,
    left: 1.35,
    size: 1.30,
  },
  name: {
    top: 3.85,
    left: 0.25,
    width: 3.50,
    fontSize: 0.25,
    color: '#0f172a',
    textAlign: 'center',
    visible: true,
  },
  category: {
    top: 4.55,
    left: 0.25,
    width: 3.50,
    fontSize: 0.20,
    color: '#475569',
    textAlign: 'center',
    visible: true,
  },
  pageSize: {
    preset: 'A6' as const,
    name: 'A6 (4 Badges per page • 2×2)',
    width_mm: 210,
    height_mm: 297,
    columns: 2,
    rows: 2,
    badge_width_mm: 105,
    badge_height_mm: 148.5,
  },
  spotSticker: {
    preset: '100x100',
    name: '100 × 100 mm (Square)',
    width_mm: 100,
    height_mm: 100,
  },
};

/**
 * GET /api/events/[eventId]/badges/layout
 * Retrieves the event's configured badge layout, or returns the default.
 * Requires 'event:view' permission.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    const [setting] = await db
      .select()
      .from(eventSettings)
      .where(
        and(
          eq(eventSettings.eventId, context.event.id),
          eq(eventSettings.key, 'badge_layout')
        )
      )
      .limit(1);

    const layout = setting ? setting.value : DEFAULT_BADGE_LAYOUT;

    return NextResponse.json({
      layout,
      isDefault: !setting,
      updatedAt: setting?.updatedAt || null,
      updatedBy: setting?.updatedBy || null,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Badge layout GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve badge layout' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[eventId]/badges/layout
 * Validates and updates the event's badge layout.
 * Requires 'event:update_settings' permission.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:update_settings');

    const body = await request.json().catch(() => null);
    const parsed = badgeLayoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid badge layout configuration', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const validatedLayout = parsed.data;

    // Persist layout atomically and record audit log
    const [savedSetting] = await db.transaction(async (tx) => {
      const [setting] = await tx
        .insert(eventSettings)
        .values({
          eventId: context.event.id,
          key: 'badge_layout',
          value: validatedLayout,
          updatedBy: context.user.id,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [eventSettings.eventId, eventSettings.key],
          set: {
            value: validatedLayout,
            updatedBy: context.user.id,
            updatedAt: new Date(),
          },
        })
        .returning();

      await recordAuditEvent(
        {
          organizationId: context.organization.id,
          eventId: context.event.id,
          userId: context.user.id,
          action: 'badge_layout:updated',
          entityType: 'event_settings',
          entityId: setting.id,
          details: {
            key: 'badge_layout',
            badgeWidthIn: validatedLayout.badgeWidthIn,
            badgeHeightIn: validatedLayout.badgeHeightIn,
            pageSize: validatedLayout.pageSize?.preset,
          },
          ipAddress: request.headers.get('x-forwarded-for') || null,
          userAgent: request.headers.get('user-agent') || null,
        },
        tx
      );

      return [setting];
    });

    return NextResponse.json({
      success: true,
      layout: savedSetting.value,
      updatedAt: savedSetting.updatedAt,
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Badge layout POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save badge layout' },
      { status: 500 }
    );
  }
}
