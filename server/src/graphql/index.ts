import type { Request } from "express";
import typeDefs from "./typeDefs";
import resolvers from "./resolvers";

export interface Context {
  req: Request;
  // You can add other properties here like affiliate if you want
}

// Apollo context function with typed parameter and return
export const context = ({ req }: { req: Request }): Context => {
  return { req };
};

export { typeDefs, resolvers };
