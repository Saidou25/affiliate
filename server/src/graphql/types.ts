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
