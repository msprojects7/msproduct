import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { registrationForms, registrationFormFields } from '@/db/schema/index';
import { eq, asc } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateFormSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional().nullable(),
  isPublished: z.boolean().optional(),
  settings: z.record(z.string(), z.any()).optional().nullable(),
});

/**
 * Default registration fields initialized for any new event registration form.
 */
const DEFAULT_FIELDS = [
  {
    fieldKey: 'name',
    fieldLabel: 'Full Name',
    fieldType: 'text',
    placeholder: 'e.g. Dr. Jane Doe',
    isRequired: true,
    displayOrder: 0,
  },
  {
    fieldKey: 'email',
    fieldLabel: 'Email Address',
    fieldType: 'email',
    placeholder: 'jane@example.com',
    isRequired: true,
    displayOrder: 1,
  },
  {
    fieldKey: 'phoneNumber',
    fieldLabel: 'Mobile Phone Number',
    fieldType: 'phone',
    placeholder: '+91 9876543210',
    isRequired: true,
    displayOrder: 2,
  },
  {
    fieldKey: 'category',
    fieldLabel: 'Attendee Category',
    fieldType: 'dropdown',
    isRequired: true,
    displayOrder: 3,
    options: [
      { label: 'Delegate', value: 'Delegate' },
      { label: 'Faculty', value: 'Faculty' },
      { label: 'Postgraduate / Student', value: 'Student' },
      { label: 'VIP / Guest', value: 'VIP' },
    ],
  },
  {
    fieldKey: 'foodPreference',
    fieldLabel: 'Dietary Preference',
    fieldType: 'radio',
    isRequired: false,
    displayOrder: 4,
    options: [
      { label: 'Vegetarian', value: 'Vegetarian' },
      { label: 'Non-Vegetarian', value: 'Non-Vegetarian' },
      { label: 'Jain Food', value: 'Jain' },
    ],
  },
];

/**
 * GET /api/events/[eventId]/registration-forms
 * Retrieves the event's registration form configuration and all fields in display order.
 * If no form exists, it creates the default registration form seamlessly.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:view');

    let [form] = await db
      .select()
      .from(registrationForms)
      .where(eq(registrationForms.eventId, context.event.id))
      .limit(1);

    // Auto-initialize standard form if not created yet
    if (!form) {
      const [newForm] = await db
        .insert(registrationForms)
        .values({
          eventId: context.event.id,
          title: `${context.event.name} Registration Form`,
          description: 'Please complete the registration form below to secure your event credentials.',
          isPublished: true,
          settings: {
            allowMultipleAttendees: false,
            notifyOrganizerOnSubmission: true,
            confirmationMessage: 'Thank you for registering! Your registration details have been recorded.',
          },
        })
        .returning();

      form = newForm;

      // Seed standard fields
      for (const field of DEFAULT_FIELDS) {
        await db.insert(registrationFormFields).values({
          formId: form.id,
          eventId: context.event.id,
          fieldKey: field.fieldKey,
          fieldLabel: field.fieldLabel,
          fieldType: field.fieldType,
          placeholder: field.placeholder || null,
          isRequired: field.isRequired,
          options: field.options || null,
          displayOrder: field.displayOrder,
          isVisible: true,
        });
      }
    }

    const fields = await db
      .select()
      .from(registrationFormFields)
      .where(eq(registrationFormFields.formId, form.id))
      .orderBy(asc(registrationFormFields.displayOrder), asc(registrationFormFields.createdAt));

    return NextResponse.json({
      status: 'ok',
      form,
      fields,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/events/[eventId]/registration-forms
 * Updates form meta properties (title, description, publish state, settings).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_registration_forms');

    const body = await request.json().catch(() => null);
    const parsed = updateFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    let [form] = await db
      .select()
      .from(registrationForms)
      .where(eq(registrationForms.eventId, context.event.id))
      .limit(1);

    if (!form) {
      const [created] = await db
        .insert(registrationForms)
        .values({
          eventId: context.event.id,
          title: data.title || `${context.event.name} Registration Form`,
          description: data.description,
          isPublished: data.isPublished ?? true,
          settings: data.settings || {},
        })
        .returning();
      form = created;
    } else {
      const updatePayload: Partial<typeof registrationForms.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.isPublished !== undefined) updatePayload.isPublished = data.isPublished;
      if (data.settings !== undefined) updatePayload.settings = data.settings;

      const [updated] = await db
        .update(registrationForms)
        .set(updatePayload)
        .where(eq(registrationForms.id, form.id))
        .returning();
      form = updated;
    }

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'registration_form.update',
      entityType: 'registration_form',
      entityId: form.id,
      details: {
        title: form.title,
        isPublished: form.isPublished,
      },
    });

    return NextResponse.json({ status: 'ok', form });
  } catch (error) {
    return handleApiError(error);
  }
}
