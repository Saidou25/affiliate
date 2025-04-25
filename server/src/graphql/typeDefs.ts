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

  type Query {
    getAffiliate(id: ID!): Affiliate
    getAffiliates: [Affiliate!]!
  }

  type Mutation {
    registerAffiliate(
      email: String!
      name: String!
      refId: String!
      totalClicks: Int!
      totalCommissions: Int!
    ): Affiliate
    logClick(refId: String!): Boolean
  }
`;
export default typeDefs;