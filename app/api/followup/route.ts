import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been retired in v1.0. Use /api/roundtable.",
    },
    { status: 410 }
  );
}
