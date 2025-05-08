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
  query GetAffiliate($id: string) {
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
// export const GET_PRODUCTSLIST = gql`
//   query GetProductsList {
//     getProductsList {
//       id
//       title
//       subtitle
//       description
//       price
//       quantity
//       category
//       imageUrl
//       url
//     }
//   }
// `;

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
