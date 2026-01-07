import fs from "fs";
import path from "path";
import { db } from "./index.js";

export function migrate() {
  const schema = fs.readFileSync(
    path.join(process.cwd(), "src/db", "schema.sql"),
    "utf-8"
  );

  db.exec(schema);
}
