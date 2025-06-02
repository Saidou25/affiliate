export interface MyContext {
  affiliate?:
    | {
        id: string;
        name: string;
        email: string;
        refId: string;
        totalClicks: number;
        totalCommissions: number;
        commissionRate: number;
        totalSales: number;
        createdAt?: Date;
        updatedAt?: Date;
      }
    | undefined;
}
export type AffiliateSale = {
  refId: string;
  buyerEmail: string;
  event: string;
  commissionEarned: number;
  timestamp: string | Date;
  amount: number;
  productId: string;
  __typename?: string;
};
