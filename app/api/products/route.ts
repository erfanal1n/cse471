import { NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { serializeProduct } from "@/lib/product-catalog";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";

function getWriteErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json(
      { error: "A product with this SKU already exists." },
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
    const products = await prisma.product.findMany({
      include: {
        supplier: {
          select: { name: true },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      products: products.map(serializeProduct),
    });
  } catch (error) {
    console.error("Product list error:", error);

    return NextResponse.json(
      { error: "Unable to load products right now." },
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
    const parsedBody = productSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Enter valid product details." },
        { status: 400 },
      );
    }

    const product = await prisma.product.create({
      data: parsedBody.data,
      include: {
        supplier: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(
      {
        product: serializeProduct(product),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Product create error:", error);

    return getWriteErrorResponse(error, "Unable to save the product right now.");
  }
}
