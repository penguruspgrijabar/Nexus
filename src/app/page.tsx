import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";

/** Membaca cookie session → route blocking (bukan prerender). */
export const instant = false;

export default async function Home() {
  const user = await getSession();
  redirect(user ? "/dashboard" : "/login");
}
