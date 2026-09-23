"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { getCommunity } from "@/lib/community";
import { uniqueSlug } from "@/lib/slugs";
import { fieldErrors, str, type FormState } from "@/lib/forms";

const registerSchema = z
  .object({
    role: z.enum(["PERSONAL", "BUSINESS", "CIVIC"]),
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email("Enter a valid email").max(200),
    password: z.string().min(8, "Use at least 8 characters").max(200),
    newsletter: z.enum(["NONE", "DAILY", "WEEKLY"]).default("NONE"),
    orgName: z.string().max(120).optional(),
    categoryId: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.role !== "PERSONAL" && !v.orgName) {
      ctx.addIssue({
        code: "custom",
        path: ["orgName"],
        message: v.role === "BUSINESS" ? "Business name is required" : "Organization name is required",
      });
    }
  });

function safeNext(next: string | undefined, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    role: str(fd, "role"),
    name: str(fd, "name"),
    email: str(fd, "email")?.toLowerCase(),
    password: fd.get("password"),
    newsletter: str(fd, "newsletter") ?? "NONE",
    orgName: str(fd, "orgName"),
    categoryId: str(fd, "categoryId"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);
  const v = parsed.data;

  if (await db.user.findUnique({ where: { email: v.email }, select: { id: true } })) {
    return { error: "An account with that email already exists.", fieldErrors: { email: "Already registered — try signing in." } };
  }

  const community = await getCommunity();
  const passwordHash = await bcrypt.hash(v.password, 10);

  const user = await db.user.create({
    data: {
      email: v.email,
      name: v.name,
      passwordHash,
      role: v.role,
      newsletter: v.newsletter,
      ...(v.role === "BUSINESS" && {
        business: {
          create: {
            name: v.orgName!,
            slug: await uniqueSlug(v.orgName!, "business"),
            communityId: community.id,
            categoryId: v.categoryId || null,
            email: v.email,
          },
        },
      }),
      ...(v.role === "CIVIC" && {
        civicOrg: {
          create: {
            name: v.orgName!,
            slug: await uniqueSlug(v.orgName!, "civic"),
            communityId: community.id,
            email: v.email,
            contacts: { create: [{ name: v.name, email: v.email }] },
          },
        },
      }),
    },
  });

  await createSession(user.id);
  if (v.role === "BUSINESS") redirect("/account/billing?welcome=1");
  if (v.role === "CIVIC") redirect("/account/civic?welcome=1");
  redirect(safeNext(str(fd, "next"), "/account?welcome=1"));
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email")?.toLowerCase();
  const password = fd.get("password");
  if (!email || typeof password !== "string" || !password) return { error: "Enter your email and password." };

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "That email and password don't match our records." };
  }
  await createSession(user.id);
  redirect(safeNext(str(fd, "next"), "/account"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
