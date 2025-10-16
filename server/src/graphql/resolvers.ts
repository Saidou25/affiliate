import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SECRET } from "../config/env";
import { isValidObjectId, Types } from "mongoose";
import { dateScalar } from "../dateScalar";
import { MyContext } from "../context";
import { sendConfirmationEmail } from "../utils/sendConfirmationEmail";
import { sendTrackASaleConfEmail } from "../utils/sendTrackASaleConfEmail";
import AffiliateSale from "../models/AffiliateSale";
import Affiliate from "../models/Affiliate";
import ClickLog from "../models/ClickLog";
import ReportHistory, { IReportHistory } from "../models/ReportHistory";
import Payment from "../models/Payment";
import { generateMonthlyPDFReportPDF } from "../cron/generateMonthlyReportPDF";
import {
  createStripeAccountAndOnboardingLink,
  getOnboardingLinkForExistingAccount,
} from "../utils/stripe";
import { checkStripeAccountStatus } from "../utils/checkStripeAccount";
import { title } from "process";
import Stripe from "stripe";
import GraphQLJSON from "graphql-type-json";
import { SendEmailArgs } from "./types";
import { sendEmailMessage } from "../utils/sendEmailMessage";
import { refreshWooProductsOnce } from "../services/wooStoreSync";
import AffiliateProduct from "../models/AffiliateProduct";
import {
  buildChargesSearchQuery,
  buildPISearchQuery,
  needsSearch,
  stripeFiltersToParams,
  toStripeListPage,
  toStripeSearchPage,
} from "../utils/stripeListFunctions";
import { GraphQLError } from "graphql";
import {
  handleDisconnect,
  recordState,
} from "../services/notifications/onboarding";
import { TITLES } from "../constants/onboarding";
import { notifyTransferInitiated } from "../services/notifications/payments";

if (!SECRET) {
  throw new Error("JWT SECRET is not defined in environment variables");
}

function requireAdmin(context: MyContext) {
  if (!context.affiliate) {
    console.warn("⚠️ Access denied: no affiliate in context");
    throw new Error("Admin privileges required");
  }

  if (context.affiliate.role !== "admin") {
    console.warn(`⚠️ Access denied: user role is '${context.affiliate.role}'`);
    throw new Error("Admin privileges required");
  }
}

type StripeLoginLinkPayload = { url: string };

// interface PaymentInput {
//   amount: number;
//   date: Date;
//   method: string;
//   transactionId?: string;
//   notes?: string;
// }

type PaymentInputArg = {
  saleAmount?: number; // new (SDL)
  amount?: number; // legacy (if some callers still send it)
  paidCommission?: number;
  productName?: string;
  date: string; // GraphQL Date comes as ISO string
  method: string;
  transactionId?: string;
  notes?: string;
};
// interface PaymentInputLegacy {
//   amount: number; // legacy name
//   date: Date | string;
//   method: string;
//   transactionId?: string;
//   notes?: string;
//   paidCommission?: number;
//   productName?: string;
//   saleAmount?: number; // allow new name too (from GraphQL)
// }
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const ONBOARDING_TITLES = [
  "Stripe account not connected",
  "Finish your Stripe onboarding",
  "Onboarding complete",
];

const TITLE_BY_STATE = {
  NOT_STARTED: "Stripe account not connected",
  IN_PROGRESS: "Finish your Stripe onboarding",
  COMPLETE: "Onboarding complete",
} as const;

const TEXT_BY_STATE = {
  NOT_STARTED:
    "You haven't connected a payment method yet. To receive your commissions, please link your Stripe account.",
  IN_PROGRESS:
    "Almost there! Please finish setting up your Stripe account to start receiving payouts.",
  COMPLETE:
    "Congratulations! Your Stripe account has been fully set up. You’re ready to receive payouts.",
} as const;

function toCents(amount: number) {
  return Math.max(0, Math.round(Number((amount ?? 0).toFixed(2)) * 100));
}

function round2(n: number) {
  return Number((Number(n) || 0).toFixed(2));
}

const resolvers = {
  Date: dateScalar,
  JSON: GraphQLJSON,

  Query: {
    getAffiliates: async () => {
      return Affiliate.find();
    },
    // getAffiliates: async (_: any, __: any, context: MyContext) => {
    //   requireAdmin(context);
    //   return Affiliate.find();
    // },

    getAffiliateByRefId: async (_: any, { refId }: { refId: string }) => {
      return await Affiliate.findOne({ refId });
    },

    getAffiliate: async (_: any, { id }: { id: string }) => {
      return await Affiliate.findOne({ _id: id });
    },

    me: async (_parent: any, _: any, context: MyContext) => {
      if (!context.affiliate) {
        throw new Error("Not authenticated");
      }

      return Affiliate.findOne({ _id: context.affiliate.id }); // This populates full product info
    },

    getAllAffiliateSales: async () => {
      return await AffiliateSale.find();
    },

    // getAffiliateSales: async (_: any, { refId }: { refId: string }) => {
    //   return await AffiliateSale.find({ refId }); // likely multiple sales per affiliate
    // },
    getAffiliateSales: async (
      _: any,
      { filter, limit = 50, offset = 0 }: any
    ) => {
      const q: any = {};
      if (filter?.refId) q.refId = filter.refId;
      if (filter?.source) q.source = filter.source;
      if (filter?.orderId) q.orderId = filter.orderId;
      if (filter?.status) q.status = filter.status;
      if (filter?.from || filter?.to) {
        q.orderDate = {};
        if (filter.from) q.orderDate.$gte = new Date(filter.from);
        if (filter.to) q.orderDate.$lte = new Date(filter.to);
      }
      return AffiliateSale.find(q)
        .sort({ orderDate: -1, createdAt: -1 })
        .skip(offset)
        .limit(Math.min(limit, 200));
    },
    getAffiliateClickLogs: async (_: any, { refId }: { refId: string }) => {
      return await ClickLog.find({ refId }); // likely multiple sales per affiliate
    },

    getAllAffiliatesClickLogs: async (_: any, __: any, context: MyContext) => {
      requireAdmin(context);
      return ClickLog.find(); // likely multiple sales per affiliate
    },

    getAllReports: async () => {
      const reports = await ReportHistory.find({})
        .sort({ createdAt: -1 })
        .lean();

      return reports.map((r) => ({
        id: r._id.toString(),
        month: r.month,
        html: r.html ?? null,
        pdf: r.pdf ? r.pdf.toString("base64") : null,
        createdAt: r.createdAt?.toISOString() ?? null,
      }));
    },

    getReportByMonth: async (_: any, { month }: { month: string }) => {
      const report = await ReportHistory.findOne({ month }).lean();
      if (!report) return null;

      return {
        id: report._id.toString(),
        month: report.month,
        html: report.html ?? null,
        pdf: report.pdf ? report.pdf.toString("base64") : null,
        createdAt: report.createdAt?.toISOString() ?? null,
      };
    },

    getAffiliatePaymentHistory: async (
      _: any,
      { refId }: { refId: string }
    ) => {
      const affiliate = await Affiliate.findOne({ refId });
      if (!affiliate) throw new Error("Affiliate not found");
      return affiliate.paymentHistory;
    },

    getAllAffiliatePayments: async (_: any, __: any, context: MyContext) => {
      requireAdmin(context);
      return Affiliate.find({ "paymentHistory.0": { $exists: true } });
    },

    getAllPayments: async () => {
      // requireAdmin(context); // Optional: only allow admin to see all payments
      return Payment.find().sort({ date: -1 }); // Sort by most recent first
    },

    checkStripeStatus: async (
      _: any,
      { affiliateId }: { affiliateId: string }
    ) => {
      const affiliate = await Affiliate.findById(affiliateId);
      if (!affiliate || !affiliate.stripeAccountId) {
        throw new Error("Affiliate or Stripe account not found.");
      }

      const result = await checkStripeAccountStatus(affiliate.stripeAccountId);
      if (!result.success) {
        throw new Error(
          result.message || "Unable to fetch Stripe account status."
        );
      }

      const state: "in_progress" | "complete" = result.payouts_enabled
        ? "complete"
        : "in_progress";

      // ✅ Only seed if we don’t already have the target-state notice
      const hasTarget = await Affiliate.exists({
        _id: affiliate._id,
        "notifications.title": TITLES[state],
      });
      if (!hasTarget) {
        await recordState(affiliate.refId, state);
      }

      // (unchanged) latest transfer lookup...
      let lastTransfer: {
        id: string;
        amount: number;
        currency: string;
        createdAt: Date;
        reversed: boolean;
      } | null = null;

      try {
        const list = await stripe.transfers.list({
          destination: affiliate.stripeAccountId,
          limit: 1,
        });
        const t = list.data[0];
        if (t) {
          lastTransfer = {
            id: t.id,
            amount: t.amount / 100,
            currency: t.currency,
            createdAt: new Date(t.created * 1000),
            reversed: Boolean(t.reversed),
          };
        }
      } catch (e) {
        console.warn(
          "[checkStripeStatus] transfers.list failed:",
          (e as Error)?.message || e
        );
      }

      return {
        id: result.id,
        charges_enabled: result.charges_enabled,
        payouts_enabled: result.payouts_enabled,
        details_submitted: result.details_submitted,
        lastTransferId: lastTransfer?.id ?? null,
        lastTransferAmount: lastTransfer?.amount ?? null,
        lastTransferCurrency: lastTransfer?.currency ?? null,
        lastTransferCreatedAt: lastTransfer?.createdAt ?? null,
        lastTransferReversed: lastTransfer?.reversed ?? null,
      };
    },

    // checkStripeStatus: async (
    //   _: any,
    //   { affiliateId }: { affiliateId: string }
    // ) => {
    //   const affiliate = await Affiliate.findById(affiliateId);
    //   if (!affiliate || !affiliate.stripeAccountId) {
    //     throw new Error("Affiliate or Stripe account not found.");
    //   }

    //   const result = await checkStripeAccountStatus(affiliate.stripeAccountId);
    //   if (!result.success) {
    //     throw new Error(
    //       result.message || "Unable to fetch Stripe account status."
    //     );
    //   }

    //   const state: "in_progress" | "complete" = result.payouts_enabled
    //     ? "complete"
    //     : "in_progress";

    //   //  Seed the notification idempotently (and normalize on complete if your recordState implements that)
    //   await recordState(affiliate.refId, state);

    //   // 2) Looks up the most recent transfer to this connected account
    //   // (Platform-side: transfers are created against the platform; we filter by destination)
    //   let lastTransfer: {
    //     id: string;
    //     amount: number;
    //     currency: string;
    //     createdAt: Date;
    //     reversed: boolean;
    //   } | null = null;

    //   try {
    //     const list = await stripe.transfers.list({
    //       destination: affiliate.stripeAccountId, // acct_...
    //       limit: 1,
    //     });

    //     const t = list.data[0];
    //     if (t) {
    //       lastTransfer = {
    //         id: t.id,
    //         amount: t.amount / 100,
    //         currency: t.currency,
    //         createdAt: new Date(t.created * 1000),
    //         reversed: Boolean(t.reversed),
    //       };
    //     }
    //   } catch (e) {
    //     // Don’t fail the whole status call on transfer lookup issues
    //     console.warn(
    //       "[checkStripeStatus] transfers.list failed:",
    //       (e as Error)?.message || e
    //     );
    //   }
    //   // Return a consistent shape regardless of success
    //   return {
    //     id: result.id,
    //     charges_enabled: result.charges_enabled,
    //     payouts_enabled: result.payouts_enabled,
    //     details_submitted: result.details_submitted,
    //     lastTransferId: lastTransfer?.id ?? null,
    //     lastTransferAmount: lastTransfer?.amount ?? null,
    //     lastTransferCurrency: lastTransfer?.currency ?? null,
    //     lastTransferCreatedAt: lastTransfer?.createdAt ?? null,
    //     lastTransferReversed: lastTransfer?.reversed ?? null,
    //   };
    // },

    affiliateProducts: async (
      _: any,
      { active }: { active?: boolean },
      context: MyContext
    ) => {
      const filter: any = {};
      if (active !== undefined) filter.active = active;
      return AffiliateProduct.find(filter).sort({ name: 1 }).lean();
    },

    // Payment Intents
    stripePaymentIntents: async (
      _: any,
      { after, limit = 25, filter }: any
    ) => {
      if (needsSearch(filter)) {
        const query = buildPISearchQuery(filter);
        const res = await stripe.paymentIntents.search({
          query,
          limit,
          page: after || undefined, // search uses `page`
          expand: ["data.latest_charge"],
        });
        return toStripeSearchPage(res);
      }
      const list = await stripe.paymentIntents.list({
        limit,
        starting_after: after || undefined, // list uses `starting_after`
        ...stripeFiltersToParams(filter), // created range only
        expand: ["data.latest_charge"],
      });
      return toStripeListPage(list);
    },

    // Charges
    stripeCharges: async (_: any, { after, limit = 25, filter }: any) => {
      if (needsSearch(filter)) {
        const query = buildChargesSearchQuery(filter);
        const res = await stripe.charges.search({
          query,
          limit,
          page: after || undefined,
          expand: ["data.balance_transaction"],
        });
        return toStripeSearchPage(res);
      }
      const list = await stripe.charges.list({
        limit,
        starting_after: after || undefined,
        ...stripeFiltersToParams(filter),
        expand: ["data.balance_transaction"],
      });
      return toStripeListPage(list);
    },

    // Refunds

    stripeRefunds: async (_: any, { after, limit = 25, filter }: any) => {
      // If user asks for refId/email/status, emulate search via charges.search
      if (needsSearch(filter)) {
        const query = buildChargesSearchQuery(filter); // builds metadata/email/status/created terms
        // 1) Search charges (this returns ApiSearchResult with .next_page)
        const chRes = await stripe.charges.search({
          query,
          limit, // limit of charges page, not refunds count
          page: after || undefined,
        });

        // 2) Fan-out to refunds for each charge (parallel, but keep it bounded)
        const refundsArrays = await Promise.all(
          chRes.data.map(
            (ch) => stripe.refunds.list({ charge: ch.id, limit: 100 }) // pull all for that charge (adjust if needed)
          )
        );

        // 3) Flatten + filter locally for refund-specific fields
        const createdFrom = filter?.createdFrom
          ? Number(filter.createdFrom)
          : undefined;
        const createdTo = filter?.createdTo
          ? Number(filter.createdTo)
          : undefined;
        const wantedStatus = filter?.status as
          | ("pending" | "succeeded" | "failed")
          | undefined;

        const allRefunds = refundsArrays
          .flatMap((r) => r.data)
          .filter((re) => {
            if (wantedStatus && re.status !== wantedStatus) return false;
            if (createdFrom && re.created < createdFrom) return false;
            if (createdTo && re.created > createdTo) return false;
            // Optional: if you only stored refId on the charge (not refund), keep them all;
            // or filter by re.metadata?.refId if you set it at refund creation time.
            return true;
          });

        // 4) Return a "search-style" page keyed by the charges search cursor
        return {
          hasMore: chRes.has_more,
          nextCursor: chRes.next_page ?? null, // client passes this back as `after`
          data: allRefunds as any[],
        };
      }

      // Fast path: simple list (created range supported)
      const list = await stripe.refunds.list({
        limit,
        starting_after: after || undefined,
        ...stripeFiltersToParams(filter), // supports createdFrom/createdTo only
      });
      return toStripeListPage(list);
    },

    // Transfers (no search API)
    stripeTransfers: async (_: any, { after, limit = 25, filter }: any) => {
      const list = await stripe.transfers.list({
        limit,
        starting_after: after || undefined,
        ...stripeFiltersToParams(filter), // created only
      });
      return toStripeListPage(list);
    },

    // Balance Transactions (no search API)
    stripeBalanceTxns: async (_: any, { after, limit = 25 }: any) => {
      const list = await stripe.balanceTransactions.list({
        limit,
        starting_after: after || undefined,
      });
      return toStripeListPage(list);
    },
  },

  Mutation: {
    login: async (
      _: unknown,
      { email, password }: { email: string; password: string }
    ) => {
      console.log("🔐 Login attempt:", email);
      const affiliate = await Affiliate.findOne({
        email: email.toLowerCase().trim(),
      });
      if (!affiliate) {
        console.warn("❌ No affiliate found for email:", email);
        throw new Error("Affiliate not found");
      }

      const valid = await bcrypt.compare(password, affiliate.password);

      console.log("🔍 Password valid?", valid);
      if (!valid) {
        console.warn("❌ Invalid password for email:", email);
        throw new Error("Invalid credentials");
      }

      const token = jwt.sign(
        { affiliateId: affiliate.id, role: affiliate.role },
        SECRET,
        {
          expiresIn: "3h",
        }
      );
      return { token, affiliate };
    },

    registerAffiliate: async (
      _: unknown,
      {
        email,
        password,
        refId,
        createdAt,
      }: {
        email: string;
        password: string;
        refId: string;
        createdAt: Date;
      }
    ) => {
      const affiliate = new Affiliate({
        email,
        password,
        refId,
        createdAt,
        notifications: [
          {
            title: "Welcome to the Princeton Green's Affiliate Program!",
            text: "Your affiliate account has been successfully created.",
            date: new Date(),
            read: false,
          },
        ],
      });
      await affiliate.save();

      const token = jwt.sign({ affiliateId: affiliate.id }, SECRET, {
        expiresIn: "3h",
      });

      return { token, affiliate };
    },

    deleteAffiliate: async (_: any, { id }: { id: string }) => {
      try {
        return await Affiliate.findOneAndDelete({ _id: id });
      } catch (error) {
        throw new Error("Failed to delete affiliate");
      }
    },

    updateAffiliate: async (
      _: any,
      {
        id,
        name,
        email,
        refId,
        totalClicks,
        totalCommissions,
        commissionRate,
        totalSales,
        updatedAt,
        createdAt,
        avatar,
      }: {
        id: string;
        name?: string;
        email?: string;
        refId?: string;
        totalClicks?: number;
        totalCommissions?: number;
        commissionRate?: number;
        totalSales?: number;
        updatedAt: Date;
        avatar?: string;
        createdAt: Date; // just to add to already created affiliates
      }
    ) => {
      try {
        return await Affiliate.findOneAndUpdate(
          { _id: id },
          {
            ...(name && { name }), // Only update name if name is being passed as argument
            ...(email && { email }),
            ...(refId && { refId }),
            ...(totalClicks !== undefined && { totalClicks }),
            ...(totalCommissions !== undefined && { totalCommissions }),
            ...(commissionRate !== undefined && { commissionRate }),
            ...(totalSales !== undefined && { totalSales }),
            ...(updatedAt !== undefined && { updatedAt }),
            ...(createdAt !== undefined && { createdAt }),
            ...(avatar !== undefined && { avatar }),
          },
          { new: true }
        );
      } catch (error) {
        throw new Error("Failed to update affiliate");
      }
    },

    trackAffiliateSale: async (
      _: unknown,
      {
        productId,
        refId,
        buyerEmail,
        amount,
        title,
        event,
        timestamp,
      }: {
        productId: string;
        refId: string;
        buyerEmail: string;
        amount: number;
        title: string;
        event: string;
        timestamp?: Date;
      }
    ) => {
      try {
        // 🔍 1. Find the affiliate by refId
        const affiliate = await Affiliate.findOne({ refId });
        if (!affiliate) throw new Error("Affiliate not found");

        // 💰 2. Calculate the commission (default 10% if none set)
        const commissionRate = affiliate.commissionRate ?? 0.1;
        const commission = amount * commissionRate;

        // 📝 3. Save the sale
        const sale = new AffiliateSale({
          productId,
          refId,
          buyerEmail,
          amount,
          event,
          title,
          timestamp: timestamp || new Date(),
          commissionEarned: parseFloat(commission.toFixed(2)), // ✅ ensure it's a number
          commissionStatus: "unpaid", // ✅ explicitly set default
        });
        await sale.save();

        // 📧 4. Send confirmation emails
        await sendConfirmationEmail({
          buyerEmail,
          event: title,
          amount,
          commission,
        });
        await sendTrackASaleConfEmail({
          buyerEmail,
          affiliateEmail: affiliate.email,
          event: title,
          amount,
          commission,
        });

        // 📈 5. Update affiliate’s stats
        affiliate.totalSales = (affiliate.totalSales || 0) + amount;
        affiliate.totalCommissions =
          (affiliate.totalCommissions || 0) + commission;
        await affiliate.save();

        return sale;
      } catch (error) {
        console.error("❌ Error tracking affiliate sale:", error);
        throw new Error("Failed to track affiliate sale");
      }
    },

    updateAffiliateSale: async (
      _: unknown,
      {
        id,
        productId,
        refId,
        buyerEmail,
        amount,
        event,
        timestamp,
        commissionStatus,
        commissionEarned,
      }: {
        id: string;
        productId?: string;
        refId?: string;
        buyerEmail?: string;
        amount?: number;
        event?: string;
        timestamp?: Date | string;
        commissionStatus?: string;
        commissionEarned?: number;
      }
    ) => {
      try {
        // Build update object with only provided fields
        const updateData: any = {};
        if (productId !== undefined) updateData.productId = productId;
        if (refId !== undefined) updateData.refId = refId;
        if (buyerEmail !== undefined) updateData.buyerEmail = buyerEmail;
        if (amount !== undefined) updateData.amount = amount;
        if (event !== undefined) updateData.event = event;
        if (timestamp !== undefined) updateData.timestamp = new Date(timestamp);
        if (commissionStatus !== undefined)
          updateData.commissionStatus = commissionStatus;
        if (commissionEarned !== undefined)
          updateData.commissionEarned = commissionEarned;

        const updatedSale = await AffiliateSale.findOneAndUpdate(
          { _id: id },
          updateData,
          { new: true }
        );

        if (!updatedSale) throw new Error("Sale not found");

        // Optionally send emails or update stats here if you want
        // await sendConfirmationEmail({ ... });
        // await updateAffiliateStats(updatedSale);

        return updatedSale;
      } catch (error: any) {
        console.error("Failed to update affiliate sale:", error);
        throw new Error("Failed to update affiliate sale");
      }
    },

    clickLog: async (
      _: unknown,
      { refId }: { refId: string },
      { req }: { req: import("express").Request }
    ) => {
      try {
        if (!refId) throw new Error("refId is required");
        console.log("✅ clickLog called with:", refId);

        const updatedAffiliate = await Affiliate.findOneAndUpdate(
          { refId },
          { $inc: { totalClicks: 1 } },
          { new: true }
        );
        if (!updatedAffiliate) throw new Error("Affiliate not found");

        const ip =
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.socket.remoteAddress ||
          "";
        const ua = req.get("user-agent") || "";
        const referer = req.get("referer") || "";

        const newClick = await ClickLog.create({
          refId,
          ipAddress: ip,
          userAgent: ua,
          pageUrl: referer,
        });

        console.log("✅ newClick saved:", newClick.id);
        return newClick;
      } catch (err) {
        console.error("Error logging click:", (err as Error).message);
        throw new Error("Failed to log click");
      }
    },

    saveHtmlReport: async (
      _: unknown,
      { html, month }: { html: string; month: string }
    ) => {
      const existing: IReportHistory | null = await ReportHistory.findOne({
        month,
      });
      if (existing) {
        throw new Error(`Report for month "${month}" already exists.`);
      }

      // Generate the PDF
      const pdfBuffer = await generateMonthlyPDFReportPDF(html, month);

      // Create the report document (including pdf now)
      const newReport = await ReportHistory.create({
        month,
        html,
        pdf: pdfBuffer,
      });

      return {
        id: (newReport._id as Types.ObjectId).toString(),
        month: newReport.month,
        html: newReport.html ?? null,
        pdf: pdfBuffer.toString("base64"),
        createdAt: newReport.createdAt?.toISOString() ?? null,
      };
    },

    // markSaleAsPaid: async (_: unknown, { saleId }: { saleId: string }) => {
    //   console.log("💥 Received saleId on backend:", saleId);
    //   const sale = await AffiliateSale.findById(saleId);
    //   if (!sale) throw new Error("Sale not found");

    //   sale.commissionStatus = "paid";
    //   await sale.save();

    //   return sale;
    // },

    createStripeExpressDashboardLink: async (
      _parent: unknown,
      { refId }: { refId: string },
      context: MyContext
    ): Promise<StripeLoginLinkPayload> => {
      // 1) Basic auth/ownership check
      if (!context?.affiliate || context.affiliate.refId !== refId) {
        throw new Error("Forbidden");
      }

      // 2) Look up connected account
      const affiliate = await Affiliate.findOne({ refId });
      if (!affiliate?.stripeAccountId) {
        throw new GraphQLError("Stripe account not connected", {
          extensions: {
            code: "STRIPE_NOT_CONNECTED",
            http: { status: 400 }, // optional, helps in logs
          },
        });
      }

      // 3) Create short-lived Express Dashboard login link
      const linkResp = await stripe.accounts.createLoginLink(
        affiliate.stripeAccountId
      );

      // 4) Return the URL as per your SDL
      return { url: linkResp.url };
    },

    createAffiliateStripeAccount: async (
      _: any,
      { affiliateId }: { affiliateId: string }
    ) => {
      const affiliate = await Affiliate.findById(affiliateId);
      if (!affiliate) throw new Error("Affiliate not found");

      let resumed = false;

      // ⚠️ Resume onboarding if account exists but is incomplete
      if (affiliate.stripeAccountId) {
        try {
          const result = await checkStripeAccountStatus(
            affiliate.stripeAccountId
          );
          if (result.success && !result.details_submitted) {
            resumed = true;
            const resumeLink = await getOnboardingLinkForExistingAccount(
              affiliate.stripeAccountId
            );
            console.log("♻️ Resuming onboarding:", {
              url: resumeLink,
              resumed: true,
            });
            return {
              url: resumeLink,
              resumed,
            };
          }
        } catch (err) {
          console.warn(
            "⚠️ Could not retrieve existing Stripe account. Will create a new one."
          );
        }
      }

      // ✅ Create new account and onboarding link
      const { onboardingUrl, stripeAccountId } =
        await createStripeAccountAndOnboardingLink(affiliateId);

      affiliate.stripeAccountId = stripeAccountId;
      await affiliate.save();
      console.log("✅ Final return to GraphQL:", {
        url: onboardingUrl,
        resumed,
      });

      return {
        url: onboardingUrl,
        resumed,
      };
    },

    disconnectStripeAccount: async (
      _: unknown,
      { affiliateId }: { affiliateId: string }
    ): Promise<{ success: boolean; stripeId?: string; reason?: string }> => {
      const affiliate = await Affiliate.findById(affiliateId);

      if (!affiliate) {
        return { success: false, reason: "affiliate-not-found" };
      }
      if (!affiliate.stripeAccountId) {
        return { success: false, reason: "no-linked-stripe-account" };
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY!;
      const stripe = new Stripe(stripeKey);
      const stripeId = affiliate.stripeAccountId;

      // Check account type (standard cannot be deleted by platform)
      try {
        const acct = await stripe.accounts.retrieve(stripeId);
        console.log(
          "[disconnectStripeAccount] retrieved acct.type=",
          acct.type
        );

        if (acct.type === "standard") {
          return {
            success: false,
            stripeId,
            reason: "standard-account", // deauthorize via OAuth, not deletable
          };
        }
      } catch (e: any) {
        console.error(
          "[disconnectStripeAccount] retrieve failed:",
          e?.message || e
        );
        // surface a reason so the client can show a helpful message
        return { success: false, stripeId, reason: "retrieve-failed" };
      }

      // Try to delete
      try {
        const deleted = await stripe.accounts.del(stripeId);
        console.log("[disconnectStripeAccount] delete result:", deleted);

        await handleDisconnect(affiliate.refId);

        if (deleted?.deleted === true) {
          await Affiliate.updateOne(
            { _id: affiliateId, stripeAccountId: stripeId },
            { $unset: { stripeAccountId: "" } }
          );
          return { success: true, stripeId };
        }

        console.warn(
          "[disconnectStripeAccount] Stripe did not confirm deletion"
        );
        return {
          success: false,
          stripeId,
          reason: "stripe-did-not-confirm-deletion",
        };
      } catch (e: any) {
        console.error(
          "[disconnectStripeAccount] delete failed:",
          e?.message || e
        );
        return { success: false, stripeId, reason: "delete-failed" };
      }
    },

    createNotification: async (
      _: unknown,
      { refId, title, text }: { refId: string; title: string; text: string }
    ) => {
      const normTitle =
        typeof title === "string"
          ? title.trim().replace(/^"+|"+$/g, "")
          : title;
      //  only push if a notification with the same title doesn't exist
      await Affiliate.updateOne(
        {
          refId,
          notifications: { $not: { $elemMatch: { title: normTitle } } }, // only insert if no match
        },
        {
          $push: {
            notifications: {
              _id: new Types.ObjectId(),
              title: normTitle,
              text,
              read: false,
              date: new Date(),
            },
          },
        },
        { runValidators: true }
      );

      // Return the updated affiliate with notifications
      return Affiliate.findOne({ refId });
    },

    createOnboardingNotification: async (
      _: unknown,
      { refId, state }: { refId: string; state: keyof typeof TITLE_BY_STATE }
    ) => {
      const rawTitle = TITLE_BY_STATE[state];
      const normTitle =
        typeof rawTitle === "string"
          ? rawTitle.trim().replace(/^"+|"+$/g, "")
          : rawTitle;

      // Dedupe rule: skip insert if a notification with the SAME TITLE already exists (read or unread)
      await Affiliate.updateOne(
        {
          refId,
          notifications: { $not: { $elemMatch: { title: normTitle } } }, // <-- use normalized title
        },
        {
          $push: {
            notifications: {
              _id: new Types.ObjectId(),
              title: normTitle,
              text: TEXT_BY_STATE[state],
              read: false,
              date: new Date(),
            },
          },
        },
        { runValidators: true }
      );

      // Return updated affiliate (used by client to refresh cache)
      return Affiliate.findOne({ refId });
    },

    deleteOnboardingNotifications: async (
      _: unknown,
      { refId }: { refId: string }
    ) => {
      // 1) remove prior onboarding notifications
      await Affiliate.updateOne(
        { refId },
        { $pull: { notifications: { title: { $in: ONBOARDING_TITLES } } } }
      );

      // 2) seed fresh "not connected" (guard to avoid dup if racing)
      await Affiliate.updateOne(
        {
          refId,
          "notifications.title": { $ne: "Stripe account not connected" },
        },
        {
          $push: {
            notifications: {
              _id: new Types.ObjectId(),
              title: "Stripe account not connected",
              text: "You haven't connected a payment method yet. To receive your commissions, please link your Stripe account.",
              read: false,
              date: new Date(),
            },
          },
        }
      );

      return Affiliate.findOne({ refId });
    },

    markNotificationRead: async (
      _: unknown,
      { refId, notificationId }: { refId: string; notificationId: string }
    ) => {
      // 1) Primary: match by client-facing id
      let updated = await Affiliate.findOneAndUpdate(
        { refId, "notifications.id": notificationId },
        { $set: { "notifications.$.read": true } },
        { new: true }
      );

      // 2) Fallback: if the string is a valid ObjectId, try _id
      if (!updated && Types.ObjectId.isValid(notificationId)) {
        updated = await Affiliate.findOneAndUpdate(
          { refId, "notifications._id": new Types.ObjectId(notificationId) },
          { $set: { "notifications.$.read": true } },
          { new: true }
        );
      }

      if (!updated) throw new Error("Affiliate or notification not found");
      return updated; // Affiliate!
    },

    deleteNotification: async (
      _: unknown,
      { refId, notificationId }: { refId: string; notificationId: string }
    ) => {
      if (!isValidObjectId(notificationId)) {
        throw new Error("Invalid notificationId");
      }

      console.log(
        "🗑️ Deleting notification for:",
        refId,
        "notification id:",
        notificationId
      );

      await Affiliate.updateOne(
        { refId },
        {
          $pull: { notifications: { _id: new Types.ObjectId(notificationId) } },
        }
      );

      // Re-fetch to return the updated doc
      return Affiliate.findOne({ refId });
    },

    // Marks a single notification (by _id) as read
    markAllNotificationsRead: async (
      _: unknown,
      { refId }: { refId: string }
    ) => {
      const updated = await Affiliate.findOneAndUpdate(
        { refId },
        { $set: { "notifications.$[].read": true } },
        { new: true, runValidators: true }
      );

      if (!updated) throw new Error("There was an error");
      return updated;
    },

    // updateNotificationReadStatus: async (
    //   _: unknown,
    //   { refId, notificationId }: { refId: string; notificationId: string }
    // ) => {
    //   const updated = await Affiliate.findOneAndUpdate(
    //     { refId, "notifications._id": new Types.ObjectId(notificationId) },
    //     { $set: { "notifications.$.read": false } },
    //     { new: true }
    //   );
    //   if (!updated) throw new Error("Affiliate or notification not found");
    //   return updated;
    // },
    updateNotificationReadStatus: async (
      _: unknown,
      { refId, notificationId }: { refId: string; notificationId: string }
    ) => {
      // Safely construct ObjectId (in case a bad id sneaks in)
      let _id: Types.ObjectId;
      try {
        _id = new Types.ObjectId(notificationId);
      } catch {
        // If the id is invalid, just return the current doc (don’t throw)
        const fallback = await Affiliate.findOne({ refId });
        if (!fallback) throw new Error("Affiliate not found");
        return fallback;
      }

      // Try to flip the specific notification to read:false
      const updated = await Affiliate.findOneAndUpdate(
        { refId, "notifications._id": _id },
        { $set: { "notifications.$.read": false } }, // keep your current intent
        { new: true }
      );

      if (updated) return updated;

      // If not found (likely removed by another mutation), just return latest Affiliate
      const fallback = await Affiliate.findOne({ refId });
      if (!fallback) throw new Error("Affiliate not found");
      return fallback;
    },

    sendEmail: async (
      _: any,
      { input }: { input: SendEmailArgs }
    ): Promise<string> => {
      console.log("SMTP user:", process.env.EMAIL_USER);
      console.log("SMTP pass length:", process.env.EMAIL_PASS?.length); // Don't print full password!

      await sendEmailMessage({
        ...input,
        type: "generic", // or "sale", "confirmation"
      });
      return "Email sent successfully.";
    },

    refreshWooProducts: async (_p: any, args: any, context: MyContext) => {
      const isAdmin = context.affiliate?.role === "admin";
      // const isServer = context.req.headers['x-api-key'] === process.env.WOO_SYNC_KEY; // optional

      if (!isAdmin) {
        throw new Error("Unauthorized (resolver)");
      }

      const { baseUrl, perPage } = args;
      return await refreshWooProductsOnce({ baseUrl, perPage, notes: [] });
    },

    createAffiliateTransfer: async (
      _: unknown,
      {
        refId,
        amount,
        currency = "usd",
        productName,
        saleIds = [],
        notes,
      }: {
        refId: string;
        amount: number; // dollars
        currency?: string;
        productName?: string;
        saleIds?: string[];
        notes?: string;
      },
      context: MyContext
    ) => {
      // Optional: restrict to admins
      // requireAdmin(context);

      console.log("[TRANSFER] called with", {
        refId,
        amount,
        currency,
        productName,
        saleIdsCount: saleIds?.length || 0,
      });

      if (!(amount > 0)) {
        console.warn("[TRANSFER] abort: amount must be > 0");
        throw new Error("Amount must be > 0");
      }

      // 1) Find affiliate & check Stripe account
      const affiliate = await Affiliate.findOne({ refId });
      if (!affiliate) {
        console.warn("[TRANSFER] abort: affiliate not found", { refId });
        throw new Error("Affiliate not found.");
      }
      if (!affiliate.stripeAccountId) {
        console.warn("[TRANSFER] abort: no stripeAccountId", { refId });
        throw new Error("Affiliate is not connected to Stripe.");
      }

      // Optional: block overpay against unpaid balance pool
      const unpaid = Number(affiliate.totalCommissions ?? 0);
      if (amount > unpaid) {
        console.warn("[TRANSFER] abort: amount exceeds unpaid pool", {
          amount,
          unpaid,
        });
        throw new Error("Payment exceeds unpaid commissions.");
      }

      // 2) Create Stripe transfer (platform -> connected account)
      const cents = Math.round(amount * 100);
      const idemKey = `xfer:${refId}:${cents}:${
        (saleIds || []).slice().sort().join(",") || "none"
      }`;

      console.log("[TRANSFER] creating Stripe transfer", {
        destination: affiliate.stripeAccountId,
        cents,
        idemKey,
      });

      let transfer;
      try {
        transfer = await stripe.transfers.create(
          {
            amount: cents,
            currency,
            destination: affiliate.stripeAccountId!, // acct_xxx
            description: productName || `Affiliate payout for ${refId}`,
            metadata: {
              refId,
              productName: productName ?? "",
              saleIds: (saleIds || []).join(","),
              type: "affiliate_payout",
            },
          },
          { idempotencyKey: idemKey }
        );
      } catch (err: any) {
        console.error(
          "[TRANSFER] Stripe transfer failed:",
          err?.message || err
        );
        throw new Error(err?.message || "Stripe transfer failed");
      }

      console.log("[TRANSFER] stripe transfer created:", transfer.id);

      // 3) Persist Payment document (so it shows up in getAllPayments)
      const paidAtISO = new Date(transfer.created * 1000).toISOString();
      const payment = await Payment.create({
        refId,
        affiliateId: affiliate._id,
        saleIds: (saleIds || []).map((id) => new Types.ObjectId(id)),
        saleAmount: Number(amount.toFixed(2)),
        paidCommission: Number(amount.toFixed(2)),
        productName: productName ?? "Stripe transfer",
        date: new Date(paidAtISO),
        method: "stripe_transfer",
        transactionId: transfer.id, // tr_...
        notes: notes ?? transfer.description ?? null,
        status: "processing", // helpful for the UI
        currency,
        transferId: transfer.id, // store explicitly if your Payment model has it
      });

      await notifyTransferInitiated({
        refId,
        amount,
        currency,
        transferId: transfer.id,
        productName,
      });

      // 4) If you passed saleIds, mark their commissionStatus -> processing
      if (saleIds.length) {
        await AffiliateSale.updateMany(
          { _id: { $in: payment.saleIds }, commissionStatus: { $ne: "paid" } },
          {
            $set: {
              commissionStatus: "processing",
              paymentId: payment._id,
              transferId: transfer.id,
              stripeAccountId: affiliate.stripeAccountId,
              processingAt: new Date(),
            },
          }
        );
      }

      await affiliate.save();

      // 5) Return the saved Payment fields the UI needs (matches SDL)
      return {
        id: payment.id.toString(),
        refId,
        affiliateId: affiliate.id.toString(),
        saleIds: payment.saleIds?.map(String) ?? [],
        saleAmount: payment.saleAmount,
        paidCommission: payment.paidCommission,
        date: payment.date ?? paidAtISO,
        productName: payment.productName,
        method: payment.method,
        transactionId: payment.transactionId,
        notes: payment.notes,
        createdAt:
          payment.createdAt?.toISOString?.() ?? new Date().toISOString(),
        status: payment.status, // now present
        transferId: transfer.id, // helpful to surface in UI
        currency,
      };
    },

    recordAffiliatePayment: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          refId: string;
          saleIds: string[];
          saleAmount?: number; // optional: we prefer per-sale when present
          method: string; // provided by client, but we'll store "stripe_transfer" in Payment
          transactionId?: string; // ignored here; overwritten by Stripe transfer id
          notes?: string;
        };
      }
    ) => {
      // 1) Find affiliate & sales
      const affiliate = await Affiliate.findOne({ refId: input.refId });
      if (!affiliate) throw new Error("Affiliate not found.");
      if (!affiliate.stripeAccountId)
        throw new Error("Affiliate is not connected to Stripe.");

      // ensure unique saleIds
      const uniqueSaleIds = Array.from(new Set(input.saleIds)).map(
        (id) => new Types.ObjectId(id)
      );

      const sales = await AffiliateSale.find({ _id: { $in: uniqueSaleIds } });
      if (!sales.length) throw new Error("No valid sales found for payout.");

      // guard against double pay
      const alreadyPaid = sales.find((s) => s.commissionStatus === "paid");
      if (alreadyPaid) throw new Error("One or more sales are already paid.");

      // 2) Compute commission safely
      const rate =
        typeof affiliate.commissionRate === "number" &&
        affiliate.commissionRate > 0
          ? affiliate.commissionRate
          : 0.1;

      // sum of defined per-sale commissions
      const sumDefinedPerSale = round2(
        sales.reduce(
          (sum, s) =>
            sum +
            (typeof (s as any).commissionEarned === "number"
              ? (s as any).commissionEarned
              : 0),
          0
        )
      );

      // optional: compute from per-sale totals if available (rename s.total to your field)
      const sumFromPerSaleTotals = round2(
        sales.reduce((sum, s: any) => {
          const perSaleTotal = typeof s.total === "number" ? s.total : 0; // <-- if you use s.amount or s.orderTotal, change here
          return sum + perSaleTotal * rate;
        }, 0)
      );

      // last resort: provided input.saleAmount
      const fromInputTotal = round2((input.saleAmount ?? 0) * rate);

      let commission = 0;
      if (sumDefinedPerSale > 0) {
        commission = sumDefinedPerSale;
      } else if (sumFromPerSaleTotals > 0) {
        commission = sumFromPerSaleTotals;
      } else if (fromInputTotal > 0) {
        commission = fromInputTotal;
      } else {
        throw new Error(
          `Computed commission must be > 0. Details: sumDefinedPerSale=${sumDefinedPerSale}, sumFromPerSaleTotals=${sumFromPerSaleTotals}, fromInputTotal=${fromInputTotal}, rate=${rate}, input.saleAmount=${
            input.saleAmount ?? "n/a"
          }`
        );
      }

      commission = round2(commission);
      if (commission < 0.01) {
        throw new Error(
          `Computed commission ${commission} is below the minimum payout of $0.01.`
        );
      }

      // 3) Create Stripe transfer (platform -> connected account balance)
      const idempotencyKey = `affpay:${affiliate.refId}:${uniqueSaleIds
        .slice()
        .map(String)
        .sort()
        .join(",")}`;

      const transfer = await stripe.transfers.create(
        {
          amount: toCents(commission),
          currency: "usd",
          destination: affiliate.stripeAccountId,
          description: `Affiliate payout ${affiliate.refId} (${
            sales.length
          } sale${sales.length > 1 ? "s" : ""})`,
          metadata: {
            refId: affiliate.refId,
            saleIds: uniqueSaleIds.join(","),
            type: "affiliate_payout",
          },
        },
        { idempotencyKey }
      );

      // 4) Create Payment record in Mongo (status: processing)
      const firstSale = sales[0];
      const payment = await Payment.create({
        refId: affiliate.refId,
        affiliateId: affiliate._id,
        saleIds: uniqueSaleIds,
        saleAmount: round2(input.saleAmount ?? 0),
        paidCommission: commission,
        productName: (firstSale as any)?.event ?? "Commission payout",
        date: new Date(),
        method: "stripe_transfer", // <— important: so reconcile picks it up
        transactionId: transfer.id, // Stripe transfer id (tr_...)
        notes: input.notes,
        status: "processing",
        currency: "usd",
      });

      // 4.1) OPTIONAL immediate snapshot (status: processing) for affiliate history
      // If you prefer confirmed-only, remove this block and instead push in reconcile/webhook.
      await Affiliate.updateOne(
        { _id: affiliate._id },
        {
          $addToSet: {
            paymentHistory: {
              paymentId: payment._id,
              refId: payment.refId,
              affiliateId: payment.affiliateId,
              saleIds: payment.saleIds,
              saleAmount: payment.saleAmount,
              paidCommission: payment.paidCommission,
              productName: payment.productName,
              date: payment.date,
              method: payment.method, // "stripe_transfer"
              transactionId: payment.transactionId,
              notes: payment.notes,
              currency: payment.currency, // "usd"
              status: payment.status, // "processing"
              // paidAt will be set by reconcile/webhook
            },
          },
        }
      );

      // 5) Mark all sales as processing (wait for webhook/reconcile to confirm)
      await AffiliateSale.updateMany(
        { _id: { $in: payment.saleIds }, commissionStatus: { $ne: "paid" } },
        {
          $set: {
            commissionStatus: "processing",
            paymentId: payment._id,
            transferId: transfer.id, // NEW
            stripeAccountId: affiliate.stripeAccountId, // NEW
            processingAt: new Date(), // optional
          },
        }
      );

      return payment;
    },

    addAffiliatePayment: async (
      _: unknown,
      { payment, refId }: { payment: PaymentInputArg; refId: string }
    ) => {
      console.log("[addAffiliatePayment] vars:", { refId, payment });

      try {
        const affiliate = await Affiliate.findOne({ refId });
        if (!affiliate) throw new Error("Affiliate not found");

        const saleAmount = payment.saleAmount ?? payment.amount;
        if (saleAmount == null)
          throw new Error("saleAmount/amount is required");
        if (!payment.method) throw new Error("method is required");

        const record = {
          saleAmount: Number(saleAmount),
          paidCommission:
            typeof payment.paidCommission === "number"
              ? Number(payment.paidCommission)
              : Number(saleAmount), // fallback
          productName: payment.productName ?? "Manual commission payout",
          date: payment.date ?? new Date(),
          method: payment.method,
          transactionId: payment.transactionId ?? `MANUAL-${Date.now()}`,
          notes: payment.notes ?? undefined,
          status: "processing", // or "paid" if you consider manual entries final
        };

        // Create Payment row to keep ledger complete
        await Payment.create({
          affiliateId: affiliate._id,
          refId: affiliate.refId,
          saleIds: [],
          saleAmount: record.saleAmount,
          paidCommission: record.paidCommission,
          productName: record.productName,
          date: record.date,
          method: record.method,
          transactionId: record.transactionId,
          notes: record.notes,
          status: record.status,
        });

        // Use $addToSet instead of pushing in memory; avoids duplicates
        await Affiliate.updateOne(
          { _id: affiliate._id },
          {
            $addToSet: {
              paymentHistory: {
                paymentId: undefined, // you can look it up if needed
                refId: affiliate.refId,
                affiliateId: affiliate._id,
                saleIds: [],
                saleAmount: record.saleAmount,
                paidCommission: record.paidCommission,
                productName: record.productName,
                date: record.date,
                method: record.method,
                transactionId: record.transactionId,
                notes: record.notes,
                status: record.status,
              },
            },
          }
        );

        return await Affiliate.findById(affiliate._id);
      } catch (err) {
        const msg =
          err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        console.error("[addAffiliatePayment] failed:", msg, err);
        throw new Error("Failed to track affiliate payment");
      }
    },

    refundAffiliateSale: async (_: any, { input }: any) => {
      const { saleId, amount, reason } = input;

      const sale = await AffiliateSale.findById(saleId);
      if (!sale) throw new Error("Sale not found.");

      // ── Compute gross (fallback across your fields) ────────────────────────────
      const gross =
        Number.isFinite(Number(sale.total)) && Number(sale.total) > 0
          ? Number(sale.total)
          : Number.isFinite(Number(sale.amount)) && Number(sale.amount) > 0
          ? Number(sale.amount)
          : Math.max(
              0,
              (Number(sale.subtotal) || 0) +
                (Number(sale.tax) || 0) +
                (Number(sale.shipping) || 0) -
                (Number(sale.discount) || 0)
            );

      const refundedSoFar = Number(sale.refundTotal ?? 0);
      const remaining = Math.max(0, gross - refundedSoFar);

      // Already fully refunded?
      if (gross > 0 && remaining <= 0) {
        throw new Error("Sale is already fully refunded.");
      }

      // ── Find Payment row (for metadata + possible reversal later) ──────────────
      const paymentRecord = await Payment.findOne({ saleIds: sale._id }).lean();

      // ── Pick Stripe target (charge or payment_intent) ──────────────────────────
      const target: { charge: string } | { payment_intent: string } | null =
        (() => {
          if (sale.stripeChargeId?.startsWith("ch_"))
            return { charge: sale.stripeChargeId };
          if (sale.stripePaymentIntentId?.startsWith("pi_"))
            return { payment_intent: sale.stripePaymentIntentId };
          if (sale.paymentIntentId?.startsWith("pi_"))
            return { payment_intent: sale.paymentIntentId };
          if (sale.paymentIntentId?.startsWith("ch_"))
            return { charge: sale.paymentIntentId };
          return null;
        })();

      if (!target) {
        throw new Error(
          "No Stripe charge or payment intent linked to this sale (expected ch_ or pi_)."
        );
      }

      // ── Amount logic: cap to remaining; require > 0 ────────────────────────────
      const requested = typeof amount === "number" ? Math.max(0, amount) : null;
      const finalRefundAmount =
        requested == null ? remaining : Math.min(requested, remaining);
      if (!Number.isFinite(finalRefundAmount) || finalRefundAmount <= 0) {
        throw new Error("Refund amount must be greater than 0.");
      }
      const cents = Math.max(1, Math.round(finalRefundAmount * 100));

      // ── Build idempotency key to avoid dup refunds on retries ──────────────────
      const idemKey = [
        "refund",
        String(sale._id),
        "charge" in (target as any)
          ? (target as any).charge
          : (target as any).payment_intent,
        cents,
      ].join(":");

      // ── Create refund in Stripe (with rich metadata) ───────────────────────────
      const refund = await stripe.refunds.create(
        {
          ...target,
          amount: cents,
          reason: reason as any, // 'requested_by_customer' | 'duplicate' | 'fraudulent' | undefined
          metadata: {
            type: "affiliate_sale_refund",
            saleId: String(sale._id),
            refId: sale.refId ?? "",
            paymentRecordId: paymentRecord?._id
              ? String(paymentRecord._id)
              : "",
            paymentTransferId: paymentRecord?.transferId ?? "",
          },
        },
        { idempotencyKey: idemKey }
      );

      // Amount actually refunded by Stripe (in dollars)
      const entryAmount = (refund.amount ?? cents) / 100;
      const entryCreatedAt = new Date(
        (refund.created ?? Math.floor(Date.now() / 1000)) * 1000
      );

      // ── Journal the refund on the sale ─────────────────────────────────────────
      sale.refunds = Array.isArray(sale.refunds) ? sale.refunds : [];
      sale.refunds.push({
        id: refund.id,
        amount: entryAmount,
        status: refund.status, // pending | succeeded | failed
        createdAt: entryCreatedAt,
        updatedAt: new Date(),
      });

      sale.refundTotal = refundedSoFar + entryAmount;
      sale.refundId = refund.id; // latest refund id
      sale.refundAmount = entryAmount; // latest refund amount
      sale.refundedAt = entryCreatedAt; // time of latest refund
      sale.refundAt = sale.refundAt ?? entryCreatedAt; // first refund timestamp

      // Refund status
      if (gross > 0 && sale.refundTotal >= gross - 1e-6) {
        sale.refundStatus = "full";
      } else if (sale.refundTotal > 0) {
        sale.refundStatus = "partial";
      } else {
        sale.refundStatus = "none";
      }

      // ── Proportional commission clawback if the sale was already paid ─────────
      let transferReversalId: string | null = null;

      if (sale.commissionStatus === "paid" && paymentRecord?.transferId) {
        try {
          const paidCommission = Number(paymentRecord.paidCommission ?? 0);
          const fraction = gross > 0 ? Math.min(1, entryAmount / gross) : 0;
          const reversalCents = Math.max(
            0,
            Math.round(paidCommission * 100 * fraction)
          );

          if (reversalCents > 0) {
            const reversal = await stripe.transfers.createReversal(
              paymentRecord.transferId,
              {
                amount: reversalCents,
                metadata: {
                  type: "affiliate_commission_reversal",
                  saleId: String(sale._id),
                  refundId: refund.id,
                  paymentRecordId: paymentRecord?._id
                    ? String(paymentRecord._id)
                    : "",
                },
              }
            );
            transferReversalId = reversal.id;

            // Optional: update the Payment ledger (if you store notes / reversalId)
            await Payment.updateOne(
              { _id: paymentRecord._id },
              {
                $set: {
                  notes: `${
                    paymentRecord.notes ? paymentRecord.notes + " | " : ""
                  }Reversed $${(reversalCents / 100).toFixed(
                    2
                  )} due to refund ${refund.id}`,
                  // If your Payment schema doesn't have reversalId, remove the next line:
                  // @ts-ignore
                  reversalId: reversal.id,
                },
              }
            );
          }

          // Only mark commission reversed when the sale is fully refunded
          if (sale.refundStatus === "full") {
            sale.commissionStatus = "reversed";
          }
        } catch (e: any) {
          console.warn(
            "[refundAffiliateSale] proportional transfer reversal failed:",
            e?.message || e
          );
          // Do not fail the mutation if the refund itself succeeded
        }
      }

      await sale.save();

      return {
        sale,
        stripeRefundId: refund.id,
        transferReversalId,
      };
    },
  },
};

export default resolvers;
