import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SECRET } from "../config/env";
import { Types } from "mongoose";
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

      // 2) Looks up the most recent transfer to this connected account
      // (Platform-side: transfers are created against the platform; we filter by destination)
      let lastTransfer: {
        id: string;
        amount: number;
        currency: string;
        createdAt: Date;
        reversed: boolean;
      } | null = null;

      try {
        const list = await stripe.transfers.list({
          destination: affiliate.stripeAccountId, // acct_...
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
        // Don’t fail the whole status call on transfer lookup issues
        console.warn(
          "[checkStripeStatus] transfers.list failed:",
          (e as Error)?.message || e
        );
      }
      // Return a consistent shape regardless of success
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

    affiliateProducts: async (
      _: any,
      { active }: { active?: boolean },
      context: MyContext
    ) => {
      const filter: any = {};
      if (active !== undefined) filter.active = active;
      return AffiliateProduct.find(filter).sort({ name: 1 }).lean();
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
          expiresIn: "1h",
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
        expiresIn: "1h",
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

    markSaleAsPaid: async (_: unknown, { saleId }: { saleId: string }) => {
      console.log("💥 Received saleId on backend:", saleId);
      const sale = await AffiliateSale.findById(saleId);
      if (!sale) throw new Error("Sale not found");

      sale.commissionStatus = "paid";
      await sale.save();

      return sale;
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

    createNotification: async (
      _: unknown,
      { refId, title, text }: { refId: string; title: string; text: string }
    ) => {
      console.log("💥 Creating notification for:", refId);
      const affiliate = await Affiliate.findOne({ refId });
      if (!affiliate) throw new Error("Affiliate not found");
      const newNotification = {
        date: new Date(),
        title: title,
        text: text,
        read: false,
      };
      affiliate.notifications = affiliate.notifications ?? [];
      affiliate?.notifications?.push(newNotification);
      await affiliate.save();

      return affiliate;
    },

    deleteNotification: async (_: unknown, { refId }: { refId: string }) => {
      console.log("🗑️ Deleting notification:", title, "for:", refId);

      const affiliate = await Affiliate.findOne({ refId });
      if (!affiliate) throw new Error("Affiliate not found");

      const titlesToDelete = [
        "Stripe account not connected",
        "Finish your Stripe onboarding",
        "Success, Stripe onBoarding complete",
      ];
      // Remove notifications matching the given title
      affiliate.notifications = affiliate.notifications?.filter(
        (note: any) => !titlesToDelete.includes(note.title)
      );

      await affiliate.save();
      return affiliate;
    },

    markNotificationsRead: async (_: unknown, { refId }: { refId: string }) => {
      const affiliate = await Affiliate.findOne({ refId });
      if (!affiliate) throw new Error("Affiliate not found");

      // ✅ Update only unread notifications
      affiliate.notifications = affiliate?.notifications?.map((n: any) =>
        n.read ? n : { ...n.toJSON(), read: true }
      );

      await affiliate.save();
      return affiliate;
    },

    updateNotificationReadStatus: async (
      _: unknown,
      { refId, title, read }: { refId: string; title: string; read: boolean }
    ) => {
      const affiliate = await Affiliate.findOne({ refId });
      if (!affiliate) throw new Error("Affiliate not found");

      const notification = affiliate.notifications?.find(
        (n: any) => n.title === title
      );
      if (notification) {
        notification.read = read;
        await affiliate.save();
      }

      return affiliate;
    },

    disconnectStripeAccount: async (
      _: any,
      { affiliateId }: { affiliateId: string }
    ) => {
      const affiliate = await Affiliate.findById(affiliateId);
      if (!affiliate || !affiliate.stripeAccountId) {
        throw new Error("Stripe account not found.");
      }

      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

        const deleted = await stripe.accounts.del(affiliate.stripeAccountId);

        affiliate.stripeAccountId = undefined;
        await affiliate.save();

        return { success: true, deleted };
      } catch (err) {
        console.error("Error disconnecting Stripe:", err);
        throw new Error("Stripe disconnection failed.");
      }
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

      if (!(amount > 0)) throw new Error("Amount must be > 0");

      // 1) Find affiliate & check Stripe account
      const affiliate = await Affiliate.findOne({ refId });
      if (!affiliate) throw new Error("Affiliate not found.");
      if (!affiliate.stripeAccountId)
        throw new Error("Affiliate is not connected to Stripe.");

      // block overpay against unpaid balance
      const unpaid = Number(affiliate.totalCommissions ?? 0);
      if (amount > unpaid) {
        throw new Error("Payment exceeds unpaid commissions.");
      }

      // 2) Create Stripe transfer (platform -> connected account)
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const cents = Math.round(amount * 100);

      const idemKey = `xfer:${refId}:${cents}:${
        (saleIds || []).slice().sort().join(",") || "none"
      }`;

      const transfer = await stripe.transfers.create(
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

      // 3) Persist Payment document (so it shows up in getAllPayments)
      const paidAtISO = new Date(transfer.created * 1000).toISOString();
      const payment = await Payment.create({
        refId,
        affiliateId: affiliate._id,
        saleIds: (saleIds || []).map((id) => new Types.ObjectId(id)),
        saleAmount: Number(amount.toFixed(2)), // required by schema
        paidCommission: Number(amount.toFixed(2)), // paying this amount as commission
        productName: productName ?? "Stripe transfer",
        date: new Date(paidAtISO),
        method: "stripe_transfer",
        transactionId: transfer.id, // tr_...
        notes: notes ?? transfer.description ?? null,
      });

      if (saleIds.length) {
        await AffiliateSale.updateMany(
          { _id: { $in: payment.saleIds }, commissionStatus: "unpaid" },
          { $set: { commissionStatus: "processing", paymentId: payment._id } }
        );
      }

      // 4) Append snapshot to Affiliate.paymentHistory (what your UI reads)
      // affiliate.paymentHistory = affiliate.paymentHistory ?? [];
      // affiliate.paymentHistory.push({
      //   saleAmount: Number(amount.toFixed(2)),
      //   paidCommission: Number(amount.toFixed(2)),
      //   productName: productName ?? "Stripe transfer",
      //   date: new Date(paidAtISO).toLocaleString(),
      //   method: "stripe_transfer",
      //   transactionId: transfer.id,
      //   notes: notes ?? transfer.description ?? undefined,
      // });

      // 5) Reduce unpaid balance (if totalCommissions is your “unpaid” pool)
      // if (typeof affiliate.totalCommissions === "number") {
      //   affiliate.totalCommissions = Math.max(
      //     0,
      //     Number((affiliate.totalCommissions - amount).toFixed(2))
      //   );
      // }

      await affiliate.save();

      // 6) Return a Payment (matches your SDL)
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
          saleAmount: number; // order total (or whatever you decided)
          method: string; // "bank" | "paypal" | "crypto" | ...
          transactionId?: string; // ignored; we’ll overwrite with Stripe id
          notes?: string;
        };
      }
    ) => {
      // 1) Find affiliate & sales
      const affiliate = await Affiliate.findOne({ refId: input.refId });
      if (!affiliate) throw new Error("Affiliate not found.");
      if (!affiliate.stripeAccountId)
        throw new Error("Affiliate is not connected to Stripe.");

      const sales = await AffiliateSale.find({
        _id: { $in: input.saleIds.map((id) => new Types.ObjectId(id)) },
      });
      if (!sales.length) throw new Error("No valid sales found for payout.");

      // guard against double pay
      const alreadyPaid = sales.find((s) => s.commissionStatus === "paid");
      if (alreadyPaid) throw new Error("One or more sales are already paid.");

      // 2) Compute commission to transfer
      // Prefer exact per-sale commissions if present; else fallback to rate * saleAmount
      let commission = 0;
      const perSaleHasCommission = sales.every(
        (s) => typeof s.commissionEarned === "number"
      );
      if (perSaleHasCommission) {
        commission = sales.reduce(
          (sum, s) => sum + (s.commissionEarned || 0),
          0
        );
      } else {
        const rate = affiliate.commissionRate ?? 0.1;
        commission = input.saleAmount * rate;
      }
      commission = Number(commission.toFixed(2));
      if (!(commission > 0))
        throw new Error("Computed commission must be > 0.");

      // 3) Create Stripe transfer (platform -> connected account balance)
      const idempotencyKey = `affpay:${affiliate.refId}:${input.saleIds
        .slice()
        .sort()
        .join(",")}`;

      const transfer = await stripe.transfers.create(
        {
          amount: Math.round(commission * 100),
          currency: "usd",
          destination: affiliate.stripeAccountId,
          description: `Affiliate payout ${affiliate.refId} (${
            sales.length
          } sale${sales.length > 1 ? "s" : ""})`,
          metadata: {
            refId: affiliate.refId,
            saleIds: input.saleIds.join(","),
            type: "affiliate_payout",
          },
        },
        { idempotencyKey }
      );

      // 4) Create Payment record in Mongo (store the Stripe transfer id)
      const firstSale = sales[0];
      const payment = await Payment.create({
        refId: affiliate.refId,
        affiliateId: affiliate._id,
        saleIds: input.saleIds.map((id) => new Types.ObjectId(id)),
        saleAmount: Number(input.saleAmount.toFixed(2)),
        paidCommission: commission,
        productName: firstSale?.event ?? "Commission payout",
        date: new Date(),
        method: input.method,
        transactionId: transfer.id, // <-- Stripe transfer id (tr_...)
        notes: input.notes,
      });

      // 5) Mark all sales as processing (wait for webhook to confirm)
      await AffiliateSale.updateMany(
        { _id: { $in: payment.saleIds }, commissionStatus: { $ne: "paid" } },
        {
          $set: {
            commissionStatus: "processing",
            paymentId: payment._id,
            // paidAt: (leave unset until webhook)
          },
        }
      );

      // 6) Append snapshot to Affiliate.paymentHistory
      // await Affiliate.findByIdAndUpdate(affiliate._id, {
      //   $push: {
      //     paymentHistory: {
      //       saleAmount: Number(input.saleAmount.toFixed(2)),
      //       paidCommission: commission,
      //       date: payment.date,
      //       method: input.method,
      //       transactionId: transfer.id,
      //       notes: input.notes,
      //       productName: firstSale?.event ?? "Commission payout",
      //     },
      //   },
      // });

      return payment;
    },

    addAffiliatePayment: async (
      _: unknown,
      { payment, refId }: { payment: PaymentInputArg; refId: string }
    ) => {
      // 👇 quick visibility
      console.log("[addAffiliatePayment] vars:", { refId, payment });

      try {
        const affiliate = await Affiliate.findOne({ refId });
        if (!affiliate) throw new Error("Affiliate not found");

        // accept both saleAmount and legacy amount
        const saleAmount = payment.saleAmount ?? payment.amount;
        if (saleAmount == null)
          throw new Error("saleAmount/amount is required");
        if (!payment.method) throw new Error("method is required");

        // build exactly what Affiliate.paymentHistory subdoc expects
        const record = {
          saleAmount: Number(saleAmount),
          paidCommission:
            typeof payment.paidCommission === "number"
              ? Number(payment.paidCommission)
              : Number(saleAmount), // fallback
          productName: payment.productName ?? undefined,
          date: payment.date,
          method: payment.method,
          transactionId: payment.transactionId ?? undefined,
          notes: payment.notes ?? undefined,
        };

        affiliate.paymentHistory ??= [];
        affiliate.paymentHistory.push(record);

        await Payment.create({
          affiliateId: affiliate._id,
          refId: affiliate.refId,
          saleIds: [], // manual payout: no specific sales
          saleAmount: record.saleAmount, // number
          paidCommission: record.paidCommission ?? record.saleAmount,
          productName: record.productName ?? "Manual commission payout",
          date: record.date, // Date object
          method: record.method,
          transactionId: record.transactionId ?? `MANUAL-${Date.now()}`,
          notes: record.notes,
        });
        await affiliate.save();

        // return a fresh doc to the client
        return await Affiliate.findById(affiliate._id);
      } catch (err) {
        // 👇 log the real reason to your server console
        const msg =
          err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        console.error("[addAffiliatePayment] failed:", msg, err);
        throw new Error("Failed to track affiliate payment");
      }
    },
  },
};

export default resolvers;
