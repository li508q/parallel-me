import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been retired. Use /api/focus, /api/voices, /api/clarify, and /api/nowme for five-voice sessions.",
    },
    { status: 410 }
  );
}
