import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 20000,
});

try {
  const counts = await pool.query(`
    select 'events' as name, count(*)::int as n from events
    union all select 'users', count(*)::int from users
    union all select 'notifications', count(*)::int from notifications
    union all select 'bookmarks', count(*)::int from bookmarks
    union all select 'registrations', count(*)::int from registrations
    union all select 'almanac_pdfs', count(*)::int from almanac_pdfs
  `);
  for (const row of counts.rows) {
    console.log(`${row.name}: ${row.n}`);
  }
} catch (error) {
  console.error("ERR", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
