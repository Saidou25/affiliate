import { Request } from "express";
import * as jwt from "jsonwebtoken";
import Affiliate from "./models/Affiliate";

export type Role = "affiliate" | "admin";

interface IPaymentRecord {
  saleAmount: number;
  paidCommission?: number | null;
  productName?: string | null;
  date: Date;
  method: string;
  transactionId?: string | null;
  notes?: string | null;
}

interface INotification {
  date: Date;
  title: string;
  text: string;
}
// Define the Affiliate interface
export interface Affiliate {
  id: string;
  name: string;
  email: string;
  refId: string;
  totalClicks: number;
  totalCommissions: number;
  totalSales: number;
  password: string;
  stripeAccountId?: string;
  commissionRate: number;
  role?: "admin" | "affiliate";
  createdAt?: Date; // ✅ Automatically added by Mongoose
  updatedAt?: Date; // ✅ Automatically added by Mongoose
  paymentHistory: IPaymentRecord[];
  notifications: INotification[];
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

  // Handle missing or invalid authorization header
  if (!authHeader.startsWith("Bearer ")) {
    console.warn("⚠️ No Bearer token found");
    return { req, affiliate: null }; // or { affiliate: null }
  }

  const token = authHeader.slice(7); // Remove "Bearer "
  try {
    // Decode and verify the token
    const payload = jwt.verify(token, SECRET) as { affiliateId: string };

    // Fetch the affiliate from the database using affiliateId
    const foundAffiliate = await Affiliate.findById(payload.affiliateId);
    if (!foundAffiliate) {
      console.warn("⚠️ No affiliate found with ID:", payload.affiliateId);
      return { req, affiliate: null }; // or return { affiliate: null }
    }

    // Create the affiliate object to return in the context
    const affiliate: Affiliate = {
      id: foundAffiliate.id.toString(),
      name: foundAffiliate.name ?? "Unnamed Affiliate",
      email: foundAffiliate.email,
      refId: foundAffiliate.refId,
      totalClicks: foundAffiliate.totalClicks,
      totalCommissions: foundAffiliate.totalCommissions,
      role: foundAffiliate.role ?? "affiliate", // <-- fallback default
      commissionRate: foundAffiliate.commissionRate,
      totalSales: foundAffiliate.totalSales,
      stripeAccountId: foundAffiliate.stripeAccountId,
      paymentHistory: (foundAffiliate.paymentHistory ??
        []) as unknown as IPaymentRecord[],
      notifications: foundAffiliate.notifications ?? [],
      password: foundAffiliate.password,
    };

    console.log("👤 Context affiliate:", affiliate);

    return { req, affiliate }; // This is the context being passed
  } catch (error) {
    console.warn("❌ Token verification failed:", error);
    return { req, affiliate: null }; // or return { affiliate: null }
  }
};
