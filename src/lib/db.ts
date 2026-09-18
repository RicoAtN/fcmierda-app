import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "";

// Maintain a global singleton instance in Node/Next.js to avoid connection leaks across requests
const globalForDb = globalThis as unknown as {
  sqlInstance?: ReturnType<typeof postgres>;
};

export const sql =
  globalForDb.sqlInstance ||
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Prevents serverless connection issues
  });

globalForDb.sqlInstance = sql;

export default sql;
