// src/config.ts
import dotenv from "dotenv";
import path from "path";

// Load .env or .env.production based on NODE_ENV
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env";
dotenv.config({ path: path.resolve(__dirname, "../", envFile) });

// Now export your JWT secret (and any other shared config)
export const SECRET = process.env.JWT_SECRET!;
if (!SECRET) {
  throw new Error("Missing JWT_SECRET in environment");
}
