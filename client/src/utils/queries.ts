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
      # selectedProducts {
      #   _id
      #   name
      #   price
      # }
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
      # selectedProducts {
      #   _id
      #   name
      #   price
      # }
    }
  }
`;

export const GET_ALLAFFILIATESALES = gql`
  query getAllAffiliateSales {
    getAllAffiliateSales {
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

export const GET_AFFILIATESALES = gql`
  query GetAffiliateSales($refId: ID!) {
    getAffiliateSales(refId: $refId) {
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

export const QUERY_ME = gql`
  query me {
    me {
      id
      email
      refId
      name
      # selectedProducts {
      #   _id
      #   name
      #   price
      # }
    }
  }
`;
