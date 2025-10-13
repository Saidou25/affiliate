import { gql } from "@apollo/client";

export const CREATE_STRIPE_EXPRESS_LOGIN_LINK = gql`
  mutation CreateStripeExpressDashboardLink($refId: String!) {
    createStripeExpressDashboardLink(refId: $refId) {
      url
    }
  }
`;

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
    $totalCommissions: Float
    $commissionRate: Float
    $avatar: String
  ) {
    updateAffiliate(
      id: $id
      name: $name
      email: $email
      refId: $refId
      totalClicks: $totalClicks
      totalCommissions: $totalCommissions
      commissionRate: $commissionRate
      avatar: $avatar
    ) {
      id
      name
      email
      refId
      totalClicks
      totalCommissions
      commissionRate
      avatar
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
    $title: String
    $event: String
    $timestamp: Date
  ) {
    trackAffiliateSale(
      productId: $productId
      refId: $refId
      title: $title
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
      title
      timestamp
      commissionEarned
      commissionStatus
      paidAt
      processingAt
      stripeAccountId
      transferId
      payoutId
    }
  }
`;

export const UPDATE_AFFILIATE_SALE = gql`
  mutation UpdateAffiliateSale($saleId: ID!, $commissionStatus: String) {
    updateAffiliateSale(id: $saleId, commissionStatus: $commissionStatus) {
      id
      commissionStatus
      paidAt
      processingAt
      stripeAccountId
      transferId
      payoutId
    }
  }
`;

export const CLICK_LOG = gql`
  mutation ClickLog($refId: String) {
    clickLog(refId: $refId) {
      id
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
      paidCommission
      status
      transferId
      notes
      saleIds
      createdAt
    }
  }
`;

export const ADD_AFFILIATE_PAYMENT = gql`
  mutation AddAffiliatePayment($refId: String!, $payment: PaymentInput!) {
    addAffiliatePayment(refId: $refId, payment: $payment) {
      id
      refId
      totalCommissions
      paymentHistory {
        saleAmount
        paidCommission
        productName
        date
        method
        transactionId
        notes
        # status        # ← optional
      }
      updatedAt
    }
  }
`;

export const GET_AFFILIATE_PAYMENT_HISTORY = gql`
  query GetAffiliatePaymentHistory($refId: String!) {
    getAffiliatePaymentHistory(refId: $refId) {
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

export const UPDATE_NOTIFICATION_READ_STATUS = gql`
  mutation UpdateNotificationReadStatus($notificationId: ID!, $refId: String!) {
    updateNotificationReadStatus(
      notificationId: $notificationId
      refId: $refId
    ) {
      id
      refId
      notifications {
        id
        date
        title
        text
        read
      }
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead($refId: String!) {
    markAllNotificationsRead(refId: $refId) {
      id
      refId
      notifications {
        id
        title
        read
        text
        date
      }
    }
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($refId: String!, $notificationId: String!) {
    markNotificationRead(refId: $refId, notificationId: $notificationId) {
      id
      refId
      notifications {
        id
        title
        text
        read
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
      refId
      notifications {
        id
        date
        title
        text
        read
      }
    }
  }
`;

export const CREATE_ONBOARDING_NOTIFICATION = gql`
  mutation CreateOnboardingNotification(
    $refId: String!
    $state: OnboardingState!
  ) {
    createOnboardingNotification(refId: $refId, state: $state) {
      id
      refId
      notifications {
        id
        date
        title
        text
        read
        __typename
      }
      __typename
    }
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($refId: String!, $notificationId: String!) {
    deleteNotification(refId: $refId, notificationId: $notificationId) {
      id
      refId
      notifications {
        id
        title
        read
        date
        text
      }
    }
  }
`;

export const DELETE_ONBOARDING_NOTIFICATIONS = gql`
  mutation DeleteOnboardingNotifications($refId: String!) {
    deleteOnboardingNotifications(refId: $refId) {
      refId
      notifications {
        id
        title
        text
        read
        date
      }
    }
  }
`;

export const DISCONNECT_STRIPE_ACCOUNT = gql`
  mutation DisconnectStripeAccount($affiliateId: String!) {
    disconnectStripeAccount(affiliateId: $affiliateId) {
      success
      deleted
    }
  }
`;

// utils/mutations.ts
// export const DISCONNECT_STRIPE_ACCOUNT = gql`
//   mutation DisconnectStripeAccount($affiliateId: String!) {
//     disconnectStripeAccount(affiliateId: $affiliateId) {
//       success
//       stripeId
//       reason
//     }
//   }
// `;

export const SEND_EMAIL = gql`
  mutation SendEmail($input: SendEmailInput!) {
    sendEmail(input: $input)
  }
`;

export const REFRESH_WOO_PRODUCTS = gql`
  mutation RefreshWooProducts($baseUrl: String!, $perPage: Int) {
    refreshWooProducts(baseUrl: $baseUrl, perPage: $perPage) {
      ok
      totalFetched
      created
      updated
      inactivated
      finishedAt
      notes
    }
  }
`;

export const REFUND_AFFILIATE_SALE = gql`
  mutation RefundAffiliateSale($input: RefundAffiliateSaleInput!) {
    refundAffiliateSale(input: $input) {
      sale {
        id
        commissionStatus
        # ✅ keep the snapshot fields you already use
        refundStatus
        refundAmount
        refundId
        refundAt
        # ✅ also return the aggregate + timestamp we added
        refundTotal
        refundedAt
      }
      stripeRefundId
      transferReversalId
    }
  }
`;
