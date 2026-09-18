"use server";

import { revalidatePath } from "next/cache";

export async function refreshAnalyticsAction() {
  revalidatePath("/cms/analytics");
  return { success: true, timestamp: Date.now() };
}
