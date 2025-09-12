export type PaymentRecord = {
  saleAmount: number;
  paidCommission?: number | null;
  productName?: string | null;
  date: string; // GraphQL Date -> string
  method: string;
  transactionId?: string | null;
  notes?: string | null;
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
  createdAt?: string; // ✅ Automatically added by Mongoose
  updatedAt?: string; // ✅ Automatically added by Mongoose
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
// --- status helpers (optional but nice) ---
export type CommissionStatus =
  | "unpaid"
  | "processing"
  | "paid"
  | "reversed"
  | "refunded";

// --- existing types above unchanged ---

export interface AffiliateSale {
  id: string;
  refId?: string | null;

  // Source / order info
  source?: "woocommerce" | "stripe" | "manual" | (string & {}) | null;
  orderId?: string | null;
  orderNumber?: string | null;
  orderDate?: string | null;

  // Monetary / product fields
  status?: string | null; // store order status if you use it (not commissionStatus)
  currency?: string | null;
  subtotal?: number | null;
  discount?: number | null;
  tax?: number | null;
  shipping?: number | null;
  total?: number | null;
  paymentIntentId?: string | null;
  items?: any[] | null;
  product?: any | null;

  // Commission snapshot + payout lifecycle
  commissionEarned?: number | null;
  commissionStatus?: CommissionStatus | null; // <-- expanded enum
  processingAt?: string | null; // ISO date
  paidAt?: string | null; // ISO date
  paymentId?: string | null; // Mongo ID as string
  stripeAccountId?: string | null; // acct_...
  transferId?: string | null; // tr_...
  payoutId?: string | null; // po_...

  // Timestamps
  createdAt: string;
  updatedAt?: string | null;

  // Legacy/back-compat
  timestamp?: string | Date;
  amount?: number;
  productId?: string;
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
    from?: string; // ISO
    to?: string; // ISO
  };
  limit?: number;
  offset?: number;
}
