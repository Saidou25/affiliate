import { gql } from "graphql-tag";

const typeDefs = gql`
  scalar Date

  enum Role {
    admin
    affiliate
  }

  type PaymentRecord {
    amount: Float!
    date: Date!
    method: String!
    transactionId: String
    notes: String
  }

  input PaymentInput {
    amount: Float!
    date: Date!
    method: String!
    transactionId: String
    notes: String
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
    updatedAt: Date
    role: Role
    paymentHistory: [PaymentRecord!]!
  }

  type AuthPayload {
    token: String!
    affiliate: Affiliate!
  }

  type AffiliateSale {
    id: ID!
    productId: String!
    refId: String!
    buyerEmail: String
    amount: Int!
    event: String!
    timestamp: Date!
    commissionEarned: Float
    commissionStatus: String
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
    pdf: String!
    createdAt: String
  }

  type ReportHistory {
    id: ID!
    reportHistory: [ReportEntry!]!
  }

  type Query {
    getAffiliates: [Affiliate!]!
    getAffiliate(id: ID!): Affiliate
    me: Affiliate
    getAllAffiliateSales: [AffiliateSale!]!
    getAffiliateSales(refId: ID!): [AffiliateSale!]!
    getAffiliateClickLogs(refId: ID): [ClickLog]
    getAllAffiliatesClickLogs: [ClickLog!]!
    getReportByMonth(month: String!): ReportEntry
    getAllReports: [ReportEntry!]!
    getAffiliatePaymentHistory(refId: String!): [PaymentRecord!]!
    getAllAffiliatePayments: [PaymentRecord!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!

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
      createdAt: Date
    ): Affiliate!

    deleteAffiliate(id: ID!): Affiliate

    clickLog(refId: String, createdAt: Date): ClickLog

    trackAffiliateSale(
      productId: String!
      refId: String!
      buyerEmail: String
      amount: Int!
      event: String!
      timestamp: Date
      commissionEarned: Float
      commissionStatus: String
    ): AffiliateSale!

    markSaleAsPaid(saleId: ID!): AffiliateSale

    addMonthlyReport(month: String!, pdf: String!): ReportEntry!

    addAffiliatePayment(affiliateId: ID!, payment: PaymentInput!): Affiliate!
  }
`;
export default typeDefs;
