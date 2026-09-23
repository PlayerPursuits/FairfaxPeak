import { SignJWT, jwtVerify } from "jose";

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "");
}

/** Long-lived signed token for one-click newsletter unsubscribe links. */
export async function createUnsubscribeToken(userId: string) {
  return new SignJWT({ sub: userId, purpose: "unsubscribe" })
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret());
}

export async function verifyUnsubscribeToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.purpose === "unsubscribe" && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
