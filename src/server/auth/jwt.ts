import { SignJWT, jwtVerify } from "jose";

const JWT_ALGORITHM = "HS256" as const;
const MIN_SECRET_LENGTH = 32;

function getSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET wajib diatur dan minimal ${MIN_SECRET_LENGTH} karakter`);
  }
  return new TextEncoder().encode(value);
}

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
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionUser> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: [JWT_ALGORITHM],
  });
  if (!payload.sub || !payload.role || !["admin", "operator", "viewer"].includes(String(payload.role))) {
    throw new Error("Invalid session claims");
  }
  return {
    sub: Number(payload.sub),
    role: payload.role as SessionUser["role"],
    nama: String(payload.nama ?? ""),
    email: String(payload.email ?? ""),
  };
}
