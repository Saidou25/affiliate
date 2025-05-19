import { gql } from "graphql-tag";
const typeDefs = gql `
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

  type AffiliateSale {
    email: String
    refId: String
    event: String
  }

  type Query {
    getAffiliates: [Affiliate!]!
    getAffiliate(id: ID!): Affiliate
    me: Affiliate
    getAllAffiliateSales: [AffiliateSale!]!
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

    trackAffiliateSale(email: String, refId: String, event: String): AffiliateSale

  }
`;
export default typeDefs;
