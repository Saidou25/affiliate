// src/context.ts
import { Request } from 'express';

export interface MyContext {
  user: { id: string; name: string } | undefined;
}

export const createContext = ({ req }: { req: Request }): MyContext => {
  const userHeader = req.headers['user']; // Adjust this logic as per your needs
  const user = userHeader ? { id: '123', name: 'Example User' } : undefined;

  return { user };
};
