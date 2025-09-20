import {
  FiCalendar,
  FiCamera,
  FiCreditCard,
  FiHash,
  FiMail,
  FiPercent,
  FiPhone,
  FiUser,
} from "react-icons/fi";
import { IoPersonCircleOutline } from "react-icons/io5";
import { SiStripe } from "react-icons/si";

export const fieldIcons = {
  avatar: IoPersonCircleOutline, // Profile picture
  name: FiUser, // Username / full name
  email: FiMail, // Email
  phone: FiPhone, // Phone
  refId: FiHash, // Reference ID
  commissionRate: FiPercent, // Commission rate
  stripeAccountId: SiStripe, // Stripe account (brand icon)
  affiliateSince: FiCalendar, // Affiliate since (createdAt)
  changePhoto: FiCamera, // Use on "Choose/Change photo" button
  creditCardAlt: FiCreditCard, // Alternative for payout/payment
} as const;
