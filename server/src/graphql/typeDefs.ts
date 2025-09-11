import { gql } from "graphql-tag";

const typeDefs = gql`
  scalar Date
  scalar JSON

  enum Role {
    admin
    affiliate
  }

  enum CommissionStatus {
    unpaid # default
    processing # transfer requested
    paid # transfer succeeded (money in connected acct)
    reversed # transfer reversed
  }

  enum PaymentStatus {
    processing
    paid
    failed
    transfer_created
    transfer_reversed
  }

  type PaymentRecord {
    # mirroring Payment (snapshot)
    paymentId: ID
    refId: String
    affiliateId: String
    saleIds: [ID!]
    saleAmount: Float
    paidCommission: Float
    productName: String
    date: Date!
    method: String!
    transactionId: String
    notes: String
    currency: String
    status: PaymentStatus
    paidAt: Date
  }

  type Payment {
    id: ID!
    refId: String!
    affiliateId: String
    saleIds: [ID!]!
    saleAmount: Float
    paidCommission: Float
    date: Date!
    productName: String
    currency: String
    method: String!
    transactionId: String
    notes: String
    createdAt: String

    # Stripe sync
    status: PaymentStatus # <-- switch to enum
    transferId: String # tr_...
    balanceTransactionId: String # txn_...
    payoutId: String
    payoutStatus: String
    payoutArrivalDate: Date
    paidAt: Date
  }

  input PaymentInput {
    saleAmount: Float
    paidCommission: Float
    affiliateId: String
    date: Date!
    method: String!
    productName: String
    transactionId: String
    notes: String
  }

  # input RecordAffiliatePaymentInput {
  #   refId: String!
  #   affiliateId: String
  #   saleIds: [ID!]!
  #   saleAmount: Float
  #   paidCommission: Float
  #   productName: String
  #   method: String!
  #   transactionId: String
  #   notes: String
  # }

  input RecordAffiliatePaymentInput {
    refId: String!
    saleIds: [ID!]!
    saleAmount: Float
    notes: String
  }

  type StripeDeletionResponse {
    success: Boolean!
    deleted: JSON
  }

  type Notification {
    date: Date
    title: String
    text: String
    read: Boolean
  }

  type Affiliate {
    id: ID!
    email: String!
    name: String
    refId: String
    totalClicks: Int
    totalCommissions: Float
    commissionRate: Float
    totalSales: Int
    createdAt: Date
    stripeAccountId: String
    updatedAt: Date
    role: Role
    paymentHistory: [PaymentRecord!]!
    notifications: [Notification]
    avatar: String
  }

  type StripeStatus {
    id: ID!
    charges_enabled: Boolean
    payouts_enabled: Boolean
    details_submitted: Boolean
    lastTransferId: String
    lastTransferCreatedAt: Date
    lastTransferAmount: Float
    lastTransferReversed: Boolean
    lastTransferCurrency: String
  }

type StripeListPage {
  hasMore: Boolean!
  nextCursor: String
  data: [JSON!]!  # raw Stripe objects (or define strong types later)
}

input StripeListFilter {
  createdFrom: Int
  createdTo: Int
  email: String
  refId: String
  status: String
}

  type AuthPayload {
    token: String!
    affiliate: Affiliate!
  }

  type AffiliateSale {
    id: ID!
    # legacy
    refId: String
    productId: String
    buyerEmail: String
    amount: Float
    title: String
    event: String
    timestamp: Date
    commissionEarned: Float
    commissionStatus: String
    paidAt: Date
    paymentId: ID
    source: String
    orderId: String
    orderNumber: String
    orderDate: Date
    status: String
    currency: String
    subtotal: Float
    discount: Float
    tax: Float
    shipping: Float
    total: Float
    paymentIntentId: String
    items: [JSON!] # or a structured type if you know the shape
    product: JSON
    createdAt: Date
    updatedAt: Date
  }

  input AffiliateSalesFilter {
    refId: String
    source: String
    orderId: String
    status: String
    from: Date
    to: Date
  }

  type ClickLog {
    id: ID
    refId: String
    pageUrl: String
    userAgent: String
    createdAt: String
    ipAddress: String
    updatedAt: Date
  }

  type ReportEntry {
    month: String!
    pdf: String
    html: String
    createdAt: String
  }

  type ReportHistory {
    id: ID!
    month: String!
    html: String
    pdf: String
    createdAt: String
  }

  type OnboardingResponse {
    onboardingUrl: String!
    stripeAccountId: String!
  }

  type StripeOnboardingResult {
    url: String!
    resumed: Boolean!
  }

  input SendEmailInput {
    refId: String
    buyerEmail: String
    affiliateEmail: String
    event: String
    title: String
    amount: Float
    commission: Float
    text: String
  }

  "Public, shop-visible products (parents only) synced from Woo Store API"
  type AffiliateProduct {
    id: ID! # Mongo _id (string)
    wooId: Int! # Store API product id
    slug: String!
    name: String!
    permalink: String!
    price: Float
    currency: String
    onSale: Boolean
    regularPrice: Float
    salePrice: Float
    stockStatus: String! # "in_stock" | "out_of_stock"
    primaryImage: String
    categorySlugs: [String!]!
    updatedAt: Date!
    hasOptions: Boolean! # true if Woo type = "variable"
    active: Boolean! # false if not seen in last sync
    createdAt: Date!
    modifiedAt: Date! # server-side last write
  }

  type WooSyncSummary {
    ok: Boolean!
    totalFetched: Int!
    created: Int!
    updated: Int!
    inactivated: Int!
    finishedAt: Date!
    notes: [String!]!
  }

  type Query {
    getAffiliates: [Affiliate!]!
    getAffiliate(id: ID!): Affiliate
    getAffiliateByRefId(refId: String!): Affiliate
    me: Affiliate
    getAllAffiliateSales: [AffiliateSale!]!
    # getAffiliateSales(refId: ID!): [AffiliateSale!]!
    getAffiliateSales(
      filter: AffiliateSalesFilter
      limit: Int = 50
      offset: Int = 0
    ): [AffiliateSale!]!
    getAffiliateClickLogs(refId: ID): [ClickLog]
    getAllAffiliatesClickLogs: [ClickLog!]!
    getReportByMonth(month: String!): ReportHistory
    getAllReports: [ReportHistory!]!
    getAffiliatePaymentHistory(refId: String!): [PaymentRecord!]!
    getAllAffiliatePayments: [PaymentRecord!]!
    getAllPayments: [Payment!]!
    checkStripeStatus(affiliateId: ID!): StripeStatus
    affiliateProducts(active: Boolean = true): [AffiliateProduct!]!
    stripePaymentIntents(after: String, limit: Int = 25, filter: StripeListFilter): StripeListPage!
    stripeCharges(after: String, limit: Int = 25, filter: StripeListFilter): StripeListPage!
    stripeRefunds(after: String, limit: Int = 25, filter: StripeListFilter): StripeListPage!
    stripeTransfers(after: String, limit: Int = 25, filter: StripeListFilter): StripeListPage!
    stripeBalanceTxns(after: String, limit: Int = 25, filter: StripeListFilter): StripeListPage!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!

    sendEmail(input: SendEmailInput!): String!

    registerAffiliate(
      password: String!
      email: String!
      refId: String
      createdAt: Date
      updatedAt: Date
    ): AuthPayload!

    updateAffiliate(
      id: ID!
      name: String
      email: String
      totalClicks: Int
      refId: String
      totalCommissions: Float
      commissionRate: Float
      totalSales: Int
      updatedAt: Date
      avatar: String
      createdAt: Date
    ): Affiliate!

    deleteAffiliate(id: ID!): Affiliate

    clickLog(refId: String): ClickLog

    trackAffiliateSale(
      productId: String
      refId: String!
      buyerEmail: String
      amount: Float
      event: String
      title: String
      timestamp: Date
      commissionEarned: Float
      commissionStatus: String
    ): AffiliateSale!

    updateAffiliateSale(
      id: ID!
      buyerEmail: String
      amount: Float
      title: String
      event: String
      timestamp: Date
      commissionEarned: Float
      commissionStatus: String
    ): AffiliateSale!

    markSaleAsPaid(saleId: String!): AffiliateSale!

    recordAffiliatePayment(input: RecordAffiliatePaymentInput!): Payment

    addMonthlyReport(month: String!, pdf: String!): ReportHistory!

    addAffiliatePayment(refId: String!, payment: PaymentInput!): Affiliate!

    saveHtmlReport(html: String!, month: String!): ReportHistory

    createAffiliateStripeAccount(affiliateId: ID!): StripeOnboardingResult!

    createNotification(
      refId: String!
      title: String!
      text: String!
    ): Affiliate!

    deleteNotification(refId: String!): Affiliate!

    markNotificationsRead(refId: String!): Affiliate!

    updateNotificationReadStatus(
      refId: String!
      title: String!
      read: Boolean!
    ): Affiliate!

    disconnectStripeAccount(affiliateId: ID!): StripeDeletionResponse

    recordAffiliateSale(
      refId: String!
      orderId: String!
      amount: Float!
    ): AffiliateSale

    "Manually refresh Woo public catalog (parents only)."
    refreshWooProducts(baseUrl: String!, perPage: Int = 100): WooSyncSummary!

    createAffiliateTransfer(
      refId: String!
      amount: Float! # dollars
      currency: String = "usd"
      productName: String
      saleIds: [ID!]
      notes: String
    ): Payment!
  }
`;
export default typeDefs;
