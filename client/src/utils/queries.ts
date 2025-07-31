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
      avatar
      stripeAccountId
      # paymentHistory {
      #   date
      #   amount
      #   method
      #   transactionId
      #   notes
      # }
      notifications {
        date
        title
        text
        read
      }
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
      avatar
      stripeAccountId
      # paymentHistory {
      #   date
      #   amount
      #   method
      #   transactionId
      #   notes
      # }
      notifications {
        date
        title
        text
        read
      }
    }
  }
`;

export const GET_AFFILIATE_BY_REFID = gql`
  query GetAffiliateByRefId($refId: String!) {
    getAffiliateByRefId(refId: $refId) {
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
      avatar
      stripeAccountId
      # paymentHistory {
      #   date
      #   amount
      #   method
      #   transactionId
      #   notes
      # }
      notifications {
        date
        title
        text
        read
      }
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
      avatar
      stripeAccountId
      # paymentHistory {
      #   date
      #   amount
      #   method
      #   transactionId
      #   notes
      # }
      notifications {
        date
        title
        text
        read
      }
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
      title
      commissionEarned
      commissionStatus
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
      title
      timestamp
      commissionEarned
      commissionStatus
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

export const GET_REPORT_BY_MONTH = gql`
  query getReportByMonth($month: String!) {
    getReportByMonth(month: $month) {
      month
      createdAt
      pdf
    }
  }
`;

export const GET_ALLREPORTS = gql`
  query GetAllReports {
    getAllReports {
      id
      month
      html
      pdf
      createdAt
    }
  }
`;

export const GET_AFFILIATE_PAYMENT_HISTORY = gql`
  query GetAffiliatePaymentHistory($refId: String!) {
    getAffiliatePaymentHistory(refId: $refId) {
      amount
      date
      method
      transactionId
      notes
    }
  }
`;

export const GET_ALL_AFFILIATE_PAYMENTS = gql`
  query GetAllAffiliatePayments {
    getAllAffiliatePayments {
      id
      email
      name
      paymentHistory {
        amount
        date
        method
      }
    }
  }
`;

export const GET_ALL_PAYMENTS = gql`
  query GetAllPayments {
    getAllPayments {
      id
      affiliateId
      saleIds
      saleAmount
      paidCommission
      productName
      date
      method
      transactionId
      notes
    }
  }
`;

export const CHECK_STRIPE_STATUS = gql`
  query CheckStripeStatus($affiliateId: ID!) {
    checkStripeStatus(affiliateId: $affiliateId) {
      id
      charges_enabled
      payouts_enabled
      details_submitted
    }
  }
`;
