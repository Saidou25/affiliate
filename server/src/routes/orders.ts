import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const TOKEN = process.env.HOSTINGER_SESSION_COOKIE!;

router.get("/hostinger-orders", async (req, res) => {
  try {
    const response = await axios.get(
      "https://builder.hostinger.com/api/wh-api/api/v1/orders",
      {
        headers: {
          Cookie: TOKEN,
          Accept: "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error: any) {
    console.error("❌ Error fetching Hostinger orders:", error.message);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default router;
