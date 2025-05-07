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
        name: string;
        email: string;
        refId: string;
        totalClicks: number;
        totalCommissions: number;
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
