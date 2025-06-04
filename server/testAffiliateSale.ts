import mongoose from "mongoose";
import AffiliateSale from "./src/models/AffiliateSale"; // Adjust path as needed

async function runTest() {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/affiliate';
  await mongoose.connect(MONGODB_URI);

  const testSale = new AffiliateSale({
    productId: "123",
    refId: "testRef",
    buyerEmail: "test@example.com",
    amount: 100,
    event: "purchase",
    commissionEarned: 5,
  });

  await testSale.save();
  console.log("✅ Saved test sale:", testSale);

  await mongoose.disconnect();
}

runTest().catch(console.error);
