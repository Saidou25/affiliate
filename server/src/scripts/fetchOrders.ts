import dotenv from "dotenv";
import { fetchHostingerOrders } from "../services/hostingerApi";

dotenv.config();

(async () => {
  try {
    const orders = await fetchHostingerOrders();
    console.log("📦 Orders fetched:", JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
  }
})();
