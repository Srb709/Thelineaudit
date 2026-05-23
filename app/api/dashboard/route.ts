import { NextRequest, NextResponse } from "next/server";
import { requireRouteSecret } from "@/lib/auth";
import { getDashboardData } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const guard = requireRouteSecret(request);
  if (guard) {
    return guard;
  }

  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dashboard failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
