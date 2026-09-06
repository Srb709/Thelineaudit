import "server-only";
import { cookies } from "next/headers";

export const OWNER_KEY = "854c3368b5b95f3e224f83ccd5f74415";

export async function isOwner() {
  const store = await cookies();
  return store.get("lineaudit_owner")?.value === OWNER_KEY;
}
