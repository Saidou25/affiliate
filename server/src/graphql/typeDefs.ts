import { gql } from "graphql-tag";

const typeDefs = gql`
  type Affiliate {
    id: ID!
    email: String!
    name: String
    refId: String!
    totalClicks: Int!
    totalCommissions: Int!
  }

  type Referral {
    email: String
    refId: String
    event: String
  }

  type Query {
    getAffiliate(id: ID!): Affiliate
    getAffiliates: [Affiliate!]!
    getReferrals: [Referral!]!
  }

  type Mutation {
    registerAffiliate(
      email: String!
      name: String!
      refId: String!
      totalClicks: Int!
      totalCommissions: Int!
    ): Affiliate
    deleteAffiliate(id: ID!): Affiliate
    logClick(refId: String!): Boolean
    trackReferral(email: String, refId: String, event: String): Referral
  }
`;
export default typeDefs;
