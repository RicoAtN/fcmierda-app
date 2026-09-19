import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = neon(dbUrl);

async function inspectMOTM() {
  console.log("=== INSPECTING MAN OF THE MATCH VALUES ===");
  const motmRows = await sql`
    SELECT id, opponent, fcmierda_man_of_the_match
    FROM match_result
    WHERE fcmierda_man_of_the_match IS NOT NULL AND fcmierda_man_of_the_match != ''
    ORDER BY id DESC
    LIMIT 10
  `;
  console.log("Recent MOTM values in match_result:");
  console.log(motmRows);

  console.log("\n=== INSPECTING PLAYER_STATISTICS NAMES & PHOTOS ===");
  const players = await sql`
    SELECT player_id, player_name, player_number, photo_link
    FROM player_statistics
    ORDER BY player_id ASC
    LIMIT 15
  `;
  console.log("Players sample:");
  console.log(players.map(p => ({
    id: p.player_id,
    name: p.player_name,
    number: p.player_number,
    photo_link: p.photo_link ? (p.photo_link.startsWith('data:') ? 'data:image... (base64 length: ' + p.photo_link.length + ')' : p.photo_link) : null
  })));
}

inspectMOTM();
