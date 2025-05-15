import { gql } from "@apollo/client";

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      affiliate {
        id
        name
        email
        refId
        totalClicks
        totalCommissions
        selectedProducts {
          _id
          name
          price
        }
      }
    }
  }
`;

export const REGISTER_AFFILIATE = gql`
  mutation RegisterAffiliate(
    $email: String!
    $password: String!
    $refId: String!
    $name: String
    $totalClicks: Int
    $totalCommissions: Int
    $selectedProducts: [ID!]
  ) {
    registerAffiliate(
      name: $name
      email: $email
      refId: $refId
      password: $password
      totalClicks: $totalClicks
      totalCommissions: $totalCommissions
      selectedProducts: $selectedProducts
    ) {
      token
      affiliate {
        id
        name
        email
        refId
        totalClicks
        totalCommissions
        selectedProducts {
          _id
          name
          price
        }
      }
    }
  }
`;

export const DELETE_AFFILIATE = gql`
  mutation DeleteAffiliate($id: ID!) {
    deleteAffiliate(id: $id) {
      id
      email
      name
      totalClicks
      totalCommissions
    }
  }
`;

export const UPDATE_AFFILIATE = gql`
  mutation UpdateAffiliate(
    $id: ID!
    $name: String
    $email: String
    $refId: String
    $totalClicks: Int
    $totalCommissions: Int
  ) {
    updateAffiliate(
      id: $id
      name: $name
      email: $email
      refId: $refId
      totalClicks: $totalClicks
      totalCommissions: $totalCommissions
    ) {
      id
      email
      name
      totalClicks
      totalCommissions
    }
  }
`;

export const LOG_CLICK = gql`
  mutation LogClick($refId: String!) {
    logClick(refid: $refId)
  }
`;
