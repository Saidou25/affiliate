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
      id
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
        saleAmount
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
      createdAt
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
      lastTransferId
      lastTransferAmount
      lastTransferCurrency
      lastTransferCreatedAt
      lastTransferReversed
    }
  }
`;

export const AFFILIATE_PRODUCTS = gql`
  query AffiliateProducts($active: Boolean) {
    affiliateProducts(active: $active) {
      # id
      wooId
      name
      permalink
      primaryImage
      price
      currency
      onSale
      regularPrice
      salePrice
      stockStatus
      hasOptions
    }
  }
`;

export const GET_AFFILIATESALES = gql`
  query getAffiliateSales(
    $filter: AffiliateSalesFilter
    $limit: Int
    $offset: Int
  ) {
    getAffiliateSales(filter: $filter, limit: $limit, offset: $offset) {
      id
      refId
      source
      orderId
      orderNumber
      orderDate
      status
      currency
      subtotal
      discount
      tax
      shipping
      total
      paymentIntentId

      commissionEarned
      commissionStatus
      processingAt
      paidAt
      stripeAccountId
      transferId
      payoutId

      # ✅ NEW refund fields
      refundStatus
      refundTotal
      refundedAt
      refundId
      refundAmount
      refundAt

      # ✅ NEW payout UX fields
      payoutStatus
      lastPayoutId
      lastPayoutAt
      payoutFailureCode
      payoutFailureMessage

      createdAt
      updatedAt
      items
      product
    }
  }
`;

export const GET_ALLAFFILIATESALES = gql`
  query getAllAffiliateSales {
    getAllAffiliateSales {
      id
      refId
      source
      orderId
      orderNumber
      orderDate
      status
      currency
      subtotal
      discount
      tax
      shipping
      total
      paymentIntentId

      commissionEarned
      commissionStatus
      processingAt
      paidAt
      stripeAccountId
      transferId
      payoutId

      # ✅ NEW refund fields
      refundStatus
      refundTotal
      refundedAt
      refundId
      refundAmount
      refundAt

      # ✅ NEW payout UX fields
      payoutStatus
      lastPayoutId
      lastPayoutAt
      payoutFailureCode
      payoutFailureMessage

      createdAt
      updatedAt
      items
      product
    }
  }
`;

export const STRIPE_CHARGES = gql`
  query StripeCharges($after: String, $limit: Int, $filter: StripeListFilter) {
    stripeCharges(after: $after, limit: $limit, filter: $filter) {
      hasMore
      nextCursor
      data
    }
  }
`;

export const STRIPE_PAYMENT_INTENTS = gql`
  query StripePaymentIntents(
    $after: String
    $limit: Int
    $filter: StripeListFilter
  ) {
    stripePaymentIntents(after: $after, limit: $limit, filter: $filter) {
      hasMore
      nextCursor
      data
    }
  }
`;
