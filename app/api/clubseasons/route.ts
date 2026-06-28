import { NextResponse } from "next/server";
import { getIndex } from "@/lib/data";

// Lichte index voor het rad; mag agressief gecached worden.
export const revalidate = false;

export async function GET() {
  const idx = await getIndex();
  return NextResponse.json(idx, {
    // Kort cachen maar wel revalideren, zodat naam-/data-updates na een
    // deploy snel doorkomen (niet "immutable").
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=86400" },
  });
}
