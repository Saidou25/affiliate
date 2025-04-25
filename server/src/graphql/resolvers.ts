import { IResolvers } from '@graphql-tools/utils';
import User from '../models/User';

const resolvers: IResolvers = {
  Query: {
    getUsers: async () => {
      return await User.find();
    },
  },
  Mutation: {
    createUser: async (_: unknown, { name, email }: { name: string; email: string }) => {
      const user = new User({ name, email });
      await user.save();
      return user;
    },
  },
};

export default resolvers;
