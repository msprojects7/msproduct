import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { eventWebsites } from '@/db/schema/index';
import { eq } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateWebsiteSchema = z.object({
  isPublished: z.boolean().default(true),
  theme: z.object({
    primaryColor: z.string().default('#2563eb'),
    secondaryColor: z.string().default('#4f46e5'),
    accentColor: z.string().default('#06b6d4'),
    darkMode: z.boolean().default(false),
  }).passthrough().default({
    primaryColor: '#2563eb',
    secondaryColor: '#4f46e5',
    accentColor: '#06b6d4',
    darkMode: false,
  }),
  heroTitle: z.string().max(255).optional().nullable(),
  heroSubtitle: z.string().optional().nullable(),
  heroCoverUrl: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  aboutText: z.string().optional().nullable(),
  sectionsConfig: z.array(z.object({
    id: z.string(),
    title: z.string(),
    isVisible: z.boolean(),
    displayOrder: z.number().int(),
  }).passthrough()).optional(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  address: z.string().optional().nullable(),
  footerText: z.string().optional().nullable(),
  socialLinks: z.record(z.string(), z.any()).optional().default({}),
  seoTitle: z.string().max(255).optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

/**
 * GET /api/events/[eventId]/website
 * Fetches event website configuration for organizers.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    let [website] = await db
      .select()
      .from(eventWebsites)
      .where(eq(eventWebsites.eventId, context.event.id))
      .limit(1);

    if (!website) {
      // Auto-create default website configuration for event
      const [created] = await db
        .insert(eventWebsites)
        .values({
          eventId: context.event.id,
          organizationId: context.organization.id,
          heroTitle: context.event.name,
          heroSubtitle: `Join us for ${context.event.name}. Register online today for official event passes.`,
          contactEmail: context.user.email,
        })
        .returning();
      website = created;
    }

    return NextResponse.json({
      success: true,
      website,
      event: {
        id: context.event.id,
        name: context.event.name,
        slug: context.event.slug,
        status: context.event.status,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/events/[eventId]/website
 * Updates website builder configuration, branding, section visibility, and theme.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_website');

    const body = await request.json();
    const parsed = updateWebsiteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      isPublished,
      theme,
      heroTitle,
      heroSubtitle,
      heroCoverUrl,
      logoUrl,
      aboutText,
      sectionsConfig,
      contactEmail,
      contactPhone,
      address,
      footerText,
      socialLinks,
      seoTitle,
      seoDescription,
    } = parsed.data;

    const [existing] = await db
      .select()
      .from(eventWebsites)
      .where(eq(eventWebsites.eventId, context.event.id))
      .limit(1);

    let updated;
    if (existing) {
      [updated] = await db
        .update(eventWebsites)
        .set({
          isPublished,
          theme,
          heroTitle: heroTitle || context.event.name,
          heroSubtitle,
          heroCoverUrl: heroCoverUrl || null,
          logoUrl: logoUrl || null,
          aboutText,
          sectionsConfig: sectionsConfig || existing.sectionsConfig,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          address,
          footerText,
          socialLinks,
          seoTitle,
          seoDescription,
          updatedAt: new Date(),
        })
        .where(eq(eventWebsites.id, existing.id))
        .returning();
    } else {
      [updated] = await db
        .insert(eventWebsites)
        .values({
          eventId: context.event.id,
          organizationId: context.organization.id,
          isPublished,
          theme,
          heroTitle: heroTitle || context.event.name,
          heroSubtitle,
          heroCoverUrl: heroCoverUrl || null,
          logoUrl: logoUrl || null,
          aboutText,
          sectionsConfig,
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          address,
          footerText,
          socialLinks,
          seoTitle,
          seoDescription,
        })
        .returning();
    }

    await recordAuditEvent({
      eventId: context.event.id,
      organizationId: context.organization.id,
      userId: context.user.id,
      action: 'event:update_website_builder',
      entityType: 'event_website',
      entityId: updated.id,
      details: { isPublished, theme },
    });

    return NextResponse.json({
      success: true,
      message: 'Website configuration updated successfully',
      website: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
