// config/env.ts
export const SECRET = process.env.JWT_SECRET || "";
export const MONGODB_URI = process.env.MONGODB_URI || "";

// if (!SECRET) {
//   throw new Error("Missing JWT_SECRET in environment");
// }
if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in environment");
}
