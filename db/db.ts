// // for pgAdmin

// import { config } from "dotenv";
// import { drizzle } from "drizzle-orm/node-postgres";
// import { Pool } from "pg";
// import * as schema from "@/db/schema/index";

// config({ path: ".env" }); // or .env.local

// // for pgAdmin
// const pool = new Pool({
// 	connectionString: process.env.DATABASE_URL,
// });
// export const db = drizzle(pool, { schema });
// export type DB = typeof db;

// for neon
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import * as schema from "@/db/schema/index";
import { neon } from "@neondatabase/serverless";

config({ path: ".env" }); // or .env.local

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });
export type DB = typeof db;
