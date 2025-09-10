import mongoose from "mongoose";
import { reconcileStripeTransfers } from "./reconcileStripeTransfers";

async function main() {
  const uri = process.env.MONGODB_URI!;
  if (!uri) throw new Error("MONGODB_URI missing");

  await mongoose.connect(uri);
  console.log("[reconcile] connected to Mongo");

  await reconcileStripeTransfers(48); // look back 48h
  console.log("[reconcile] done");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error("[reconcile] failed:", e?.message || e);
  process.exit(1);
});
