import "dotenv/config";
import mongoose from "mongoose";
import AffiliateSale from "../models/AffiliateSale"; // adjust path if needed

async function run() {
  const uri = process.env.MONGODB_URI!;
  await mongoose.connect(uri);

  // 1) Show counts (dry run info)
  const counts = await AffiliateSale.aggregate([
    { $group: { _id: "$commissionStatus", n: { $sum: 1 } } }
  ]);
  console.log("Before:", counts);

  // 2) Fix known legacy value
  const res1 = await AffiliateSale.updateMany(
    { commissionStatus: "refunded" },
    { $set: { commissionStatus: "reversed" } }
  );
  console.log(`Updated "refunded" → "reversed":`, res1.modifiedCount);

  // 3) Guard: any value not in the new enum becomes "unpaid"
  const allowed = ["unpaid", "processing", "paid", "reversed"];
  const res2 = await AffiliateSale.updateMany(
    { commissionStatus: { $nin: allowed } },
    { $set: { commissionStatus: "unpaid" } }
  );
  console.log(`Normalized unknown statuses → "unpaid":`, res2.modifiedCount);

  const countsAfter = await AffiliateSale.aggregate([
    { $group: { _id: "$commissionStatus", n: { $sum: 1 } } }
  ]);
  console.log("After:", countsAfter);

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
