import Database from "better-sqlite3";
import path from "path";

const isProd = process.env.NODE_ENV === "production";

const DB_PATH = isProd
  ? "/var/lib/panel/prod.db"
  : path.join(process.cwd(), "data", "dev.db");

export const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
