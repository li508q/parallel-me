import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been retired. Use /api/clarify with action='followup' instead.",
    },
    { status: 410 }
  );
}
