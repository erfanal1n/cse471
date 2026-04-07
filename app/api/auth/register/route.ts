import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedBody = registerSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Please check the form and try again." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: parsedBody.data.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "That email address is already linked to an account." },
        { status: 409 },
      );
    }

    const passwordHash = await hash(parsedBody.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsedBody.data.name,
        email: parsedBody.data.email,
        passwordHash,
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({ ok: true }, { status: 201 });
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      { error: "Database connection failed. Check the current database credentials." },
      { status: 500 },
    );
  }
}
