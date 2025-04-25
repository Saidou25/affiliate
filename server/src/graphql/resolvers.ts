// import { IResolvers } from "@graphql-tools/utils";
// import { resolvers } from ""
import User from "../models/User";

// interface MyContext {
//   user?: { id: string; name: string }; // Customize this according to your needs
// }
const resolvers = {
  Query: {
    getUsers: async () => {
      return await User.find(); // Return all users from MongoDB
    },
    getUser: async (_: any, { id }: { id: string }) => {
      return await User.findById(id);
    },
  },
  
  Mutation: {
    createUser: async (
      _: unknown,
      { name, email }: { name: string; email: string }
    ) => {
      try {
        const user = new User({ name, email });
        await user.save();
        console.log("User created:", user); // Logging the created user
        return user; // Ensure the user is returned
      } catch (error) {
        console.error("Error creating user:", error); // Log any errors that occur during user creation
        throw new Error("Failed to create user");
      }
    },
  },
};

export default resolvers;
