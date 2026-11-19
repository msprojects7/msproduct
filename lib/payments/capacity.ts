import { db } from "@/db/index";
import { organizations, attendees } from "@/db/schema/index";
import { eq, sql } from "drizzle-orm";
import { PLAN_TIERS } from "./plans";

export interface CapacityCheckResult {
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  planId: string;
  planName: string;
  isExpired: boolean;
  extraQuota: number;
  extraAttendeePriceInPaise: number;
  reason?: string;
  upgradeRequired?: boolean;
  payExtraAllowed?: boolean;
}

export async function checkAttendeeCapacity(
  organizationId: string,
  eventId: string,
  countToAdd: number = 1
): Promise<CapacityCheckResult> {
  const [org] = await db
    .select({
      id: organizations.id,
      planId: organizations.planId,
      planActivatedAt: organizations.planActivatedAt,
      planExpiresAt: organizations.planExpiresAt,
      extraAttendeesQuota: organizations.extraAttendeesQuota,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  let activePlanId = org?.planId || "free";
  let activatedAt = org?.planActivatedAt || null;
  let expiresAt = org?.planExpiresAt || null;
  const extraQuota = org?.extraAttendeesQuota || 0;

  if (activePlanId === "free") {
    if (!activatedAt) {
      activatedAt = org?.createdAt || new Date();
    }
    if (!expiresAt) {
      expiresAt = new Date(new Date(activatedAt).getTime() + 15 * 24 * 60 * 60 * 1000);
    }
  }

  const now = new Date();
  let isExpired = false;
  if (expiresAt && new Date(expiresAt).getTime() <= now.getTime()) {
    isExpired = true;
    if (activePlanId !== "free") {
      activePlanId = "free";
    }
  }

  const plan = PLAN_TIERS[activePlanId] || PLAN_TIERS.free;
  const maxAllowed = plan.maxAttendees + extraQuota;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(attendees)
    .where(eq(attendees.eventId, eventId));

  const projectedCount = count + countToAdd;

  if (isExpired) {
    return {
      allowed: false,
      currentCount: count,
      maxAllowed,
      planId: plan.id,
      planName: plan.name,
      isExpired: true,
      extraQuota,
      extraAttendeePriceInPaise: plan.extraAttendeePriceInPaise || 2000,
      reason: `Your ${plan.name} has expired. Please renew your plan to register attendees.`,
      upgradeRequired: true,
      payExtraAllowed: false,
    };
  }

  if (projectedCount > maxAllowed) {
    const isFree = plan.id === "free";
    const reason = isFree
      ? `Free Starter plan limit of ${plan.maxAttendees} attendees reached (${count}/${plan.maxAttendees}). Upgrade to Pro to register more attendees.`
      : `${plan.name} attendee capacity of ${maxAllowed} reached (${count}/${maxAllowed}). Extra attendees require ₹20 per attendee.`;

    return {
      allowed: false,
      currentCount: count,
      maxAllowed,
      planId: plan.id,
      planName: plan.name,
      isExpired: false,
      extraQuota,
      extraAttendeePriceInPaise: plan.extraAttendeePriceInPaise || 2000,
      reason,
      upgradeRequired: isFree,
      payExtraAllowed: !isFree,
    };
  }

  return {
    allowed: true,
    currentCount: count,
    maxAllowed,
    planId: plan.id,
    planName: plan.name,
    isExpired: false,
    extraQuota,
    extraAttendeePriceInPaise: plan.extraAttendeePriceInPaise || 2000,
  };
}
