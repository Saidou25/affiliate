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
    }
  }
`;

export const GET_AFFILIATE = gql`
  query GetAffiliate($id: Id!) {
    getAffiliate(id: $id) {
      id
      name
      email
      refId
      totalClicks
      totalCommissions
    }
  }
`;

export const GET_REFERRALS = gql`
  query GetReferrals {
    getReferrals {
      # id
      event
      email
      refId
    }
  }
`;

export const QUERY_ME = gql`
  query me {
    me {
      id
      email
      refId
    }
  }
`;
