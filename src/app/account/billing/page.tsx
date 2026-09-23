import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { billingEnabled, stripe, syncSubscription } from "@/lib/stripe";
import { cancelDemoSubscription, openBillingPortal, startCheckout } from "@/app/actions/business";
import { SubmitButton } from "@/components/form";
import { PLANS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Notice, Section } from "../Section";

export const metadata: Metadata = { title: "Membership & billing" };

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  PAST_DUE: "Payment past due",
  CANCELED: "Canceled",
  INACTIVE: "Not active",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; welcome?: string; demo?: string; session_id?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireRole("BUSINESS", "/account/billing");
  let b = await db.business.findUnique({ where: { ownerId: user.id } });
  if (!b) redirect("/account");

  // Returning from Checkout: sync immediately rather than waiting for the webhook.
  if (billingEnabled && sp.session_id && b.subscriptionStatus !== "ACTIVE") {
    try {
      const session = await stripe().checkout.sessions.retrieve(sp.session_id, { expand: ["subscription"] });
      if (session.client_reference_id === b.id && session.subscription && typeof session.subscription !== "string") {
        await syncSubscription(session.subscription, b.id);
        b = await db.business.findUniqueOrThrow({ where: { id: b.id } });
      }
    } catch (err) {
      console.error("billing: could not sync checkout session", err);
    }
  }

  const active = b.subscriptionStatus === "ACTIVE";

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Membership & billing</h1>
      {sp.welcome && <Notice>Your account is created! Choose a membership plan to publish {b.name} in the directory.</Notice>}
      {sp.success && active && (
        <Notice>
          You’re all set — {b.name} is now live. <Link href="/account/business">Finish your profile →</Link>
        </Notice>
      )}
      {sp.canceled && <Notice tone="warn">Checkout was canceled. You can choose a plan any time.</Notice>}
      {!billingEnabled && (
        <Notice tone="warn">
          <strong>Demo billing mode:</strong> Stripe keys aren’t configured, so choosing a plan activates the listing without payment.
        </Notice>
      )}

      <Section title="Current membership">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-stone-500 uppercase">Status</dt>
            <dd className={`font-semibold ${active ? "text-brand-700" : "text-red-600"}`}>{STATUS_LABEL[b.subscriptionStatus] ?? b.subscriptionStatus}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500 uppercase">Plan</dt>
            <dd className="font-semibold">{b.plan ? PLANS[b.plan as keyof typeof PLANS].display : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500 uppercase">{active ? "Renews" : "Period end"}</dt>
            <dd className="font-semibold">{b.currentPeriodEnd ? formatDate(b.currentPeriodEnd) : "—"}</dd>
          </div>
        </dl>
        {active && (
          <div className="mt-6">
            {billingEnabled && b.stripeCustomerId ? (
              <form action={openBillingPortal}>
                <SubmitButton className="btn-outline" pendingText="Opening…">
                  Manage payment & plan
                </SubmitButton>
              </form>
            ) : !billingEnabled ? (
              <form action={cancelDemoSubscription}>
                <SubmitButton className="btn-danger" pendingText="Canceling…">
                  Cancel membership (demo)
                </SubmitButton>
              </form>
            ) : null}
          </div>
        )}
      </Section>

      {!active && (
        <div className="grid gap-5 sm:grid-cols-2">
          {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((key) => {
            const p = PLANS[key];
            return (
              <form key={key} action={startCheckout} className={`card flex flex-col p-6 ${key === "YEARLY" ? "border-2 border-brand-600" : ""}`}>
                <input type="hidden" name="plan" value={key} />
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{p.label}</h2>
                  {key === "YEARLY" && <span className="badge bg-accent-400 text-brand-900">2 months free</span>}
                </div>
                <p className="mt-2 font-display text-4xl text-brand-800">
                  ${p.amountCents / 100}
                  <span className="text-base font-normal text-stone-500">/{p.interval}</span>
                </p>
                <ul className="mt-4 mb-6 space-y-1.5 text-sm text-stone-700">
                  <li>✓ Full profile with overview & category</li>
                  <li>✓ Image gallery (up to 24 photos)</li>
                  <li>✓ Customer reviews & star rating</li>
                  <li>✓ Contact info, map & directions</li>
                  <li>✓ Unlimited coupons & special offers</li>
                  <li>✓ Featured in the resident newsletter</li>
                </ul>
                <SubmitButton className={`${key === "YEARLY" ? "btn-primary" : "btn-outline"} mt-auto w-full`} pendingText="Redirecting…">
                  Choose {p.label.toLowerCase()}
                </SubmitButton>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
