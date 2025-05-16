import { gql } from "graphql-tag";

const typeDefs = gql`
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
    # selectedProducts: [ID!] # ✅ Expect an array of product IDs
  }

  type AuthPayload {
    token: String!
    affiliate: Affiliate!
  }

  # type Product {
  #   id: ID!
  #   title: String!
  #   subtitle: String!
  #   description: String
  #   price: Float
  #   quantity: Int
  #   category: String!
  #   imageUrl: String
  #   url: String
  # }

  # input ProductInput {
  #   id: ID!
  #   title: String!
  #   subtitle: String!
  #   description: String
  #   price: Float
  #   quantity: Int
  #   category: String!
  #   imageUrl: String
  #   url: String
  # }

  type Referral {
    email: String
    refId: String
    event: String
  }

  type Query {
    getAffiliates: [Affiliate!]!
    getAffiliate(id: ID!): Affiliate
    me: Affiliate
    getReferrals: [Referral!]!
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
      # selectedProducts: [ID!]C
    ): Affiliate

    deleteAffiliate(id: ID!): Affiliate

    logClick(refId: String!): Boolean

    trackReferral(email: String, refId: String, event: String): Referral
  }
`;
export default typeDefs;
