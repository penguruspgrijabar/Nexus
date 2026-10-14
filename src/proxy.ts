import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_ALGORITHM = "HS256" as const;

function getMiddlewareSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET wajib diatur");
  return new TextEncoder().encode(value);
}

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get("token")?.value;
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, getMiddlewareSecret(), { algorithms: [JWT_ALGORITHM] });
      valid = true;
    } catch {
      valid = false;
    }
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!valid && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (valid && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
