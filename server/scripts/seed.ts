import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import Affiliate from "../src/models/Affiliate";
import AffiliateSale from "../src/models/AffiliateSale";
import ClickLog from "../src/models/ClickLog";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "";

if (!MONGO_URI) {
  throw new Error("❌ MONGO_URI not defined in .env file");
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("📦 Connected to MongoDB");

    await Affiliate.deleteMany({});
    await AffiliateSale.deleteMany({});
    await ClickLog.deleteMany({});

    const hashedPassword = await bcrypt.hash("test123", 10);

    const affiliates = await Affiliate.insertMany([
      {
        name: "Jane Doe",
        email: "jane@example.com",
        password: hashedPassword,
        refId: "janeref",
        totalClicks: 0,
        totalSales: 0,
        totalCommissions: 0,
        commissionRate: 0.1,
        role: "affiliate",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        refId: "adminref",
        role: "admin",
        commissionRate: 0.2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const sales = await AffiliateSale.insertMany([
      {
        productId: "prod001",
        refId: "janeref",
        buyerEmail: "buyer1@example.com",
        amount: 100,
        event: "signup",
        timestamp: new Date(),
        commissionEarned: 10,
        commissionStatus: "unpaid",
      },
    ]);

    const clicks = await ClickLog.insertMany([
      { refId: "janeref", timestamp: new Date() },
      { refId: "janeref", timestamp: new Date() },
    ]);

    console.log(`✅ Seeded ${affiliates.length} affiliates`);
    console.log(`✅ Seeded ${sales.length} sales`);
    console.log(`✅ Seeded ${clicks.length} clicks`);

    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

seed();
