import { gql } from "graphql-tag";

const typeDefs = gql`
  type Affiliate {
    id: ID!
    email: String!
    name: String
    refId: String
    totalClicks: Int
    totalCommissions: Int
  }
  
  type AuthPayload {
    token: String!
    affiliate: Affiliate!
  }

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
    # getProductsList: [Product!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    registerAffiliate(
      email: String!
      name: String
      refId: String!
      totalClicks: Int
      totalCommissions: Int
      password: String
    ): AuthPayload!

    updateAffiliate(
      id: ID!
      name: String
      email: String
      totalClicks: Int
      totalCommissions: Int
    ): Affiliate

    deleteAffiliate(id: ID!): Affiliate

    logClick(refId: String!): Boolean

    trackReferral(email: String, refId: String, event: String): Referral

  }
`;
export default typeDefs;
