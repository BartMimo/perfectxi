import { NextResponse } from "next/server";
import { getSquad } from "@/lib/data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const squad = await getSquad(id);
  if (!squad) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }
  return NextResponse.json(squad);
}
