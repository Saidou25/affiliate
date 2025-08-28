import { gql } from "graphql-tag";

const typeDefs = gql`
  scalar Date
  scalar JSON

  enum Role {
    admin
    affiliate
  }

  type PaymentRecord {
    saleAmount: Float!
    paidCommission: Float
    productName: String
    date: Date!
    method: String!
    transactionId: String
    notes: String
  }

  type Payment {
    id: ID!
    refId: String!
    affiliateId: String
    saleIds: [ID!]!
    saleAmount: Float!
    paidCommission: Float
    date: Date!
    productName: String
    method: String!
    transactionId: String
    notes: String
  }

  input PaymentInput {
    saleAmount: Float!
    paidCommission: Float
    affiliateId: String
    date: Date!
    method: String!
    productName: String
    transactionId: String
    notes: String
  }

  input RecordAffiliatePaymentInput {
    refId: String!
    affiliateId: String
    saleIds: [ID!]!
    saleAmount: Float!
    paidCommission: Float
    productName: String
    method: String!
    transactionId: String
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

    # new
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
    # pageUrl: String
    # userAgent: String
    # createdAt: String
    # ipAddress: String
    createdAt: Date
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

  type StripeStatus {
    id: ID!
    charges_enabled: Boolean
    payouts_enabled: Boolean
    details_submitted: Boolean
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
    getAffiliateSales(refId: ID!): [AffiliateSale!]!
    affiliateSales(
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

    clickLog(refId: String, createdAt: Date): ClickLog

    trackAffiliateSale(
      productId: String
      refId: String!
      buyerEmail: String
      amount: Int
      event: String
      title: String
      timestamp: Date
      commissionEarned: Float
      commissionStatus: String
    ): AffiliateSale!

    updateAffiliateSale(
      id: ID!
      buyerEmail: String
      amount: Int
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
  }
`;
export default typeDefs;
