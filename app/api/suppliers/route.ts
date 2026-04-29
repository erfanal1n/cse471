import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma-client-v2/index.js";
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

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        products: {
          select: { id: true, name: true, sku: true },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      suppliers: suppliers.map(serializeSupplier),
    });
  } catch (error) {
    console.error("Supplier list error:", error);

    return NextResponse.json(
      { error: "Unable to load suppliers right now." },
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
    const parsedBody = supplierSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? "Enter valid supplier details." },
        { status: 400 },
      );
    }

    const { productIds, ...supplierData } = parsedBody.data;

    const supplier = await prisma.supplier.create({
      data: {
        ...supplierData,
        products: productIds?.length ? {
          connect: productIds.map(id => ({ id }))
        } : undefined,
      },
      include: {
        products: {
          select: { id: true, name: true, sku: true },
        },
      },
    });

    return NextResponse.json(
      {
        supplier: serializeSupplier(supplier),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Supplier create error:", error);

    return getWriteErrorResponse(error, "Unable to save the supplier right now.");
  }
}
