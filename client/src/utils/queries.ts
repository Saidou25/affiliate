import { gql } from "@apollo/client";

export const GET_AFFILIATES = gql`
  query GetAffiliates {
    getAffiliates {
      id
      name
      email
      refId
      totalClicks
      totalCommissions
      commissionRate
      totalSales
      createdAt
    }
  }
`;

export const GET_AFFILIATE = gql`
  query GetAffiliate($id: ID!) {
    getAffiliate(id: $id) {
      id
      name
      email
      refId
      totalClicks
      totalCommissions
      commissionRate
      totalSales
      createdAt
    }
  }
`;

export const GET_ALLAFFILIATESALES = gql`
  query getAllAffiliateSales {
    getAllAffiliateSales {
      productId
      refId
      buyerEmail
      amount
      event
      timestamp
    }
  }
`;

export const GET_AFFILIATESALES = gql`
  query GetAffiliateSales($refId: ID!) {
    getAffiliateSales(refId: $refId) {
      productId
      refId
      buyerEmail
      amount
      event
      timestamp
    }
  }
`;

export const QUERY_ME = gql`
  query me {
    me {
      id
      email
      refId
      name
      totalClicks
      totalCommissions
      commissionRate
      totalSales
      createdAt
    }
  }
`;

export const GET_AFFILIATECLICKLOGS = gql`
  query getAffiliateClickLogs($refId: ID) {
    getAffiliateClickLogs(refId: $refId) {
      id
      refId
      createdAt
      updatedAt
    }
  }
`;
