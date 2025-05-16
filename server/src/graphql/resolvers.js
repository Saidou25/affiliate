import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Affiliate from "../models/Affiliate";
import AffiliateSale from "../models/AffiliateSale";
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
    getAffiliate: async (_, { id }) => {
      return Affiliate.findOne({ _id: id });
    },
    getAllAffiliateSales: async () => {
      return AffiliateSale.find();
    },
    me: async (_parent, _, context) => {
      if (!context.affiliate) {
        throw new Error("Not authenticated");
      }
      return Affiliate.findOne({ _id: context.affiliate.id });
    },
    // Only affiliates (via your custom header) can get their own AffiliateSales:
    // getAllAffiliateSales: async (_parent, _args, { affiliate }) => {
    //     if (!affiliate) {
    //         throw new Error("No affiliate credentials provided");
    //     }
    //     // filter AffiliateSales by the affiliate’s refId:
    //     return AffiliateSale.find({ affiliateRefId: affiliate.refId });
    // },
  },
  Mutation: {
    login: async (_, { email, password }) => {
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
      _,
      { name, email, refId, totalClicks, password, totalCommissions }
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
    deleteAffiliate: async (_, { id }) => {
      try {
        return await Affiliate.findOneAndDelete({ _id: id });
      } catch (error) {
        throw new Error("Failed to delete affiliate");
      }
    },
    updateAffiliate: async (
      _,
      { id, name, email, refId, totalClicks, totalCommissions }
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
    trackAffiliateSale: async (_, { refId, event, email }) => {
      try {
        const newAffiliateSale = new AffiliateSale({ refId, event, email });
        await newAffiliateSale.save();
        return newAffiliateSale;
      } catch (error) {
        throw new Error("Failed to create AffiliateSale");
      }
    },
    logClick: async (_, { refId }) => {
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
