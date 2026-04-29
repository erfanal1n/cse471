import { NextResponse } from "next/server";

import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { serializeSupplier } from "@/lib/supplier-management";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/validators";

function getWriteErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json(
      { error: "A supplier with this phone number already exists." },
      { status: 409 },
    );
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id } = await params;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsedBody = supplierSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Enter valid supplier details." },
        { status: 400 },
      );
    }

    const { productIds, ...supplierData } = parsedBody.data;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...supplierData,
        products: productIds !== undefined ? {
          set: productIds.map(id => ({ id }))
        } : undefined,
      },
      include: {
        products: {
          select: { id: true, name: true, sku: true },
        },
      },
    });

    return NextResponse.json({
      supplier: serializeSupplier(supplier),
    });
  } catch (error) {
    console.error("Supplier update error:", error);

    return getWriteErrorResponse(error, "Unable to update the supplier right now.");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id } = await params;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    // Check if supplier has linked products
    const linkedProductsCount = await prisma.product.count({
      where: { supplierId: id },
    });

    if (linkedProductsCount > 0) {
      return NextResponse.json(
        { error: `This supplier is linked to ${linkedProductsCount} products and cannot be deleted.` },
        { status: 400 },
      );
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Supplier delete error:", error);

    return NextResponse.json(
      { error: "Unable to delete the supplier right now." },
      { status: 500 },
    );
  }
}
