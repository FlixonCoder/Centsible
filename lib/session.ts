import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "centsible_session";
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "centsible-session-secret-key-32-chars-long-at-least"
);

export interface SessionPayload {
  userId: string;
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SESSION_SECRET);
}

export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Returns current session's userId.
 * Defaults to "priya" if no session exists, so the dashboard always has a default persona.
 */
export async function getSessionUserId(): Promise<string> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const decrypted = await decryptSession(token);
      if (decrypted?.userId) {
        return decrypted.userId;
      }
    }
  } catch {
    // If called outside request context or cookie failure
  }
  return "priya";
}

export async function setSessionUserId(userId: string): Promise<void> {
  const token = await encryptSession({ userId });
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function clearSession(): Promise<void> {
  cookies().delete(SESSION_COOKIE_NAME);
}

