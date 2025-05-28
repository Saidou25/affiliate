import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SECRET } from "../config/env";
import { dateScalar } from "../dateScalar";
import { MyContext } from "../context";
import { sendConfirmationEmail } from "../utils/sendConfirmationEmail";
import { sendTrackASaleConfEmail } from "../utils/sendTrackASaleConfEmail";
import Affiliate from "../models/Affiliate";
import AffiliateSale from "../models/AffiliateSale";
import ClickLog from "../models/ClickLog";

if (!SECRET) {
  throw new Error("JWT SECRET is not defined in environment variables");
}

function requireAdmin(context: MyContext) {
  if (!context.affiliate || context.affiliate.role !== "admin") {
    throw new Error("Admin privileges required");
  }
}

const resolvers = {
  Date: dateScalar,

  Query: {
   getAffiliates: async (_: any, __: any, context: MyContext) => {
  requireAdmin(context);
  return Affiliate.find();
},


    getAffiliate: async (_: any, { id }: { id: string }) => {
      return Affiliate.findOne({ _id: id });
    },

    me: async (_parent: any, _: any, context: MyContext) => {
      if (!context.affiliate) {
        throw new Error("Not authenticated");
      }

      return Affiliate.findOne({ _id: context.affiliate.id }); // This populates full product info
    },

    getAllAffiliateSales: async (_: any, __: any, context: MyContext) => {
      requireAdmin(context);
      return AffiliateSale.find();
    },

    getAffiliateSales: async (_: any, { refId }: { refId: string }) => {
      return AffiliateSale.find({ refId }); // likely multiple sales per affiliate
    },
    getAffiliateClickLogs: async (_: any, { refId }: { refId: string }) => {
      return ClickLog.find({ refId }); // likely multiple sales per affiliate
    },
  },

  Mutation: {
    login: async (
      _: unknown,
      { email, password }: { email: string; password: string }
    ) => {
      console.log("🔐 Login attempt:", email);
      console.log("📥 Incoming password:", password);
      const affiliate = await Affiliate.findOne({
        email: email.toLowerCase().trim(),
      });
      console.log("🔐 Hashed password in DB:", affiliate?.password);
      if (!affiliate) {
        console.warn("❌ No affiliate found for email:", email);
        throw new Error("Affiliate not found");
      }

      const valid = await bcrypt.compare(
        password.trim(),
        affiliate.password.trim()
      ); // ✅ check password
      // const valid = password.trim() === affiliate.password.trim();

      console.log("📥 Incoming password (trimmed):", password.trim());
      console.log("🔐 Hashed password (trimmed):", affiliate.password.trim());

      console.log("🔍 Password valid?", valid);
      if (!valid) {
        console.warn("❌ Invalid password for email:", email);
        throw new Error("Invalid credentials");
      }

      const token = jwt.sign(
        { affiliateId: affiliate.id, role: affiliate.role },
        SECRET,
        {
          expiresIn: "1h",
        }
      );
      console.log("✅ Login success. Token:", token);
      return { token, affiliate };
    },

    registerAffiliate: async (
      _: unknown,
      {
        email,
        password,
        refId,
        createdAt,
      }: {
        email: string;
        password: string;
        refId: string;
        createdAt: Date;
      }
    ) => {
      const affiliate = new Affiliate({
        email,
        password,
        refId,
        createdAt,
      });
      await affiliate.save();

      const token = jwt.sign({ affiliateId: affiliate.id }, SECRET, {
        expiresIn: "1h",
      });

      return { token, affiliate };
    },

    deleteAffiliate: async (_: any, { id }: { id: string }) => {
      try {
        return await Affiliate.findOneAndDelete({ _id: id });
      } catch (error) {
        throw new Error("Failed to delete affiliate");
      }
    },

    updateAffiliate: async (
      _: any,
      {
        id,
        name,
        email,
        refId,
        totalClicks,
        totalCommissions,
        commissionRate,
        totalSales,
        updatedAt,
        createdAt,
      }: {
        id: string;
        name?: string;
        email?: string;
        refId?: string;
        totalClicks?: number;
        totalCommissions?: number;
        commissionRate?: number;
        totalSales?: number;
        updatedAt: Date;
        createdAt: Date; // just to add to already created affiliates
      }
    ) => {
      try {
        return await Affiliate.findOneAndUpdate(
          { _id: id },
          {
            ...(name && { name }), // Only update name if name is being passed as argument
            ...(email && { email }),
            ...(refId && { refId }),
            ...(totalClicks !== undefined && { totalClicks }),
            ...(totalCommissions !== undefined && { totalCommissions }),
            ...(commissionRate !== undefined && { commissionRate }),
            ...(totalSales !== undefined && { totalSales }),
            ...(updatedAt !== undefined && { updatedAt }),
            ...(createdAt !== undefined && { createdAt }),
          },
          { new: true }
        );
      } catch (error) {
        throw new Error("Failed to update affiliate");
      }
    },

    trackAffiliateSale: async (
      _: unknown,
      {
        productId,
        refId,
        buyerEmail,
        amount,
        event,
        timestamp,
      }: {
        productId: string;
        refId: string;
        buyerEmail: string;
        amount: number;
        event: string;
        timestamp?: Date;
      }
    ) => {
      try {
        // 🔍 1. Find the affiliate by refId
        const affiliate = await Affiliate.findOne({ refId });
        if (!affiliate) throw new Error("Affiliate not found");

        // 💰 2. Calculate the commission (default 10% if none set)
        const commissionRate = affiliate.commissionRate ?? 0.1;
        const commission = amount * commissionRate;

        // 📝 3. Save the sale
        const sale = new AffiliateSale({
          productId,
          refId,
          buyerEmail,
          amount,
          event,
          timestamp: timestamp || new Date(),
          commissionEarned: commission.toFixed(2),
        });
        await sale.save();
        await sendConfirmationEmail({
          buyerEmail,
          event,
          amount,
          commission,
        });
        await sendTrackASaleConfEmail({
          buyerEmail,
          affiliateEmail: affiliate.email,
          event,
          amount,
          commission,
        });

        // 📈 4. Update the affiliate's total commissions
        affiliate.totalCommissions =
          (affiliate.totalCommissions || 0) + commission;
        await affiliate.save();

        return sale;
      } catch (error) {
        console.error("❌ Error tracking affiliate sale:", error);
        throw new Error("Failed to track affiliate sale");
      }
    },

    clickLog: async (_: unknown, { refId }: { refId: string }) => {
      try {
        if (!refId) {
          throw new Error("refId is required");
        }

        console.log("✅ clickLog called with:", refId);

        const updatedAffiliate = await Affiliate.findOneAndUpdate(
          { refId },
          { $inc: { totalClicks: 1 } },
          { new: true }
        );

        if (!updatedAffiliate) {
          throw new Error("Affiliate not found");
        }

        const newClick = new ClickLog({ refId });
        await newClick.save();
        console.log("✅ newClick saved:", newClick);

        return newClick;
      } catch (error) {
        console.error("Error logging click:", error);
        throw new Error("Failed to log click");
      }
    },
  },
};

export default resolvers;
