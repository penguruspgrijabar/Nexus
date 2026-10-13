import argon2 from "argon2";

export const hashPassword = (plain: string) => argon2.hash(plain); // argon2id
export const verifyPassword = (hash: string, plain: string) => argon2.verify(hash, plain);
