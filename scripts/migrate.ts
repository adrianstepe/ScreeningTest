import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || !/^postgres(ql)?:\/\//i.test(databaseUrl)) {
  console.log("No Postgres DATABASE_URL set. Local JSON storage does not need migrations.");
  process.exit(0);
}

const pool = new Pool({ connectionString: databaseUrl });

async function main() {
  const sql = await readFile(path.join(process.cwd(), "migrations", "001_initial.sql"), "utf8");

  try {
    await pool.query(sql);
    console.log("Database migration completed.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
