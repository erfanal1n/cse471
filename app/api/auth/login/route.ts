import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = loginSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Enter a valid email and password." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: parsedBody.data.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account was found with that email address." },
        { status: 401 },
      );
    }

    const passwordMatches = await compare(parsedBody.data.password, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "The password you entered is not correct." },
        { status: 401 },
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, token);

    return response;
  } catch {
    return NextResponse.json(
      { error: "The login service is not ready yet. Please try again." },
      { status: 500 },
    );
  }
}
