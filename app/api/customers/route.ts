import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma-client-v2/index.js";
import { getSession } from "@/lib/auth";
import { serializeCustomer } from "@/lib/customer-directory";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";

function getWriteErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json(
      { error: "A customer with this phone number already exists." },
      { status: 409 },
    );
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      customers: customers.map(serializeCustomer),
    });
  } catch (error) {
    console.error("Customer list error:", error);

    return NextResponse.json(
      { error: "Unable to load customers right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsedBody = customerSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Enter valid customer details." },
        { status: 400 },
      );
    }

    const customer = await prisma.customer.create({
      data: parsedBody.data,
    });

    return NextResponse.json(
      {
        customer: serializeCustomer(customer),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Customer create error:", error);

    return getWriteErrorResponse(error, "Unable to save the customer right now.");
  }
}
