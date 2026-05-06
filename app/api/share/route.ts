import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "The old voice-map share card is retired in v0.7." },
    { status: 410 },
  );
}
