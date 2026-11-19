import { NextRequest, NextResponse } from 'next/server';
import { requireEventContext } from '@/lib/auth/context';
import { handleApiError } from '@/lib/errors';
import { db } from '@/db/index';
import { registrationFormFields } from '@/db/schema/index';
import { eq, and } from 'drizzle-orm';
import { recordAuditEvent } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateFieldSchema = z.object({
  fieldLabel: z.string().trim().min(1).max(255).optional(),
  fieldType: z.enum([
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
  ]).optional(),
  description: z.string().trim().optional().nullable(),
  placeholder: z.string().trim().max(255).optional().nullable(),
  isRequired: z.boolean().optional(),
  defaultValue: z.string().optional().nullable(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional().nullable(),
  validationRules: z.record(z.string(), z.any()).optional().nullable(),
  conditionalLogic: z.object({
    dependsOnFieldKey: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains']),
    value: z.any(),
  }).optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
});

/**
 * PATCH /api/events/[eventId]/registration-forms/fields/[fieldId]
 * Updates field labels, options, validation rules, or conditional logic.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string; fieldId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_registration_forms');

    const [field] = await db
      .select()
      .from(registrationFormFields)
      .where(and(
        eq(registrationFormFields.id, params.fieldId),
        eq(registrationFormFields.eventId, context.event.id)
      ))
      .limit(1);

    if (!field) {
      return NextResponse.json({ error: 'Form field not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateFieldSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updatePayload: Partial<typeof registrationFormFields.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.fieldLabel !== undefined) updatePayload.fieldLabel = data.fieldLabel;
    if (data.fieldType !== undefined) updatePayload.fieldType = data.fieldType;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.placeholder !== undefined) updatePayload.placeholder = data.placeholder;
    if (data.isRequired !== undefined) updatePayload.isRequired = data.isRequired;
    if (data.defaultValue !== undefined) updatePayload.defaultValue = data.defaultValue;
    if (data.options !== undefined) updatePayload.options = data.options;
    if (data.validationRules !== undefined) updatePayload.validationRules = data.validationRules;
    if (data.conditionalLogic !== undefined) updatePayload.conditionalLogic = data.conditionalLogic;
    if (data.displayOrder !== undefined) updatePayload.displayOrder = data.displayOrder;
    if (data.isVisible !== undefined) updatePayload.isVisible = data.isVisible;

    const [updatedField] = await db
      .update(registrationFormFields)
      .set(updatePayload)
      .where(eq(registrationFormFields.id, field.id))
      .returning();

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'registration_field.update',
      entityType: 'registration_form_field',
      entityId: updatedField.id,
      details: {
        fieldKey: updatedField.fieldKey,
        changes: data,
      },
    });

    return NextResponse.json({ status: 'ok', field: updatedField });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/events/[eventId]/registration-forms/fields/[fieldId]
 * Deletes a custom registration form field.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; fieldId: string } }
) {
  try {
    const context = await requireEventContext(params.eventId);
    context.assertPermission('event:manage_registration_forms');

    const [field] = await db
      .select()
      .from(registrationFormFields)
      .where(and(
        eq(registrationFormFields.id, params.fieldId),
        eq(registrationFormFields.eventId, context.event.id)
      ))
      .limit(1);

    if (!field) {
      return NextResponse.json({ error: 'Form field not found' }, { status: 404 });
    }

    // Protect core fields (name, email) from deletion
    if (['name', 'email'].includes(field.fieldKey)) {
      return NextResponse.json(
        { error: 'Core fields (name, email) cannot be removed from the registration form' },
        { status: 400 }
      );
    }

    await db.delete(registrationFormFields).where(eq(registrationFormFields.id, field.id));

    await recordAuditEvent({
      organizationId: context.organization.id,
      eventId: context.event.id,
      userId: context.user.id,
      action: 'registration_field.delete',
      entityType: 'registration_form_field',
      entityId: field.id,
      details: {
        fieldKey: field.fieldKey,
        fieldLabel: field.fieldLabel,
      },
    });

    return NextResponse.json({
      status: 'ok',
      message: 'Field deleted successfully',
      deletedFieldId: field.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
