// src/context.ts
import { Request } from "express";

export interface MyContext {
  affiliate:
    | {
        id: string;
        name: string;
        email: string;
        refId: string;
        totalClicks: number;
        totalCommissions: number;
      }
    | undefined;
}

export const createContext = ({ req }: { req: Request }): MyContext => {
  const userHeader = req.headers["affiliate"];
  const affiliate = userHeader
    ? {
        id: "123",
        name: "Example User",
        email: "Example email",
        refId: "3",
        totalClicks: 5,
        totalCommissions: 6.6,
      }
    : undefined;

  return { affiliate };
};
