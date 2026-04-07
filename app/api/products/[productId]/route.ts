import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/index.js";
import { getSession } from "@/lib/auth";
import { serializeProduct } from "@/lib/product-catalog";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

function isValidObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

function getWriteErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A product with this SKU already exists." },
        { status: 409 },
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { productId } = await context.params;

  if (!isValidObjectId(productId)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
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

    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: parsedBody.data,
    });

    return NextResponse.json({
      product: serializeProduct(product),
    });
  } catch (error) {
    console.error("Product update error:", error);

    return getWriteErrorResponse(error, "Unable to update the product right now.");
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { productId } = await context.params;

  if (!isValidObjectId(productId)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  try {
    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Product delete error:", error);

    return getWriteErrorResponse(error, "Unable to delete the product right now.");
  }
}
