import { gql } from "@apollo/client";

export const REGISTER_AFFILIATE = gql`
  mutation RegisterAffiliate(
    $name: String!
    $email: String!
    $refId: String!
    $totalClicks: Int!
    $totalCommissions: Int!
  ) {
    registerAffiliate(
      name: $name
      email: $email
      refId: $refId
      totalClicks: $totalClicks
      totalCommissions: $totalCommissions
    ) {
      id
      name
      email
      refId
      totalClicks
      totalCommissions
    }
  }
`;

export const DELETE_AFFILIATE = gql`
  mutation DeleteAffiliate($id: ID!) {
    deleteAffiliate(id: $id) {
      id
      email
    }
  }
`;
