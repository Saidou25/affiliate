export interface MyContext {
  affiliate?:
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
