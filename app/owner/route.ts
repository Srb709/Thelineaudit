import { NextRequest, NextResponse } from "next/server";
import { OWNER_KEY } from "@/lib/owner";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (!key || key !== OWNER_KEY) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";

  const response = NextResponse.redirect(url);
  response.cookies.set("lineaudit_owner", OWNER_KEY, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
