import { gql } from "graphql-tag";

const typeDefs = gql`
  scalar Date
  scalar JSON

  # INTERNAL NOTE:
  # - TRANSFER: platform -> connected Stripe account (what this app triggers)
  # - PAYOUT:   connected Stripe account -> bank (Stripe schedules / not our mutation)

  enum Role {
    admin
    affiliate
  }

  enum CommissionStatus {
    unpaid # default
    processing # transfer requested
    paid # transfer succeeded (money in connected acct)
    reversed # transfer reversed
    refunded
  }

  enum PayoutStatus {
    pending
    paid
    failed
    canceled
  }

  enum PaymentStatus {
    processing
    paid
    failed
    transfer_created
    transfer_reversed
  }

  enum RefundStatus {
    none
    partial
    full
  }

  type RefundEntry {
    id: String!
    amount: Float!
    status: String
    createdAt: Date
    updatedAt: Date
  }

  # Unified AffiliateSale type (merged the previous "extend" + "type")
  type AffiliateSale {
    id: ID!

    # legacy/basic sale fields
    refId: String
    productId: String
    buyerEmail: String
    amount: Float
    title: String
    event: String
    timestamp: Date
    commissionEarned: Float
    commissionStatus: CommissionStatus
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
    items: [JSON!]
    product: JSON
    createdAt: Date
    updatedAt: Date
    processingAt: Date
    stripeAccountId: String
    transferId: String
    payoutId: String

    # refunds
    refundStatus: RefundStatus
    refundAmount: Float
    refundId: String
    refundAt: Date # keep if you track "first/primary" refund moment
    refundTotal: Float # sum of all refund entries
    refundedAt: Date # time of last refund event
    refunds: [RefundEntry!]!

    # payout summary for the sale (optional but handy)
    payoutStatus: PayoutStatus
    lastPayoutId: String
    lastPayoutAt: Date
    payoutFailureCode: String
    payoutFailureMessage: String
  }

  input RefundAffiliateSaleInput {
    saleId: ID!
    amount: Float # optional; if omitted => full remaining
    reason: String
  }

  type RefundResult {
    sale: AffiliateSale!
    stripeRefundId: String!
    transferReversalId: String
  }

  type PaymentRecord {
    paymentId: ID
    refId: String
    affiliateId: String
    saleIds: [ID!]
    saleAmount: Float
    paidCommission: Float
    productName: String
    date: Date!
    method: String! # consider a PaymentMethod enum later
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
    createdAt: Date

    # Stripe sync (may be null until reconciled)
    status: PaymentStatus
    transferId: String # tr_...
    balanceTransactionId: String
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

  input RecordAffiliatePaymentInput {
    refId: String!
    saleIds: [ID!]!
    saleAmount: Float
    notes: String
    method: String! # aligned with records
    transactionId: String
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
    data: [JSON!]! # raw Stripe objects (or define strong types later)
  }

  input StripeListFilter {
    createdFrom: Int
    createdTo: Int
    email: String
    refId: String
    status: String
  }

  type ReportEntry {
    month: String!
    pdf: String
    html: String
    createdAt: Date
  }

  type ReportHistory {
    id: ID!
    month: String!
    html: String
    pdf: String
    createdAt: Date
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
    description: String
    shortDescription: String
    plainDescription: String
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
    createdAt: Date
    ipAddress: String
    updatedAt: Date
  }

  type Query {
    getAffiliates: [Affiliate!]!
    getAffiliate(id: ID!): Affiliate
    getAffiliateByRefId(refId: String!): Affiliate
    me: Affiliate

    getAllAffiliateSales: [AffiliateSale!]!
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

    stripePaymentIntents(
      after: String
      limit: Int = 25
      filter: StripeListFilter
    ): StripeListPage!

    stripeCharges(
      after: String
      limit: Int = 25
      filter: StripeListFilter
    ): StripeListPage!

    stripeRefunds(
      after: String
      limit: Int = 25
      filter: StripeListFilter
    ): StripeListPage!

    stripeTransfers(
      after: String
      limit: Int = 25
      filter: StripeListFilter
    ): StripeListPage!

    stripeBalanceTxns(
      after: String
      limit: Int = 25
      filter: StripeListFilter
    ): StripeListPage!
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
      commissionStatus: CommissionStatus
    ): AffiliateSale!

    updateAffiliateSale(
      id: ID!
      buyerEmail: String
      amount: Float
      title: String
      event: String
      timestamp: Date
      commissionEarned: Float
      commissionStatus: CommissionStatus
    ): AffiliateSale!

    markSaleAsPaid(saleId: ID!): AffiliateSale!

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

    refreshWooProducts(baseUrl: String!, perPage: Int = 100): WooSyncSummary!

    createAffiliateTransfer(
      refId: String!
      amount: Float!
      currency: String = "usd"
      productName: String
      saleIds: [ID!]
      notes: String
    ): Payment!

    refundAffiliateSale(input: RefundAffiliateSaleInput!): RefundResult!
  }

  type AuthPayload {
    token: String!
    affiliate: Affiliate!
  }
`;
export default typeDefs;
