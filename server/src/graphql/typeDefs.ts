import { gql } from "graphql-tag";

const typeDefs = gql`
  scalar Date

  type Affiliate {
    id: ID!
    email: String!
    name: String
    refId: String
    totalClicks: Int
    totalCommissions: Int
    # selectedProducts: [ID!]
  }

  input RegisterAffiliateInput {
    name: String
    email: String!
    password: String!
    refId: String!
    totalClicks: Int
    totalCommissions: Int
    # selectedProducts: [ID!]
  }

  type AuthPayload {
    token: String!
    affiliate: Affiliate!
  }

  type AffiliateSale {
    id: ID!
    # affiliateId: ID!
    productId: String!
    refId: String!
    buyerEmail: String
    amount: Int!
    event: String!
    timestamp: Date!
  }

  type Query {
    getAffiliates: [Affiliate!]!
    getAffiliate(id: ID!): Affiliate
    me: Affiliate
    getAllAffiliateSales: [AffiliateSale!]!
    getAffiliateSales(refId: ID!): [AffiliateSale!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!

    registerAffiliate(input: RegisterAffiliateInput!): AuthPayload!

    updateAffiliate(
      id: ID!
      name: String
      email: String
      totalClicks: Int
      totalCommissions: Int
    ): Affiliate

    deleteAffiliate(id: ID!): Affiliate

    logClick(refId: String!): Boolean

    trackAffiliateSale(
      # affiliateId: ID!
      productId: String!
      refId: String!
      buyerEmail: String
      amount: Int!
      event: String!
      timestamp: Date
    ): AffiliateSale!
  }
`;
export default typeDefs;
