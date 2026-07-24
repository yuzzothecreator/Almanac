import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 20000,
});

try {
  const result = await pool.query(
    `select table_name from information_schema.tables where table_schema = 'public' order by 1`
  );
  console.log("OK tables:", result.rows.map((r) => r.table_name).join(", ") || "(none)");
} catch (error) {
  console.error("ERR", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
