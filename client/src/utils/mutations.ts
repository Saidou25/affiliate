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
        # selectedProducts {
        #   _id
        #   name
        #   price
        # }
      }
    }
  }
`;

export const REGISTER_AFFILIATE = gql`
  mutation RegisterAffiliate(
    $email: String!
    $password: String!
    $refId: String!
  ) {
    registerAffiliate(
      email: $email
      password: $password
      refId: $refId
    ) {
      token
      affiliate {
        id
        email
        refId
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

export const TRACK_AFFILIATESALES = gql`
  mutation TrackAffiliateSale(
    # $affiliateId: String
    $productId: String
    $refId: String
    $buyerEmail: String
    $amount: Float
    $event: String
    $timestamp: Date
  ) {
    trackAffiliateSale(
      # affiliateId: $affiliateId
      productId: $productId
      refId: $refId
      buyerEmail: $buyerEmail
      amount: $amount
      event: $event
      timestamp: $timestamp
    ) {
      # affiliateId
      productId
      refId
      buyerEmail
      amount
      event
      timestamp
    }
  }
`;

export const CLICK_LOG = gql`
  mutation ClickLog($refId: String!) {
    clickLog(refId: $refId)
  }
`;
