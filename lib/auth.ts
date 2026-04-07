import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload } from "jose";
import type { NextResponse } from "next/server";

const SESSION_COOKIE = "cse471_inventory_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionUser = {
  userId: string;
  email: string;
  name: string;
};

type SessionPayload = JWTPayload & SessionUser;

function getSessionSecret() {
  const authSecret = process.env.AUTH_SECRET;

  if (!authSecret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return new TextEncoder().encode(authSecret);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    userId: user.userId,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSessionSecret());
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const session = payload as SessionPayload;

    if (!session.userId || !session.email || !session.name) {
      return null;
    }

    return {
      userId: session.userId,
      email: session.email,
      name: session.name,
    };
  } catch {
    return null;
  }
}
