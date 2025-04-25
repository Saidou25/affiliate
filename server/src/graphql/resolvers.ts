// import { IResolvers } from "@graphql-tools/utils";
// import { resolvers } from ""
import Affiliate from "../models/Affiliate";

// interface MyContext {
//   user?: { id: string; name: string }; // Customize this according to your needs
// }
const resolvers = {
  Query: {
    getAffiliates: async () => {
      return await Affiliate.find(); // Return all users from MongoDB
    },
    getAffiliate: async (_: any, { id }: { id: string }) => {
      return await Affiliate.findById(id);
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
        const affiliate = new Affiliate({ name, email, refId, totalClicks, totalCommissions });
        await affiliate.save();
        console.log("Affiliate created:", affiliate); // Logging the created user
        return affiliate; // Ensure the user is returned
      } catch (error) {
        console.error("Error creating affiliate:", error); // Log any errors that occur during user creation
        throw new Error("Failed to create affiliate");
      }
    },
  },
};

export default resolvers;
