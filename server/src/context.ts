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

type AffiliateCtx = Omit<Affiliate, "password">;

// Define MyContext with affiliate (from JWT)
export interface MyContext {
  req: Request;
  affiliate: AffiliateCtx | null; // Allow null or undefined if no affiliate is found
}

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error("Missing JWT_SECRET in environment");
export const createContext = async ({
  req,
}: {
  req: Request;
}): Promise<MyContext> => {
  const authHeader = req.headers.authorization || "";
  const body: any = (req as any).body || {};
  const isIntrospection =
    body?.operationName === "IntrospectionQuery" ||
    (typeof body?.query === "string" &&
      body.query.includes("IntrospectionQuery"));

  // No token: stay quiet for introspection/preflight, return affiliate:null
  if (!authHeader.startsWith("Bearer ")) {
    if (!isIntrospection && req.method !== "OPTIONS") {
      // console.warn("⚠️ No Bearer token found");
    }
    return { req, affiliate: null };
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, SECRET) as {
      affiliateId?: string;
      sub?: string;
      id?: string;
    };
    const userId = payload.affiliateId || payload.sub || payload.id;
    if (!userId) return { req, affiliate: null };

    const foundAffiliate = await Affiliate.findById(userId);
    if (!foundAffiliate) return { req, affiliate: null };

    const affiliate: AffiliateCtx = {
      id: foundAffiliate.id.toString(),
      name: foundAffiliate.name ?? "Unnamed Affiliate",
      email: foundAffiliate.email,
      refId: foundAffiliate.refId,
      totalClicks: foundAffiliate.totalClicks,
      totalCommissions: foundAffiliate.totalCommissions,
      role: foundAffiliate.role ?? "affiliate",
      commissionRate: foundAffiliate.commissionRate,
      totalSales: foundAffiliate.totalSales,
      stripeAccountId: foundAffiliate.stripeAccountId,
      paymentHistory: (foundAffiliate.paymentHistory ??
        []) as unknown as IPaymentRecord[],
      notifications: foundAffiliate.notifications ?? [],
    };

    console.log("👤 Context affiliate:", affiliate);
    return { req, affiliate };
  } catch (error) {
    console.warn("❌ Token verification failed:", error);
    return { req, affiliate: null };
  }
};
