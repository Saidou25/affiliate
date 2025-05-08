import { gql } from "graphql-tag";

const typeDefs = gql`
  type Affiliate {
    id: ID!
    email: String!
    name: String
    refId: String!
    totalClicks: Int
    totalCommissions: Int
  }

  # input ProductInput {
  #   id: ID
  #   title: string
  #   subtitle: string
  #   description: string
  #   price: Int
  #   quantity: Int
  #   category: string
  #   imageUrl: string
  #   url: string
  # }

  # type Product {
  #   id: ID
  #   title: string
  #   subtitle: string
  #   description: string
  #   price: Int
  #   quantity: Int
  #   category: string
  #   imageUrl: string
  #   url: string
  # }

  type Referral {
    email: String
    refId: String
    event: String
  }

  type Query {
    getAffiliate(id: ID!): Affiliate
    getAffiliates: [Affiliate!]!
    getReferrals: [Referral!]!
    # getProductsList: [Product!]!
  }

  type Mutation {
    registerAffiliate(
      email: String!
      name: String!
      refId: String!
      totalClicks: Int
      totalCommissions: Int
    ): Affiliate

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

    # createProductsList(input: ProductInput!): Product
  }
`;
export default typeDefs;
