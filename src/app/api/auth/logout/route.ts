import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { ok } from "@/lib/http";

export async function POST() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return ok({ loggedIn: false });
}
