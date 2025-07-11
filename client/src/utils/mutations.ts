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

export const UPDATE_AFFILIATE_SALE = gql`
  mutation UpdateAffiliateSale($saleId: ID!, $commissionStatus: String) {
    updateAffiliateSale(id: $saleId, commissionStatus: $commissionStatus) {
      id
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
      productId
      buyerEmail
      amount
      event
      timestamp
      commissionEarned
      commissionStatus
    }
  }
`;

export const RECORD_AFFILIATE_PAYMENT = gql`
  mutation RecordAffiliatePayment($input: RecordAffiliatePaymentInput!) {
    recordAffiliatePayment(input: $input) {
      id
      refId
      affiliateId
      saleAmount
      productName
      method
      transactionId
      notes
      saleIds
    }
  }
`;

export const SAVE_HTML_REPORT = gql`
  mutation SaveHtmlReport($html: String!, $month: String!) {
    saveHtmlReport(html: $html, month: $month) {
      id
      month
      html
      pdf
      createdAt
    }
  }
`;

export const CREATE_AFFILIATE_STRIPE_ACCOUNT = gql`
  mutation CreateAffiliateStripeAccount($affiliateId: ID!) {
    createAffiliateStripeAccount(affiliateId: $affiliateId) {
      url
      resumed
    }
  }
`;

export const MARK_NOTIFICATIONS_READ = gql`
  mutation MarkNotificationsRead($refId: String!) {
    markNotificationsRead(refId: $refId) {
      id
      notifications {
        title
        read
        text
        date
      }
    }
  }
`;

export const CREATE_NOTIFICATION = gql`
  mutation CreateNotification(
    $refId: String!
    $title: String!
    $text: String!
  ) {
    createNotification(refId: $refId, title: $title, text: $text) {
      id
      notifications {
        date
        title
        text
        read
      }
    }
  }
`;

export const UPDATE_NOTIFICATION_READ_STATUS = gql`
  mutation UpdateNotificationReadStatus(
    $refId: String!
    $title: String!
    $read: Boolean!
  ) {
    updateNotificationReadStatus(refId: $refId, title: $title, read: $read) {
      id
      notifications {
        date
        title
        text
        read
      }
    }
  }
`;
