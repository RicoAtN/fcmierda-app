import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export type CmsActionType = "CREATE" | "UPDATE" | "DELETE" | "BROADCAST";
export type CmsModule =
  | "next_game"
  | "match_result"
  | "player"
  | "competition"
  | "sponsor"
  | "attendance"
  | "push_broadcast";

export interface LogCmsActivityParams {
  action_type: CmsActionType;
  module: CmsModule;
  entity_id?: string | number | null;
  entity_title?: string | null;
  details?: Record<string, any> | null;
  admin_username?: string | null;
  req?: Request | any;
}

export interface CmsActivityLog {
  id: number;
  admin_username: string;
  action_type: CmsActionType;
  module: CmsModule;
  entity_id: string | null;
  entity_title: string | null;
  details: Record<string, any> | null;
  created_at: string | Date;
}

/**
 * Log an administrative CMS change to the database
 */
export async function logCmsActivity({
  action_type,
  module,
  entity_id,
  entity_title,
  details,
  admin_username,
  req,
}: LogCmsActivityParams) {
  try {
    let username = admin_username;

    // 1. If req is provided, check req.cookies or cookie headers
    if (!username && req) {
      try {
        if ("cookies" in req && typeof req.cookies?.get === "function") {
          username = req.cookies.get("admin_username")?.value;
        }
        if (!username && req.headers) {
          const cookieHeader = req.headers.get("cookie") || "";
          const match = cookieHeader.match(/(?:^|;\s*)admin_username=([^;]+)/);
          if (match) {
            username = decodeURIComponent(match[1]);
          }
        }
      } catch {
        // Continue to next extraction method
      }
    }

    // 2. Try extracting from next/headers cookies()
    if (!username) {
      try {
        const cookieStore = await cookies();
        username = cookieStore.get("admin_username")?.value;
      } catch {
        // May be outside of next/headers context
      }
    }

    // 3. Normalize username to match registered admin profiles
    let finalUsername = (username || "Admin").trim();
    const lower = finalUsername.toLowerCase();
    if (lower === "rico") finalUsername = "Rico";
    else if (lower === "victor") finalUsername = "Victor";
    else if (lower === "jordy") finalUsername = "Jordy";
    else if (lower === "alon") finalUsername = "Alon";
    else if (finalUsername.length > 0) {
      finalUsername = finalUsername.charAt(0).toUpperCase() + finalUsername.slice(1);
    }

    await sql`
      INSERT INTO cms_activity_logs (
        admin_username, 
        action_type, 
        module, 
        entity_id, 
        entity_title, 
        details
      ) VALUES (
        ${finalUsername},
        ${action_type},
        ${module},
        ${entity_id != null ? String(entity_id) : null},
        ${entity_title || null},
        ${details ? JSON.stringify(details) : "{}"}
      );
    `;
  } catch (err) {
    console.error("Failed to write CMS activity log:", err);
  }
}

/**
 * Retrieve recent CMS activity logs
 */
export async function getCmsActivityLogs(limit: number = 50): Promise<CmsActivityLog[]> {
  try {
    const rows = await sql<CmsActivityLog[]>`
      SELECT id, admin_username, action_type, module, entity_id, entity_title, details, created_at
      FROM cms_activity_logs
      ORDER BY created_at DESC
      LIMIT ${limit};
    `;

    return rows;
  } catch (err) {
    console.error("Failed to load CMS activity logs:", err);
    return [];
  }
}
