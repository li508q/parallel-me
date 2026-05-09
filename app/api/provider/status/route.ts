import { NextResponse } from "next/server";
import { serverRuntimeStatus } from "@/lib/server-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(serverRuntimeStatus());
}
