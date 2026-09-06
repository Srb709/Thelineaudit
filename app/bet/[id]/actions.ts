"use server";

import { revalidatePath } from "next/cache";

const SUPABASE_URL = "https://jghdunallqvaejbfhouz.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXAiLCJyZWYiOiJqZ2hkdW5hbGxxdmFlamJmaG91eiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg4NDY4MjM2LCJleHAiOjIxMDQwNDQyMzZ9.fZncGcVwEo1Ipaz1802_Ac85Xr9YQeLvPBiaEn50QIU";
const MANUAL_GRADE_KEY = "854c3368b5b95f3e224f83ccd5f74415";

export async function manualGradeBet(formData: FormData) {
  const id = String(formData.get("id") || "");
  const result = String(formData.get("result") || "").toLowerCase();

  if (!id || !["win", "loss", "push", "void", "auto"].includes(result)) {
    throw new Error("Invalid manual result.");
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/manual_grade_bet`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_bet_id: id,
      p_result: result,
      p_admin_key: MANUAL_GRADE_KEY,
      p_note: result === "auto" ? "Returned to automatic grading from app" : "Owner corrected result from app",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Could not update result (${response.status}): ${text.slice(0, 180)}`);
  }

  revalidatePath(`/bet/${id}`);
  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/all-time");
}
