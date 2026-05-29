import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || !/^postgres(ql)?:\/\//i.test(databaseUrl)) {
  console.log("No Postgres DATABASE_URL set. Local JSON storage does not need migrations.");
  process.exit(0);
}

const pool = new Pool({ connectionString: databaseUrl });

async function main() {
  const migrationsDir = path.join(process.cwd(), "migrations");
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  try {
    for (const file of files) {
      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      await pool.query(sql);
      console.log(`Applied ${file}.`);
    }
    console.log("Database migration completed.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
