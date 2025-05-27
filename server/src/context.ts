import { Request } from "express";
import * as jwt from "jsonwebtoken";
import Affiliate from "./models/Affiliate";

export type Role = "affiliate" | "admin";

// Define the Affiliate interface
export interface Affiliate {
  id: string;
  name: string;
  email: string;
  refId: string;
  totalClicks: number;
  totalCommissions: number;
  role: Role;
  commissionRate: number;
  totalSales: number;
}

// Define MyContext with affiliate (from JWT)
export interface MyContext {
  req: Request;
  affiliate?: Affiliate | null; // Allow null or undefined if no affiliate is found
}

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error("Missing JWT_SECRET in environment");

export const createContext = async ({
  req,
}: {
  req: Request;
}): Promise<MyContext> => {
  const authHeader = req.headers.authorization || "";
  console.log("🧾 Auth header:", authHeader);

  // Handle missing or invalid authorization header
  if (!authHeader.startsWith("Bearer ")) {
    console.warn("⚠️ No Bearer token found");
    return { req, affiliate: null }; // or { affiliate: null }
  }

  const token = authHeader.slice(7); // Remove "Bearer "
  console.log("🔑 Token received:", token); // 👈 ADD THIS
  try {
    // Decode and verify the token
    const payload = jwt.verify(token, SECRET) as { affiliateId: string };
    console.log("🔓 Token verified. Payload:", payload);

    // Fetch the affiliate from the database using affiliateId
    const foundAffiliate = await Affiliate.findById(payload.affiliateId);
    if (!foundAffiliate) {
      console.warn("⚠️ No affiliate found with ID:", payload.affiliateId);
      return { req, affiliate: null }; // or return { affiliate: null }
    }

    // Create the affiliate object to return in the context
    const affiliate: Affiliate = {
      id: foundAffiliate.id.toString(),
      name: foundAffiliate.name,
      email: foundAffiliate.email,
      refId: foundAffiliate.refId,
      totalClicks: foundAffiliate.totalClicks,
      totalCommissions: foundAffiliate.totalCommissions,
      role: foundAffiliate.role ?? "affiliate", // <-- fallback default
      commissionRate: foundAffiliate.commissionRate,
      totalSales: foundAffiliate.totalSales,
    };

    console.log("👤 Context affiliate:", affiliate);

    return { req, affiliate }; // This is the context being passed
  } catch (error) {
    console.warn("❌ Token verification failed:", error);
    return { req, affiliate: null }; // or return { affiliate: null }
  }
};
