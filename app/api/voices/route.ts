import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been retired in v0.7. Use /api/roundtable." },
    { status: 410 },
  );
}
