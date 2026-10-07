import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

// Managed MySQL providers (Aiven, PlanetScale, ...) require TLS. mysql2 does not
// understand `?ssl-mode=REQUIRED`, so parse the URL and enable TLS explicitly.
function createPool() {
  const url = new URL(env.databaseUrl);
  const needsTls =
    url.searchParams.has("ssl-mode") ||
    url.searchParams.has("sslmode") ||
    url.hostname.endsWith("aivencloud.com");
  return mysql.createPool({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: needsTls ? { rejectUnauthorized: false } : undefined,
    connectionLimit: 5,
  });
}

export function getDb() {
  if (!instance) {
    instance = drizzle(createPool(), {
      mode: "default",
      schema: fullSchema,
    });
  }
  return instance;
}
