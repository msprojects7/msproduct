/**
 * MS BACKSTAGE — STAGE 2 PRICING & DISCOUNT CALCULATION ENGINE
 *
 * Implements strict server-side pricing calculation, early-bird rules,
 * group discounts, and promo code validations.
 * Never trust pricing submitted by the client!
 */

export interface PriceRule {
  id: string;
  name: string;
  ruleType: 'early_bird' | 'group' | 'scheduled' | string;
  discountType: 'percentage' | 'fixed_amount' | string;
  discountValue: string | number;
  minQuantity: number;
  maxQuantity?: number | null;
  validFrom?: Date | string | null;
  validTo?: Date | string | null;
  isActive: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount' | 'free_ticket' | string;
  discountValue: string | number;
  applicableTicketIds?: unknown;
  minPurchaseAmount: string | number;
  maxTotalRedemptions?: number | null;
  currentRedemptions: number;
  maxRedemptionsPerUser: number;
  validFrom?: Date | string | null;
  validTo?: Date | string | null;
  isActive: boolean;
}

export interface TicketPricingInput {
  unitPrice: number;
  quantity: number;
  currency: string;
  rules?: PriceRule[];
  promoCode?: PromoCode | null;
  ticketId?: string;
  userRedemptionCount?: number;
}

export interface PricingCalculationResult {
  unitPrice: number;
  quantity: number;
  grossAmount: number;
  ruleDiscountAmount: number;
  appliedRule: { id: string; name: string; discountType: string; discountValue: number } | null;
  promoDiscountAmount: number;
  appliedPromo: { id: string; code: string; discountType: string; discountValue: number } | null;
  totalDiscountAmount: number;
  taxAmount: number;
  netPayableAmount: number;
  currency: string;
  isFree: boolean;
  breakdown: string;
}

/**
 * Calculates final pricing server-side with strict mathematical guarantees.
 */
export function calculateTicketPricing(input: TicketPricingInput): PricingCalculationResult {
  const {
    unitPrice,
    quantity,
    currency,
    rules = [],
    promoCode = null,
    ticketId,
    userRedemptionCount = 0,
  } = input;

  const validQty = Math.max(1, Math.floor(quantity));
  const safeUnitPrice = Math.max(0, Number(unitPrice) || 0);
  const grossAmount = Math.round(safeUnitPrice * validQty * 100) / 100;

  // 1. Evaluate Active Price Rules (Early Bird, Group Discounts, Scheduled)
  let bestRuleDiscount = 0;
  let appliedRule: PricingCalculationResult['appliedRule'] = null;
  const now = new Date();

  for (const rule of rules) {
    if (!rule.isActive) continue;

    // Check validity dates
    if (rule.validFrom && new Date(rule.validFrom).getTime() > now.getTime()) continue;
    if (rule.validTo && new Date(rule.validTo).getTime() < now.getTime()) continue;

    // Check quantity bounds
    if (validQty < (rule.minQuantity || 1)) continue;
    if (rule.maxQuantity && validQty > rule.maxQuantity) continue;

    // Calculate discount for this rule
    let discount = 0;
    const ruleVal = Number(rule.discountValue) || 0;

    if (rule.discountType === 'percentage') {
      const pct = Math.min(100, Math.max(0, ruleVal));
      discount = Math.round(((grossAmount * pct) / 100) * 100) / 100;
    } else {
      // Fixed amount discount per ticket or per order
      discount = Math.min(grossAmount, Math.round(ruleVal * 100) / 100);
    }

    if (discount > bestRuleDiscount) {
      bestRuleDiscount = discount;
      appliedRule = {
        id: rule.id,
        name: rule.name,
        discountType: rule.discountType,
        discountValue: ruleVal,
      };
    }
  }

  const postRuleAmount = Math.max(0, Math.round((grossAmount - bestRuleDiscount) * 100) / 100);

  // 2. Evaluate Promo Code (if supplied)
  let promoDiscount = 0;
  let appliedPromo: PricingCalculationResult['appliedPromo'] = null;

  if (promoCode && promoCode.isActive) {
    let promoValid = true;

    // Time window
    if (promoCode.validFrom && new Date(promoCode.validFrom).getTime() > now.getTime()) {
      promoValid = false;
    }
    if (promoCode.validTo && new Date(promoCode.validTo).getTime() < now.getTime()) {
      promoValid = false;
    }

    // Ticket eligibility
    if (
      promoCode.applicableTicketIds &&
      Array.isArray(promoCode.applicableTicketIds) &&
      promoCode.applicableTicketIds.length > 0
    ) {
      if (ticketId && !promoCode.applicableTicketIds.includes(ticketId)) {
        promoValid = false;
      }
    }

    // Minimum purchase amount check (evaluated against gross amount)
    const minPurchase = Number(promoCode.minPurchaseAmount) || 0;
    if (grossAmount < minPurchase) {
      promoValid = false;
    }

    // Total redemption limit check
    if (
      promoCode.maxTotalRedemptions !== null &&
      promoCode.maxTotalRedemptions !== undefined &&
      promoCode.currentRedemptions >= promoCode.maxTotalRedemptions
    ) {
      promoValid = false;
    }

    // Per-user redemption limit check
    if (
      promoCode.maxRedemptionsPerUser &&
      userRedemptionCount >= promoCode.maxRedemptionsPerUser
    ) {
      promoValid = false;
    }

    if (promoValid) {
      const promoVal = Number(promoCode.discountValue) || 0;

      if (promoCode.discountType === 'free_ticket') {
        promoDiscount = postRuleAmount; // 100% discount
      } else if (promoCode.discountType === 'percentage') {
        const pct = Math.min(100, Math.max(0, promoVal));
        promoDiscount = Math.round(((postRuleAmount * pct) / 100) * 100) / 100;
      } else {
        // fixed amount
        promoDiscount = Math.min(postRuleAmount, Math.round(promoVal * 100) / 100);
      }

      appliedPromo = {
        id: promoCode.id,
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoVal,
      };
    }
  }

  const totalDiscount = Math.round((bestRuleDiscount + promoDiscount) * 100) / 100;
  const netPayable = Math.max(0, Math.round((grossAmount - totalDiscount) * 100) / 100);
  const taxAmount = 0.0; // Taxes separated; explicit zero unless configured

  let breakdown = `${currency} ${safeUnitPrice.toFixed(2)} x ${validQty} = ${currency} ${grossAmount.toFixed(2)}`;
  if (appliedRule) {
    breakdown += ` - [Rule: ${appliedRule.name}] ${currency} ${bestRuleDiscount.toFixed(2)}`;
  }
  if (appliedPromo) {
    breakdown += ` - [Promo: ${appliedPromo.code}] ${currency} ${promoDiscount.toFixed(2)}`;
  }
  breakdown += ` = ${currency} ${netPayable.toFixed(2)}`;

  return {
    unitPrice: safeUnitPrice,
    quantity: validQty,
    grossAmount,
    ruleDiscountAmount: bestRuleDiscount,
    appliedRule,
    promoDiscountAmount: promoDiscount,
    appliedPromo,
    totalDiscountAmount: totalDiscount,
    taxAmount,
    netPayableAmount: netPayable,
    currency,
    isFree: netPayable === 0,
    breakdown,
  };
}
