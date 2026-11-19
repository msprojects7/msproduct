import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { registrationForms, registrationFormFields } from '@/db/schema/index';
import { eq, and, sql } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ALLOWED_FIELD_TYPES = [
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'dropdown',
  'radio',
  'checkbox',
  'date',
  'country',
  'state',
  'address',
  'url',
  'file',
  'consent',
  'section',
  'info',
] as const;

const createFieldSchema = z.object({
  fieldKey: z
    .string()
    .trim()
    .min(1, 'Field key is required')
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Field key must be lowercase letters, numbers, and underscores only (e.g. medical_license)'),
  fieldLabel: z.string().trim().min(1, 'Field label is required').max(255),
  fieldType: z.enum(ALLOWED_FIELD_TYPES),
  description: z.string().trim().optional().nullable(),
  placeholder: z.string().trim().max(255).optional().nullable(),
  isRequired: z.boolean().default(false),
  defaultValue: z.string().optional().nullable(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional().nullable(),
  validationRules: z.record(z.string(), z.any()).optional().nullable(),
  conditionalLogic: z.object({
    dependsOnFieldKey: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains']),
    value: z.any(),
  }).optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  isVisible: z.boolean().default(true),
});

/**
 * POST /api/events/[eventId]/registration-forms/fields
 * Appends a new custom field to the event's registration form.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_registration_forms');

    // Ensure form exists
    let [form] = await db
      .select()
      .from(registrationForms)
      .where(eq(registrationForms.eventId, context.event.id))
      .limit(1);

    if (!form) {
      const [newForm] = await db
        .insert(registrationForms)
        .values({
          eventId: context.event.id,
          title: `${context.event.name} Registration Form`,
        })
        .returning();
      form = newForm;
    }

    const body = await request.json().catch(() => null);
    const parsed = createFieldSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check duplicate field key in this form
    const [existingKey] = await db
      .select({ id: registrationFormFields.id })
      .from(registrationFormFields)
      .where(and(
        eq(registrationFormFields.formId, form.id),
        eq(registrationFormFields.fieldKey, data.fieldKey)
      ))
      .limit(1);

    if (existingKey) {
      return NextResponse.json(
        { error: `Field key '${data.fieldKey}' is already used in this form. Keys must be unique.` },
        { status: 400 }
      );
    }

    // Determine default display order if not provided
    let finalOrder = data.displayOrder;
    if (finalOrder === undefined) {
      const [maxOrder] = await db
        .select({ max: sql<number>`coalesce(max(${registrationFormFields.displayOrder}), -1)` })
        .from(registrationFormFields)
        .where(eq(registrationFormFields.formId, form.id));
      finalOrder = (maxOrder?.max ?? -1) + 1;
    }

    const [createdField] = await db
      .insert(registrationFormFields)
      .values({
        formId: form.id,
        eventId: context.event.id,
        fieldKey: data.fieldKey,
        fieldLabel: data.fieldLabel,
        fieldType: data.fieldType,
        description: data.description,
        placeholder: data.placeholder,
        isRequired: data.isRequired,
        defaultValue: data.defaultValue,
        options: data.options || null,
        validationRules: data.validationRules || null,
        conditionalLogic: data.conditionalLogic || null,
        displayOrder: finalOrder,
        isVisible: data.isVisible,
      })
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'registration_field.create',
      entityType: 'registration_form_field',
      entityId: createdField.id,
      details: {
        fieldKey: createdField.fieldKey,
        fieldLabel: createdField.fieldLabel,
        fieldType: createdField.fieldType,
      },
    });

    return NextResponse.json({ status: 'ok', field: createdField }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
