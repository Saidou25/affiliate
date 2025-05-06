import Affiliate from "../models/Affiliate";
import Referral from "../models/Referral";

const resolvers = {
  Query: {
    getAffiliates: async () => {
      return await Affiliate.find(); // Return all affiliates from MongoDB
    },
    getAffiliate: async (_: any, { id }: { id: string }) => {
      return await Affiliate.findById(id);
    },
    getReferrals: async () => {
      return await Referral.find();
    },
  },

  Mutation: {
    registerAffiliate: async (
      _: unknown,
      {
        name,
        email,
        refId,
        totalClicks,
        totalCommissions,
      }: {
        name: string
        email: string
        refId: string
        totalClicks: number
        totalCommissions: number
      }
    ) => {
      try {
        const affiliate = new Affiliate({
          name,
          email,
          refId,
          totalClicks,
          totalCommissions,
        });
        await affiliate.save();
        return affiliate; // Ensure the user is returned
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
  },
};

export default resolvers;
