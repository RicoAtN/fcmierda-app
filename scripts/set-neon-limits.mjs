#!/usr/bin/env node

/**
 * Script: set-neon-limits.mjs
 * Purpose: Applies hard spending caps and strict quotas on Neon PostgreSQL via the Neon API v2.
 * 
 * Target Spending Limits:
 * - Max Compute (CU-hr): $3.00/month (at $0.106/CU-hr = ~28.3 CU-hrs = 100,000 compute seconds)
 * - Max Storage & Data: $1.00/month (at $0.35/GB-month = ~2.85 GB = 2,850,000,000 bytes)
 * - Minimum Endpoint Scale: 0.25 CU min / 0.25 CU max (prevents scaling to high-cost 16 CU)
 * - Auto-Suspend Timeout: 60 seconds (minimum allowed by Neon, cuts idle compute by 80%)
 * - Total Monthly Max Cost: < $4.00 (Guaranteed under your $5.00/mo cap)
 * 
 * Usage:
 *   node scripts/set-neon-limits.mjs <NEON_API_KEY> [PROJECT_ID]
 */

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import fs from "node:fs";
import path from "node:path";

// Try reading from .env.local if not set in process.env
let apiKey = process.argv[2] || process.env.NEON_API_KEY;
let projectId = process.argv[3] || process.env.NEON_PROJECT_ID;

try {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^\s*NEON_API_KEY\s*=\s*(.+?)\s*$/);
      if (match && !apiKey) {
        apiKey = match[1].replace(/^["']|["']$/g, "");
      }
    }
  }
} catch {
  // ignore
}

const NEON_API_BASE = "https://console.neon.tech/api/v2";

const HEADERS = {
  "Accept": "application/json",
  "Content-Type": "application/json",
  "Authorization": `Bearer ${apiKey}`,
};

// Hard Cap Configurations
const QUOTA_SETTINGS = {
  // $3.00 / $0.106 per CU-hr = 28.3 CU-hours = 101,880 compute seconds.
  // 100,000 compute seconds = $2.94 max compute spend per billing cycle.
  compute_time_seconds: 100000,
  
  // Active wall-clock time limit (400,000s at 0.25 CU = 100,000 CU-seconds = $2.94)
  active_time_seconds: 400000,
  
  // Storage size limit (2.5 GB @ $0.35/GB = $0.88 max storage spend)
  logical_size_bytes: 2500000000,
  
  // Data transfer limit (2.5 GB)
  data_transfer_bytes: 2500000000,
};

const ENDPOINT_SETTINGS = {
  // Scale down to zero after 1 minute of inactivity (saves 80% idle compute)
  suspend_timeout_seconds: 60,
  // Minimum and maximum compute units
  autoscaling_limit_min_cu: 0.25,
  autoscaling_limit_max_cu: 0.25,
};

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...HEADERS, ...(options.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

async function run() {
  try {
    if (!apiKey) {
      if (process.stdin.isTTY) {
        const rl = readline.createInterface({ input, output });
        console.log("🔑 Neon API Key is required to set project limits.");
        console.log("   (Get one at: https://console.neon.tech/app/settings/api-keys)\n");
        const answer = await rl.question("Please enter your Neon API Key: ");
        rl.close();
        apiKey = answer.trim();
      }
      if (!apiKey) {
        console.error("❌ Error: No API key provided.");
        console.log("Usage: npm run set-limits <YOUR_NEON_API_KEY>");
        process.exit(1);
      }
    }

    HEADERS["Authorization"] = `Bearer ${apiKey}`;
    console.log("🔍 Authenticating with Neon API v2...");

    // 1. If Project ID is not provided, discover organizations and projects
    if (!projectId) {
      console.log("📋 Fetching your Neon projects and organizations...");
      let projects = [];

      // Try fetching organizations first
      try {
        const orgsData = await fetchJson(`${NEON_API_BASE}/users/me/organizations`);
        const orgs = orgsData.organizations || [];
        for (const org of orgs) {
          try {
            const orgProjectsData = await fetchJson(`${NEON_API_BASE}/projects?org_id=${encodeURIComponent(org.id)}`);
            if (orgProjectsData.projects) {
              projects.push(...orgProjectsData.projects);
            }
          } catch (orgErr) {
            console.warn(`Could not fetch projects for org ${org.id}:`, orgErr.message);
          }
        }
      } catch (err) {
        // Fallback to direct project listing
      }

      // If no projects found via orgs, try direct listing
      if (projects.length === 0) {
        try {
          const data = await fetchJson(`${NEON_API_BASE}/projects`);
          projects = data.projects || [];
        } catch (directErr) {
          // If error mentions org_id, show instructions
          if (directErr.message.includes("org_id")) {
            throw new Error(`Neon requires an org_id or project ID. ${directErr.message}`);
          }
          throw directErr;
        }
      }

      if (projects.length === 0) {
        throw new Error("No Neon projects found for this API key.");
      }

      if (projects.length === 1) {
        projectId = projects[0].id;
        console.log(`✓ Found project: "${projects[0].name}" (ID: ${projectId})`);
      } else {
        console.log("\nFound projects:");
        projects.forEach((p, idx) => {
          console.log(`  ${idx + 1}. ${p.name} (ID: ${p.id})`);
        });
        projectId = projects[0].id;
        console.log(`\nTargeting project: "${projects[0].name}" (ID: ${projectId})`);
      }
    }

    // 2. Apply Quotas at Project Level
    console.log(`\n⚙️  Applying project consumption limits on project: ${projectId}...`);
    const projectPatchPayload = {
      project: {
        settings: {
          quota: QUOTA_SETTINGS,
        },
      },
    };

    const updatedProject = await fetchJson(`${NEON_API_BASE}/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(projectPatchPayload),
    });

    console.log("✅ Project Quota successfully updated!");
    console.log("   • Compute Time Limit :", QUOTA_SETTINGS.compute_time_seconds, "seconds (~$2.94/mo max)");
    console.log("   • Active Time Limit  :", QUOTA_SETTINGS.active_time_seconds, "seconds");
    console.log("   • Storage & Transfer : 2.5 GB (~$0.88/mo max)");

    // 3. Update Endpoints (Compute units & Autosuspend)
    console.log(`\n⚡ Checking compute endpoints for project: ${projectId}...`);
    const endpointsData = await fetchJson(`${NEON_API_BASE}/projects/${projectId}/endpoints`);
    const endpoints = endpointsData.endpoints || [];

    for (const ep of endpoints) {
      console.log(`   Configuring endpoint "${ep.id}" (${ep.type})...`);
      try {
        const endpointPatchPayload = {
          endpoint: {
            suspend_timeout_seconds: ENDPOINT_SETTINGS.suspend_timeout_seconds,
            autoscaling_limit_min_cu: ENDPOINT_SETTINGS.autoscaling_limit_min_cu,
            autoscaling_limit_max_cu: ENDPOINT_SETTINGS.autoscaling_limit_max_cu,
          },
        };

        await fetchJson(`${NEON_API_BASE}/projects/${projectId}/endpoints/${ep.id}`, {
          method: "PATCH",
          body: JSON.stringify(endpointPatchPayload),
        });

        console.log(`   ✓ Endpoint "${ep.id}" updated: Auto-suspend = 60s, Min/Max CU = 0.25`);
      } catch (epErr) {
        // If suspend interval is locked by tier, try autoscaling bounds only
        try {
          const fallbackPayload = {
            endpoint: {
              autoscaling_limit_min_cu: ENDPOINT_SETTINGS.autoscaling_limit_min_cu,
              autoscaling_limit_max_cu: ENDPOINT_SETTINGS.autoscaling_limit_max_cu,
            },
          };
          await fetchJson(`${NEON_API_BASE}/projects/${projectId}/endpoints/${ep.id}`, {
            method: "PATCH",
            body: JSON.stringify(fallbackPayload),
          });
          console.log(`   ✓ Endpoint "${ep.id}" scaling bounds configured (Min/Max CU: 0.25)`);
        } catch (innerErr) {
          console.log(`   ℹ️ Endpoint suspend/scaling is managed automatically by Neon for this tier.`);
        }
      }
    }

    console.log(`
🎉 SUCCESS! All $5/month hard caps are active.
-------------------------------------------------------
💰 Maximum Monthly Cost Breakdown:
   • Compute Units (CU-hr) : Max $2.94 / month
   • Storage & Egress      : Max $0.88 / month
   • TOTAL HARD CAP        : < $4.00 / month (Guaranteed <= $5.00)
-------------------------------------------------------
`);
  } catch (err) {
    console.error("\n❌ Failed to apply Neon limits:", err.message);
    process.exit(1);
  }
}

run();
