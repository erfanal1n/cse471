import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma-client/index.js";
import { getSession } from "@/lib/auth";
import { serializeOrder } from "@/lib/order-management";
import { buildOrderWriteData, OrderValidationError } from "@/lib/order-write";
import { prisma } from "@/lib/prisma";
import { orderSchema } from "@/lib/validators";

function getWriteErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof OrderValidationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json(
      { error: "An order with this order number already exists." },
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
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      orders: orders.map(serializeOrder),
    });
  } catch (error) {
    console.error("Order list error:", error);

    return NextResponse.json(
      { error: "Unable to load orders right now." },
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
    const parsedBody = orderSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Enter valid order details." },
        { status: 400 },
      );
    }

    const { orderData, itemData } = await buildOrderWriteData(parsedBody.data);

    const order = await prisma.order.create({
      data: {
        ...orderData,
        items: {
          create: itemData,
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(
      {
        order: serializeOrder(order),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Order create error:", error);

    return getWriteErrorResponse(error, "Unable to save the order right now.");
  }
}
