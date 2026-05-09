import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "The old voice-map share card is retired in v1.0." },
    { status: 410 },
  );
}
