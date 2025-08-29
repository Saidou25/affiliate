// export type AffiliateSale = {
//   id: string;
//   refId: string;
//   buyerEmail: string;
//   event: string;
//   commissionEarned: number;
//   commissionStatus: string;
//   timestamp: string | Date;
//   amount: number;
//   productId: string;
// };

export type PaymentRecord = {
  amount: number;
  date: Date;
  method: "paypal" | "bank" | "crypto" | string;
  transactionId?: string;
  notes?: string;
};

export type Notification = {
  title: string;
  text: string;
  date: string;
  read?: boolean;
};

export type Affiliate = {
  id: string;
  name: string;
  email: string;
  refId: string;
  totalClicks: number;
  totalCommissions: number;
  totalSales: number;
  password: string;
  commissionRate: number;
  role?: "admin" | "affiliate";
  createdAt?: Date; // ✅ Automatically added by Mongoose
  updatedAt?: Date; // ✅ Automatically added by Mongoose
  paymentHistory: PaymentRecord[];
  stripeAccountId?: String;
  notifications?: Notification[];
  avatar?: string;
};

export type GetAffiliateByRefIdData = {
  getAffiliateByRefId: {
    id: string;
  };
};

export type GetAffiliateByRefIdVars = {
  refId: string;
};

export type CheckStripeStatusData = {
  checkStripeStatus: {
    id: string;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  };
};

export type CheckStripeStatusVars = {
  affiliateId: string;
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

export type AffiliateProduct = {
  wooId: number;
  name: string;
  permalink: string;
  primaryImage?: string | null;
  price?: number | null;
  currency?: string | null;
};

export interface AffiliateSale {
  id: string;
  refId?: string | null;
  source?: "woocommerce" | "stripe" | "manual" | (string & {}) | null;

  // New model
  orderId?: string | null;
  orderNumber?: string | null;
  orderDate?: string | null;
  status?: string | null;
  currency?: string | null;
  subtotal?: number | null;
  discount?: number | null;
  tax?: number | null;
  shipping?: number | null;
  total?: number | null;
  paymentIntentId?: string | null;
  items?: any[] | null;
  product?: any | null;
  commissionEarned?: number | null;
  commissionStatus?: "paid" | "unpaid" | (string & {}) | null;
  createdAt: string;
  updatedAt?: string | null;

  // Legacy (optional; for backward compatibility)
  timestamp?: string | Date; // prefer createdAt/orderDate
  amount?: number;           // prefer total
  productId?: string;        // prefer items/product
  buyerEmail?: string;
  event?: string;
}


export interface AffiliateSalesQueryData {
  affiliateSales: AffiliateSale[];
}

export interface AffiliateSalesQueryVars {
  filter?: {
    refId?: string;
    source?: string;
    orderId?: string;
    status?: string;
    from?: string;   // ISO
    to?: string;     // ISO
  };
  limit?: number;
  offset?: number;
}
