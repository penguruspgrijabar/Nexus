import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "inventaris-dev-secret-change-in-production",
);

export type SessionUser = {
  sub: number;
  role: "admin" | "operator" | "viewer";
  nama: string;
  email: string;
};

export async function signToken(user: SessionUser): Promise<string> {
  const { sub, ...claims } = user;
  return new SignJWT(claims)
    .setSubject(String(sub))
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionUser> {
  const { payload } = await jwtVerify(token, secret);
  return {
    sub: Number(payload.sub),
    role: payload.role as SessionUser["role"],
    nama: String(payload.nama ?? ""),
    email: String(payload.email ?? ""),
  };
}
