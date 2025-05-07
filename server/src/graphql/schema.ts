// import { gql } from "graphql-tag";

// const typeDefs = gql`
//   type Affiliate {
//     id: ID!
//     name: String!
//     email: String!
//     refId: String
//     totalClicks: Number
//     totalCommissions: Number
//   }

//   type Referral {
//     id: ID
//     refId: String!
//     email: String!
//     event: String!
//     # timestamp: String
//   }

//   type Query {
//     getAffiliates: [Affiliate!]!
//     getAffiliate(id: ID!): Affiliate
//     getReferrals: [Referral!]!
//   }

//   type Mutation {
//     registerAffiliate(
//       name: String!
//       email: String!
//       refId: String!
//       totalClicks: Int
//       totalCommissions: Int
//     ): Affiliate
//     deleteAffiliate(id: ID!): Affiliate
//     trackReferral(refId: String!, event: String!, email: String!): Referral
//   }
// `;

// export default typeDefs;
