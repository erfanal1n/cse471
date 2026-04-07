import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma-client-v2/index.js";
import { getSession } from "@/lib/auth";
import { serializeCustomer } from "@/lib/customer-directory";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{
    customerId: string;
  }>;
};

function isValidObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

function getWriteErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A customer with this phone number already exists." },
        { status: 409 },
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { customerId } = await context.params;

  if (!isValidObjectId(customerId)) {
    return NextResponse.json({ error: "Invalid customer id." }, { status: 400 });
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

    const customer = await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: parsedBody.data,
    });

    return NextResponse.json({
      customer: serializeCustomer(customer),
    });
  } catch (error) {
    console.error("Customer update error:", error);

    return getWriteErrorResponse(error, "Unable to update the customer right now.");
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { customerId } = await context.params;

  if (!isValidObjectId(customerId)) {
    return NextResponse.json({ error: "Invalid customer id." }, { status: 400 });
  }

  try {
    await prisma.customer.delete({
      where: {
        id: customerId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Customer delete error:", error);

    return getWriteErrorResponse(error, "Unable to delete the customer right now.");
  }
}
