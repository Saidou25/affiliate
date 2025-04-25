import { gql } from 'graphql-tag'; 

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    getUsers: [User!]!
    getUser(id: ID!): User
  }

  type Mutation {
    createUser(name: String!, email: String!): User
  }
`;

export default typeDefs;
