import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { MyContext } from "../context";

import Affiliate from "../models/Affiliate";
import Referral from "../models/Referral";
// import dotenv from "dotenv";

// dotenv.config();
const SECRET = "dev-secret-123456";

if (!SECRET) {
  throw new Error("JWT SECRET is not defined in environment variables");
}

const resolvers = {
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

      return Affiliate.findOne({ _id: context.affiliate.id });
    },
    getReferrals: async () => {
      return Referral.find();
    },
    // // Only affiliates (via your custom header) can get their own referrals:
    // getReferrals: async (
    //   _parent: any,
    //   _args: any,
    //   { affiliate }: MyContext
    // ) => {
    //   if (!affiliate) {
    //     throw new Error("No affiliate credentials provided");
    //   }
    //   // filter referrals by the affiliate’s refId:
    //   return Referral.find({ affiliateRefId: affiliate.refId });
    // },
  },

  Mutation: {
    login: async (
      _: unknown,
      { email, password }: { email: string; password: string }
    ) => {
      console.log("🔐 Login attempt:", email);
      console.log("📥 Incoming password:", password);
      const affiliate = await Affiliate.findOne({ email });
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
        name,
        email,
        refId,
        totalClicks,
        password,
        totalCommissions,
      }: {
        password: string;
        name: string;
        email: string;
        refId: string;
        totalClicks: number;
        totalCommissions: number;
      }
    ) => {
      try {
        console.log(
          "🔐 Register input:",
          name,
          email,
          refId,
          totalClicks,
          password,
          totalCommissions
        );
        console.log("📥 Raw password at registration:", password);

        // const hashedPassword = await bcrypt.hash(password, 10); // 🔒 hash password
        // console.log("🔐 Hashed password to store:", hashedPassword);

        const affiliate = new Affiliate({
          name,
          email,
          password,
          refId,
          totalClicks,
          totalCommissions,
        });
        await affiliate.save();
        // ✅ Sign a JWT with affiliateId
        const token = jwt.sign({ affiliateId: affiliate.id }, SECRET, {
          expiresIn: "1h",
        });
        console.log("✅ Registered affiliate:", affiliate);
        console.log("📦 Token:", token);
        // ✅ Return both the token and the affiliate
        return { token, affiliate };
      } catch (error) {
        console.error("Error creating affiliate:", error); // Log any errors that occur during user creation
        throw new Error("Failed to create affiliate");
      }
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
      }: {
        id: string;
        name?: string;
        email?: string;
        refId?: string;
        totalClicks?: number;
        totalCommissions?: number;
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
          },
          { new: true }
        );
      } catch (error) {
        throw new Error("Failed to update affiliate");
      }
    },

    trackReferral: async (
      _: unknown,
      { refId, event, email }: { refId: string; event: string; email: string }
    ) => {
      try {
        const newReferral = new Referral({ refId, event, email });
        await newReferral.save();
        return newReferral;
      } catch (error) {
        throw new Error("Failed to create referral");
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
