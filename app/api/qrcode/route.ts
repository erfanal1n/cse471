import { type NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get("sku");

  if (!sku) {
    return NextResponse.json({ error: "SKU is required" }, { status: 400 });
  }

  try {
    // Generate QR code as a Data URL
    const qrCodeDataUrl = await QRCode.toDataURL(sku, {
      width: 600,
      margin: 2,
      color: {
        dark: "#0f172a", // Match your --text color
        light: "#ffffff",
      },
    });

    return NextResponse.json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error("QR Code generation error:", error);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
