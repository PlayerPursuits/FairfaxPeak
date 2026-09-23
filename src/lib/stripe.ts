import "server-only";
import Stripe from "stripe";
import { db } from "./db";
import { PLANS, type Plan } from "./constants";

export const billingEnabled = Boolean(process.env.STRIPE_SECRET_KEY);

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

export function lineItemFor(plan: Plan): Stripe.Checkout.SessionCreateParams.LineItem {
  const priceId = plan === "MONTHLY" ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_YEARLY;
  if (priceId) return { price: priceId, quantity: 1 };
  const p = PLANS[plan];
  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: p.amountCents,
      recurring: { interval: p.interval },
      product_data: { name: `Fairfax Peak Business Listing (${p.label})` },
    },
  };
}

const STATUS_MAP: Record<string, string> = {
  active: "ACTIVE",
  trialing: "ACTIVE",
  past_due: "PAST_DUE",
  unpaid: "PAST_DUE",
  canceled: "CANCELED",
  incomplete_expired: "CANCELED",
  incomplete: "INACTIVE",
  paused: "INACTIVE",
};

/** Mirror a Stripe subscription onto the business record. */
export async function syncSubscription(sub: Stripe.Subscription, businessId?: string) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const interval = sub.items.data[0]?.price.recurring?.interval;
  const periodEnd = sub.items.data[0]?.current_period_end;
  const where = businessId ? { id: businessId } : { stripeCustomerId: customerId };
  await db.business.updateMany({
    where,
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      subscriptionStatus: STATUS_MAP[sub.status] ?? "INACTIVE",
      plan: interval === "year" ? "YEARLY" : "MONTHLY",
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
}
