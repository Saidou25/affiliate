export type PaymentRecord = {
  amount: number;
  date: Date;
  method: "paypal" | "bank" | "crypto" | string;
  transactionId?: string;
  notes?: string;
};

export interface MyContext {
  affiliate?: {
    id: string;
    name: string;
    email: string;
    refId: string;
    totalClicks: number;
    totalCommissions: number;
    totalSales: number;
    password: string;
    commissionRate: number;
    stripeAccountId: string;
    role?: "admin" | "affiliate";
    avatar?: string;
    createdAt?: Date; // ✅ Automatically added by Mongoose
    updatedAt?: Date; // ✅ Automatically added by Mongoose
    paymentHistory: PaymentRecord[];
  };
}
export type AffiliateSale = {
  id: string;
  refId: string;
  buyerEmail: string;
  event: string;
  commissionEarned: number;
  commissionStatus: string;
  timestamp: string | Date;
  amount: number;
  productId: string;
};

export type Notification = {
  date: Date;
  title: string;
  text: string;
};

export interface SendEmailArgs {
  refId?: string;
  buyerEmail?: string;
  affiliateEmail?: string;
  event?: string;
  title?: string;
  amount?: number;
  commission?: number;
  text?: string;
}
