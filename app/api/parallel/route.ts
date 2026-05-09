import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been retired in v1.0. Use /api/task-frame, /api/roundtable, /api/alignment-inquiry, and /api/alignment-report.",
    },
    { status: 410 }
  );
}
