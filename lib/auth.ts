import { NextRequest, NextResponse } from "next/server";

export function requireRouteSecret(request: NextRequest) {
  const expectedSecret = process.env.APP_ROUTE_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "Missing APP_ROUTE_SECRET environment variable." },
      { status: 500 }
    );
  }

  const headerSecret = request.headers.get("x-lineaudit-secret");
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const providedSecret = headerSecret || bearer || querySecret;

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
