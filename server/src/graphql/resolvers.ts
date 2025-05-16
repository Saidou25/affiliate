import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SECRET } from "../config/env";

import { MyContext } from "../context";

import Affiliate from "../models/Affiliate";
import AffiliateSale from "../models/AffiliateSale";
import { dateScalar } from "../dateScalar";

if (!SECRET) {
  throw new Error("JWT SECRET is not defined in environment variables");
}

const resolvers = {
  Date: dateScalar,

  Query: {
    // Only logged-in users can list affiliates:
    getAffiliates: async () => {
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

    getAllAffiliateSales: async () => {
      return AffiliateSale.find();
    },

    getAffiliateSales: async (
      _: any,
      { refId }: { refId: string }
    ) => {
      return AffiliateSale.find({ refId }); // likely multiple sales per affiliate
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

      const token = jwt.sign({ affiliateId: affiliate.id }, SECRET, {
        expiresIn: "1h",
      });
      console.log("✅ Login success. Token:", token);
      return { token, affiliate };
    },

    registerAffiliate: async (
      _: unknown,
      {
        email,
        password,
        refId,
        name,
        totalClicks = 0,
        totalCommissions = 0,
      }: // selectedProducts = [],
      {
        email: string;
        password: string;
        refId: string;
        name?: string;
        totalClicks?: number;
        totalCommissions?: number;
        // selectedProducts?: string[]; // Array of product IDs only!
      }
    ) => {
      const affiliate = new Affiliate({
        email,
        password,
        refId,
        name: name ?? "",
        totalClicks,
        totalCommissions,
        // selectedProducts, // store only IDs here
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
      }: // selectedProducts,
      {
        id: string;
        name?: string;
        email?: string;
        refId?: string;
        totalClicks?: number;
        totalCommissions?: number;
        // selectedProducts?: string[]; // Again, only IDs
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
            // ...(selectedProducts !== undefined && { selectedProducts }),
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
        // affiliateId,
        productId,
        refId,
        buyerEmail,
        amount,
        event,
        timestamp,
      }: {
        // affiliateId: string;
        productId: string;
        refId: string;
        buyerEmail: string;
        amount: number;
        event: string;
        timestamp?: Date;
      }
    ) => {
      try {
        const newAffiliateSale = new AffiliateSale({
          // affiliateId,
          productId,
          refId,
          buyerEmail,
          amount,
          event,
          timestamp: timestamp || new Date(),
        });
        await newAffiliateSale.save();
        return newAffiliateSale;
      } catch (error) {
        console.error("❌ Error creating AffiliateSale:", error);
        throw new Error("Failed to create AffiliateSale");
      }
    },

    logClick: async (_: any, { refId }: { refId: string }) => {
      try {
        const updatedAffiliate = await Affiliate.findOneAndUpdate(
          { refId },
          { $inc: { totalClicks: 1 } },
          { new: true }
        );
        if (!updatedAffiliate) {
          throw new Error("Affiliate not found");
        }
        return true;
      } catch (error) {
        console.error("Error logging click:", error);
        return false;
      }
    },
  },
};

export default resolvers;
