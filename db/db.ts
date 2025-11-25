// // for pgAdmin
// import { drizzle } from "drizzle-orm/node-postgres";
// import { config } from "dotenv";

// config({ path: ".env" }); // or .env.local

// // for pgAdmin
// export const db = drizzle(process.env.DATABASE_URL!);

// for neon
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import { config } from "dotenv";
config({ path: ".env" }); // or .env.local

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });
