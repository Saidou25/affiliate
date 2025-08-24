import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const ORDERS_API = "https://builder.hostinger.com/api/wh-api/api/v1/orders";

export async function fetchHostingerOrders() {
  const cookieHeader = process.env.HOSTINGER_SESSION_COOKIE;
  if (!cookieHeader) {
    throw new Error("❌ Missing HOSTINGER_SESSION_COOKIE in .env");
  }

  try {
    const res = await axios.get(ORDERS_API, {
      headers: {
        Cookie: cookieHeader,
        Accept: "application/json",
      },
    });

    console.log("✅ Orders fetched successfully");
    return res.data; // The JSON response with orders
  } catch (error: any) {
    console.error("❌ Failed to fetch Hostinger orders:", error.message);
    throw error;
  }
}
