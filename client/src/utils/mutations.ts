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
    registerAffiliate(email: $email, password: $password, refId: $refId) {
      token
      affiliate {
        id
        email
        refId
        createdAt
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
    $commissionRate: Int
  ) {
    updateAffiliate(
      id: $id
      name: $name
      email: $email
      refId: $refId
      totalClicks: $totalClicks
      totalCommissions: $totalCommissions
      commissionRate: $commissionRate
    ) {
      id
      email
      name
      totalClicks
      totalCommissions
      commissionRate
      updatedAt
      totalSales
    }
  }
`;

export const TRACK_AFFILIATESALES = gql`
  mutation TrackAffiliateSale(
    $productId: String
    $refId: String
    $buyerEmail: String
    $amount: Float
    $event: String
    $timestamp: Date
  ) {
    trackAffiliateSale(
      productId: $productId
      refId: $refId
      buyerEmail: $buyerEmail
      amount: $amount
      event: $event
      timestamp: $timestamp
    ) {
      id
      productId
      refId
      buyerEmail
      amount
      event
      timestamp
      commissionEarned
      commissionStatus
    }
  }
`;

export const CLICK_LOG = gql`
  mutation ClickLog($refId: String) {
    clickLog(refId: $refId) {
      refId
      createdAt
      updatedAt
    }
  }
`;

export const MARK_SALE_HAS_PAID = gql`
  mutation MarkSaleAsPaid($saleId: String!) {
    markSaleAsPaid(saleId: $saleId) {
      id
      refId
      createdAt
      updatedAt
      productId
      refId
      buyerEmail
      amount
      event
      timestamp
      commissionEarned
      commissionStatus
    }
  }
`;
