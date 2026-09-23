export const SITE_NAME = "Fairfax Peak";
export const DEFAULT_COMMUNITY_SLUG = "fairfax-peak";

export const ROLES = ["PERSONAL", "BUSINESS", "CIVIC", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const NEWSLETTER_OPTIONS = ["NONE", "DAILY", "WEEKLY"] as const;
export type NewsletterFrequency = (typeof NEWSLETTER_OPTIONS)[number];

export const PLANS = {
  MONTHLY: { label: "Monthly", amountCents: 2000, interval: "month" as const, display: "$20 / month" },
  YEARLY: { label: "Yearly", amountCents: 20000, interval: "year" as const, display: "$200 / year" },
};
export type Plan = keyof typeof PLANS;

export const ACCOUNT_TYPES: { role: Exclude<Role, "ADMIN">; title: string; price: string; blurb: string }[] = [
  {
    role: "PERSONAL",
    title: "Resident",
    price: "Free",
    blurb: "Leave reviews, unlock member-only offers, and get the Fairfax Peak newsletter.",
  },
  {
    role: "BUSINESS",
    title: "Business Owner",
    price: "$20/mo or $200/yr",
    blurb: "A full listing with gallery, reviews, contact details, directions, and coupons.",
  },
  {
    role: "CIVIC",
    title: "Civic & Government",
    price: "Free",
    blurb: "Share your organization, points of contact, local events, and community resources.",
  },
];

export const RESOURCE_CATEGORIES = [
  "Public Safety",
  "Health & Human Services",
  "Parks & Recreation",
  "Education",
  "Transportation",
  "Utilities",
  "Housing",
  "Volunteering",
  "Other",
];
