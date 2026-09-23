import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { billingEnabled, stripe, syncSubscription } from "@/lib/stripe";

export async function POST(req: Request) {
  if (!billingEnabled || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 501 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription) {
        const sub = await stripe().subscriptions.retrieve(
          typeof session.subscription === "string" ? session.subscription : session.subscription.id,
        );
        await syncSubscription(sub, session.client_reference_id ?? session.metadata?.businessId ?? undefined);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await syncSubscription(sub, sub.metadata?.businessId || undefined);
      break;
    }
  }
  return NextResponse.json({ received: true });
}
