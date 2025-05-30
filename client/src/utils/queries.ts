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
      role
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
      role
    }
  }
`;

export const GET_ALLAFFILIATESALES = gql`
  query getAllAffiliateSales {
    getAllAffiliateSales {
      id
      productId
      refId
      buyerEmail
      amount
      event
      timestamp
      commissionEarned
    }
  }
`;

export const GET_AFFILIATESALES = gql`
  query GetAffiliateSales($refId: ID!) {
    getAffiliateSales(refId: $refId) {
      id
      productId
      refId
      buyerEmail
      amount
      event
      timestamp
      commissionEarned
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
      role
    }
  }
`;

export const GET_ALLAFFILIATESCLICKLOGS = gql`
  query getAllAffiliatesClickLogs {
    getAllAffiliatesClickLogs {
      id
      refId
      createdAt
      updatedAt
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
