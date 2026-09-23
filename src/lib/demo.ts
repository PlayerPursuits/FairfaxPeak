// Fictional demo content: residents, businesses (with offers, photos and
// reviews) and civic organizations. Every demo account has User.isDemo = true
// so the whole set can be removed in one step before launch. All people,
// businesses and organizations here are made up.
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { seedBase, type CategorySlug } from "./base-content";

const DAY = 86_400_000;
const days = (n: number) => new Date(Date.now() + n * DAY);
const at = (n: number, hour: number, minute = 0) => {
  const d = days(n);
  d.setHours(hour, minute, 0, 0);
  return d;
};

type SeedBusiness = {
  owner: string;
  email: string;
  name: string;
  category: CategorySlug;
  tagline: string;
  description: string;
  phone: string;
  website?: string;
  street: string;
  hours: string;
  palette: number;
  ageDays: number;
  offers: {
    title: string;
    description: string;
    discount?: string;
    code?: string;
    terms?: string;
    exclusive?: boolean;
    endsIn?: number;
    ageDays: number;
  }[];
};

const BUSINESSES: SeedBusiness[] = [
  {
    owner: "Dana Whitfield",
    email: "owner@summitauto.example",
    name: "Summit Auto Care",
    category: "automotive",
    tagline: "Honest repairs and maintenance since 1998",
    description:
      "Family-owned full-service auto shop specializing in brakes, tune-ups, diagnostics, and state inspections.\n\nWe'll always call before doing any work, and we explain every repair in plain English. Free shuttle within Fairfax Peak.",
    phone: "(555) 201-4410",
    website: "https://summitauto.example",
    street: "412 Ridgeline Rd",
    hours: "Mon–Fri 7:30am–6pm\nSat 8am–2pm\nSun closed",
    palette: 0,
    ageDays: 40,
    offers: [
      { title: "$25 off any brake service", description: "Pads, rotors, or a full brake job.", discount: "$25 OFF", code: "PEAKBRAKES", ageDays: 2, endsIn: 30 },
      { title: "Free tire rotation with oil change", description: "Members get a complimentary rotation with any synthetic oil change.", discount: "FREE", exclusive: true, code: "MEMBERROTATE", ageDays: 6 },
    ],
  },
  {
    owner: "Priya Raman",
    email: "owner@peakfamilymed.example",
    name: "Peak Family Medicine",
    category: "medical",
    tagline: "Primary care for every stage of life",
    description:
      "Board-certified family physicians offering same-week appointments, annual physicals, pediatrics, and chronic care management. Most insurance accepted, and telehealth visits available.",
    phone: "(555) 201-8800",
    street: "90 Aspen Commons, Suite 200",
    hours: "Mon–Thu 8am–7pm\nFri 8am–5pm\nSat 9am–12pm",
    palette: 3,
    ageDays: 60,
    offers: [
      { title: "Free flu shot clinic", description: "Walk-in flu shots for all ages this season — no appointment needed.", discount: "FREE", ageDays: 1, endsIn: 45, terms: "While supplies last. Bring your insurance card." },
    ],
  },
  {
    owner: "Mia Castellanos",
    email: "owner@glowstudio.example",
    name: "Glow Wellness Studio",
    category: "wellness-beauty",
    tagline: "Massage, facials, and a moment to breathe",
    description:
      "A calm, light-filled studio offering therapeutic massage, custom facials, and brow & lash services. Our licensed therapists tailor every session to you.",
    phone: "(555) 201-3321",
    website: "https://glowstudio.example",
    street: "18 Mill Pond Ln",
    hours: "Tue–Sat 10am–8pm\nSun 11am–5pm\nMon closed",
    palette: 1,
    ageDays: 5,
    offers: [
      { title: "20% off your first massage", description: "New clients save on any 60 or 90 minute massage.", discount: "20% OFF", code: "GLOWNEW", ageDays: 0, endsIn: 60 },
      { title: "Members: complimentary add-on", description: "Free hot stone or aromatherapy upgrade with any service.", discount: "FREE ADD-ON", exclusive: true, code: "PEAKGLOW", ageDays: 3 },
    ],
  },
  {
    owner: "Marcus Bell",
    email: "owner@ridgelineplumbing.example",
    name: "Ridgeline Plumbing & Heating",
    category: "home-services",
    tagline: "24/7 emergency service — local and licensed",
    description:
      "Leaks, water heaters, furnaces, and full bathroom remodels. We're your neighbors, and we treat your home like our own. Upfront flat-rate pricing.",
    phone: "(555) 201-7700",
    street: "2250 Industrial Pkwy",
    hours: "Office: Mon–Fri 8am–5pm\nEmergency service 24/7",
    palette: 2,
    ageDays: 25,
    offers: [
      { title: "$50 off water heater install", description: "Tank or tankless. Includes haul-away of your old unit.", discount: "$50 OFF", code: "HOTWATER50", ageDays: 4, endsIn: 21 },
    ],
  },
  {
    owner: "Sam Okafor",
    email: "owner@trailheadcoffee.example",
    name: "Trailhead Coffee Co.",
    category: "restaurants-food",
    tagline: "Small-batch roasts and scratch-made pastries",
    description:
      "Fairfax Peak's neighborhood coffee house. We roast in-house every week and bake everything from scratch each morning. Plenty of seating, fast Wi-Fi, and a dog-friendly patio.",
    phone: "(555) 201-1234",
    website: "https://trailheadcoffee.example",
    street: "5 Main Street",
    hours: "Daily 6am–4pm",
    palette: 5,
    ageDays: 3,
    offers: [
      { title: "Free pastry with any latte", description: "Pick any pastry from the case with a latte purchase.", discount: "FREE PASTRY", exclusive: true, code: "TRAILHEAD", ageDays: 0 },
      { title: "Weekday happy hour", description: "Half-price drip coffee 2–4pm, Monday through Friday.", discount: "50% OFF", ageDays: 5 },
    ],
  },
  {
    owner: "Ellen Park",
    email: "owner@peakpaws.example",
    name: "Peak Paws Grooming",
    category: "pets",
    tagline: "Gentle grooming for dogs and cats",
    description: "Fear-free certified groomers, organic shampoos, and a spa day your pet will actually enjoy. Self-wash stations also available.",
    phone: "(555) 201-5566",
    street: "77 Birch Hollow Dr",
    hours: "Mon–Sat 9am–6pm",
    palette: 4,
    ageDays: 12,
    offers: [
      { title: "15% off first full groom", description: "Bath, cut, nails, and ears for new clients.", discount: "15% OFF", code: "NEWPUP", ageDays: 7, endsIn: 40 },
    ],
  },
  {
    owner: "Jordan Lee",
    email: "owner@peakfit.example",
    name: "Peak Fitness Collective",
    category: "fitness-recreation",
    tagline: "Strength, yoga, and trail running community",
    description: "A community gym with small-group strength classes, sunrise yoga, and weekly trail runs up Fairfax Peak. All levels welcome.",
    phone: "(555) 201-9090",
    website: "https://peakfit.example",
    street: "301 Summit Ave",
    hours: "Mon–Fri 5am–9pm\nSat–Sun 7am–5pm",
    palette: 2,
    ageDays: 80,
    offers: [],
  },
];

const CIVIC = [
  {
    owner: "Theresa Nguyen",
    email: "clerk@fairfaxpeak.example",
    name: "Town of Fairfax Peak",
    orgType: "Town Government",
    overview:
      "The Town of Fairfax Peak provides municipal services including planning & zoning, public works, parks, and permits. Town Council meets the first and third Tuesday of each month at Town Hall.",
    website: "https://town.fairfaxpeak.example",
    phone: "(555) 201-0100",
    street: "100 Main Street",
    contacts: [
      { name: "Theresa Nguyen", title: "Town Clerk", email: "clerk@fairfaxpeak.example", phone: "(555) 201-0101" },
      { name: "Robert Alvarez", title: "Director of Public Works", email: "publicworks@fairfaxpeak.example", phone: "(555) 201-0120" },
      { name: "Keisha Morgan", title: "Parks & Recreation Coordinator", email: "parks@fairfaxpeak.example" },
    ],
    events: [
      { title: "Town Council Meeting", description: "Regular session. Public comment period at the start of the meeting.", location: "Town Hall Council Chambers", start: at(6, 19), end: at(6, 21) },
      { title: "Fall Harvest Festival", description: "Live music, local vendors, hayrides, and a pie contest on the Town Green. Free for all ages!", location: "Fairfax Peak Town Green", start: at(11, 10), end: at(11, 16) },
      { title: "Community Trail Clean-Up", description: "Help keep Fairfax Peak beautiful. Gloves and bags provided; meet at the Summit Trailhead.", location: "Summit Trailhead parking lot", start: at(3, 9), end: at(3, 12) },
    ],
    resources: [
      { title: "Pay a utility bill", description: "Water and sewer billing, autopay enrollment.", url: "https://town.fairfaxpeak.example/pay", category: "Utilities" },
      { title: "Building permits", description: "Apply for residential and commercial permits online.", url: "https://town.fairfaxpeak.example/permits", category: "Housing" },
      { title: "Trash & recycling schedule", description: "Pickup days by neighborhood and holiday changes.", url: "https://town.fairfaxpeak.example/trash", category: "Utilities" },
      { title: "Park pavilion reservations", category: "Parks & Recreation", url: "https://town.fairfaxpeak.example/parks" },
    ],
  },
  {
    owner: "Harold Fitch",
    email: "director@fplibrary.example",
    name: "Fairfax Peak Public Library",
    orgType: "Public Library",
    overview: "Free access to books, digital media, maker space, and programs for all ages. Library cards are free for all Fairfax Peak residents.",
    website: "https://library.fairfaxpeak.example",
    phone: "(555) 201-0300",
    street: "22 Library Lane",
    contacts: [
      { name: "Harold Fitch", title: "Library Director", email: "director@fplibrary.example", phone: "(555) 201-0301" },
      { name: "Aisha Brooks", title: "Youth Services Librarian", email: "youth@fplibrary.example" },
    ],
    events: [
      { title: "Toddler Story Time", description: "Songs, stories, and play for ages 1–3 with a caregiver.", location: "Children's Room", start: at(2, 10, 30), end: at(2, 11, 15) },
      { title: "Tech Help Drop-In", description: "Bring your phone, tablet, or laptop — volunteers help with any question.", location: "Community Room", start: at(4, 14), end: at(4, 16) },
    ],
    resources: [
      { title: "Get a library card", url: "https://library.fairfaxpeak.example/card", category: "Education" },
      { title: "Homework help & tutoring", description: "Free online tutoring for K–12 students.", url: "https://library.fairfaxpeak.example/homework", category: "Education" },
    ],
  },
  {
    owner: "Chief Laura Dempsey",
    email: "chief@fpfire.example",
    name: "Fairfax Peak Volunteer Fire Department",
    orgType: "Public Safety",
    overview: "Serving Fairfax Peak with fire suppression, EMS, and community risk reduction. Always looking for new volunteers!",
    phone: "(555) 201-0911",
    street: "8 Firehouse Rd",
    contacts: [{ name: "Laura Dempsey", title: "Fire Chief", email: "chief@fpfire.example", phone: "(555) 201-0912" }],
    events: [{ title: "Fire Station Open House", description: "Tour the station, meet firefighters, and learn fire safety tips. Kids can climb aboard the trucks!", location: "Station 1", start: at(9, 11), end: at(9, 15) }],
    resources: [
      { title: "Free smoke detector installation", description: "Residents can request free detectors installed by volunteers.", url: "https://fire.fairfaxpeak.example/smoke", category: "Public Safety" },
      { title: "Become a volunteer firefighter", url: "https://fire.fairfaxpeak.example/join", category: "Volunteering" },
    ],
  },
];

const REVIEWERS = [
  ["Alex Rivera", "alex@example.com"],
  ["Jamie Chen", "jamie@example.com"],
  ["Taylor Brooks", "taylor@example.com"],
] as const;

const REVIEW_TEXT = [
  [5, "Absolutely wonderful", "Friendly, fast, and fair. This is exactly why I love shopping local in Fairfax Peak."],
  [4, "Great experience", "Really happy with the service. Took a little longer than expected but well worth it."],
  [5, "Highly recommend", "They went above and beyond. I've already told all my neighbors about them."],
] as const;

/** Demo sign-ins shown to the admin after loading. */
export const DEMO_LOGINS = [
  { role: "Resident", email: "resident@example.com" },
  { role: "Business (active)", email: "owner@trailheadcoffee.example" },
  { role: "Business (unpaid)", email: "owner@newbakery.example" },
  { role: "Civic", email: "clerk@fairfaxpeak.example" },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** A slug not already taken by a real listing. */
async function freeSlug(db: PrismaClient, kind: "business" | "civic", name: string) {
  const base = slugify(name);
  for (let i = 1; ; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const taken =
      kind === "business"
        ? await db.business.findUnique({ where: { slug }, select: { id: true } })
        : await db.civicOrg.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) return slug;
  }
}

export async function countDemoUsers(db: PrismaClient) {
  return db.user.count({ where: { isDemo: true } });
}

/**
 * Add the demo accounts and listings. Refuses if demo data is already loaded
 * or if any demo email is already registered by a real account.
 */
export async function loadDemoData(db: PrismaClient, password: string) {
  if ((await countDemoUsers(db)) > 0) throw new Error("Demo data is already loaded. Remove it first to reload.");
  const emails = [
    "resident@example.com",
    ...REVIEWERS.map(([, e]) => e),
    ...BUSINESSES.map((b) => b.email),
    "owner@newbakery.example",
    ...CIVIC.map((c) => c.email),
  ];
  const clash = await db.user.findFirst({ where: { email: { in: emails } }, select: { email: true } });
  if (clash) throw new Error(`${clash.email} is already registered, so demo data can't be loaded.`);

  const { community, categories } = await seedBase(db);
  const passwordHash = await bcrypt.hash(password, 10);

  const town = { city: "Fairfax Peak", state: "CO", zip: "80999" };

  const resident = await db.user.create({
    data: { email: "resident@example.com", name: "Riley Resident", passwordHash, isDemo: true, role: "PERSONAL", newsletter: "WEEKLY", ...town },
  });
  const reviewers = [];
  for (const [name, email] of REVIEWERS) {
    reviewers.push(await db.user.create({ data: { email, name, passwordHash, isDemo: true, role: "PERSONAL", newsletter: "DAILY" } }));
  }

  for (const [bi, b] of BUSINESSES.entries()) {
    const periodEnd = days(365);
    const created = await db.user.create({
      data: {
        email: b.email,
        name: b.owner,
        passwordHash,
        isDemo: true,
        role: "BUSINESS",
        business: {
          create: {
            communityId: community.id,
            categoryId: categories.get(b.category),
            name: b.name,
            slug: await freeSlug(db, "business", b.name),
            tagline: b.tagline,
            description: b.description,
            phone: b.phone,
            email: b.email,
            website: b.website,
            street: b.street,
            ...town,
            hours: b.hours,
            coverUrl: `/seed/photo-${b.palette}-1.svg`,
            subscriptionStatus: "ACTIVE",
            plan: bi % 2 ? "YEARLY" : "MONTHLY",
            currentPeriodEnd: periodEnd,
            createdAt: days(-b.ageDays),
            images: {
              create: [0, 1, 2].map((j) => ({ url: `/seed/photo-${b.palette}-${j}.svg`, caption: j === 0 ? `Welcome to ${b.name}` : null, sortOrder: j })),
            },
            offers: {
              create: b.offers.map((o) => ({
                title: o.title,
                description: o.description,
                discount: o.discount,
                code: o.code,
                terms: o.terms,
                exclusive: o.exclusive ?? false,
                startsAt: days(-o.ageDays - 1),
                createdAt: days(-o.ageDays),
                endsAt: o.endsIn ? days(o.endsIn) : null,
              })),
            },
          },
        },
      },
      include: { business: true },
    });

    // A couple of reviews on most businesses.
    const n = bi % 3 === 2 ? 1 : 3;
    for (let r = 0; r < n; r++) {
      const [rating, title, body] = REVIEW_TEXT[(bi + r) % REVIEW_TEXT.length];
      await db.review.create({
        data: { businessId: created.business!.id, userId: reviewers[r].id, rating, title, body, createdAt: days(-r - bi) },
      });
    }
  }

  // An unpaid business to demonstrate the membership flow.
  await db.user.create({
    data: {
      email: "owner@newbakery.example",
      name: "Nora Baker",
      passwordHash,
      isDemo: true,
      role: "BUSINESS",
      business: {
        create: {
          communityId: community.id,
          categoryId: categories.get("restaurants-food"),
          name: "Rise & Shine Bakery",
          slug: await freeSlug(db, "business", "Rise & Shine Bakery"),
          tagline: "Opening soon on Main Street",
          email: "owner@newbakery.example",
        },
      },
    },
  });

  for (const c of CIVIC) {
    await db.user.create({
      data: {
        email: c.email,
        name: c.owner,
        passwordHash,
        isDemo: true,
        role: "CIVIC",
        civicOrg: {
          create: {
            communityId: community.id,
            name: c.name,
            slug: await freeSlug(db, "civic", c.name),
            orgType: c.orgType,
            overview: c.overview,
            website: c.website,
            email: c.email,
            phone: c.phone,
            street: c.street,
            ...town,
            contacts: { create: c.contacts.map((x, i) => ({ ...x, sortOrder: i })) },
            events: { create: c.events.map((e) => ({ title: e.title, description: e.description, location: e.location, startsAt: e.start, endsAt: e.end })) },
            resources: { create: c.resources },
          },
        },
      },
    });
  }

  // Resident has claimed one members-only offer.
  const memberOffer = await db.offer.findFirst({ where: { exclusive: true, business: { owner: { isDemo: true } } } });
  if (memberOffer) await db.offerClaim.create({ data: { offerId: memberOffer.id, userId: resident.id } });
}

/** Delete every demo account. Their listings, offers, photos, reviews, events and claims cascade with them. */
export async function removeDemoData(db: PrismaClient) {
  const { count } = await db.user.deleteMany({ where: { isDemo: true } });
  return count;
}
