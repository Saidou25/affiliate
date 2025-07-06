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
import Affiliate from "../models/Affiliate";
import AffiliateSale from "../models/AffiliateSale";
import ClickLog from "../models/ClickLog";
import ReportHistory, { IReportHistory } from "../models/ReportHistory";
import Payment from "../models/Payment";
import { generateMonthlyPDFReportPDF } from "../cron/generateMonthlyReportPDF";
import {
  createStripeAccountAndOnboardingLink,
  getOnboardingLinkForExistingAccount,
} from "../utils/stripe";
import { checkStripeAccountStatus } from "../utils/checkStripeAccount";

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

interface PaymentInput {
  amount: number;
  date: Date;
  method: string;
  transactionId?: string;
  notes?: string;
}

const resolvers = {
  Date: dateScalar,

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

    getAffiliateSales: async (_: any, { refId }: { refId: string }) => {
      return await AffiliateSale.find({ refId }); // likely multiple sales per affiliate
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
        throw new Error(result.message || "Stripe status check failed.");
      }

      // Match StripeStatus type directly
      const { id, charges_enabled, payouts_enabled, details_submitted } =
        result;

      return { id, charges_enabled, payouts_enabled, details_submitted };
    },
  },

  Mutation: {
    login: async (
      _: unknown,
      { email, password }: { email: string; password: string }
    ) => {
      console.log("🔐 Login attempt:", email);
      console.log("📥 Incoming password:", password);
      const affiliate = await Affiliate.findOne({
        email: email.toLowerCase().trim(),
      });
      console.log("🔐 Hashed password in DB:", affiliate?.password);
      if (!affiliate) {
        console.warn("❌ No affiliate found for email:", email);
        throw new Error("Affiliate not found");
      }

      const valid = await bcrypt.compare(
        password.trim(),
        affiliate.password.trim()
      ); // ✅ check password
      // const valid = password.trim() === affiliate.password.trim();

      console.log("📥 Incoming password (trimmed):", password.trim());
      console.log("🔐 Hashed password (trimmed):", affiliate.password.trim());

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
      console.log("✅ Login success. Token:", token);
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
        event,
        timestamp,
      }: {
        productId: string;
        refId: string;
        buyerEmail: string;
        amount: number;
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
          timestamp: timestamp || new Date(),
          commissionEarned: parseFloat(commission.toFixed(2)), // ✅ ensure it's a number
          commissionStatus: "unpaid", // ✅ explicitly set default
        });
        await sale.save();

        // 📧 4. Send confirmation emails
        await sendConfirmationEmail({
          buyerEmail,
          event,
          amount,
          commission,
        });
        await sendTrackASaleConfEmail({
          buyerEmail,
          affiliateEmail: affiliate.email,
          event,
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

    clickLog: async (_: unknown, { refId }: { refId: string }) => {
      try {
        if (!refId) {
          throw new Error("refId is required");
        }

        console.log("✅ clickLog called with:", refId);

        const updatedAffiliate = await Affiliate.findOneAndUpdate(
          { refId },
          { $inc: { totalClicks: 1 } }, // Increment totalClicks by 1
          { new: true } // Return the updated document
        );

        if (!updatedAffiliate) {
          throw new Error("Affiliate not found");
        }

        const newClick = new ClickLog({ refId });
        await newClick.save();
        console.log("✅ newClick saved:", newClick);

        return newClick;
      } catch (error) {
        console.error("Error logging click:", error);
        throw new Error("Failed to log click");
      }
    },

    recordAffiliatePayment: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          refId: string;
          saleIds: string[];
          saleAmount: number;
          method: string;
          transactionId?: string;
          notes?: string;
        };
      }
    ) => {
      const affiliateSale = await AffiliateSale.findById(input.saleIds[0]);
      if (!affiliateSale) {
        throw new Error("Affiliate sale not found.");
      }
      const productName = affiliateSale?.event;

      const affiliate = await Affiliate.findOne({ refId: input.refId });
      // 💰 2. Calculate the commission (default 10% if none set)
      if (!affiliate) {
        throw new Error("Affiliate not found.");
      }

      const commissionRate = affiliate.commissionRate ?? 0.1;
      const commission = input.saleAmount * commissionRate;
      try {
        // 🔍 1. Create a new Payment document
        const payment = await Payment.create({
          refId: affiliate.refId,
          affiliateId: affiliate._id,
          saleIds: input.saleIds.map((id) => new Types.ObjectId(id)),
          saleAmount: parseFloat(input.saleAmount.toFixed(2)),
          paidCommission: parseFloat(commission.toFixed(2)), // ✅ ensure it's a number,
          method: input.method,
          transactionId: input.transactionId,
          productName: productName,
          notes: input.notes,
          date: new Date(),
        });

        // 🔄 2. Update selected AffiliateSale document
        const affiliateSale = await AffiliateSale.findByIdAndUpdate(
          { _id: input.saleIds[0] },
          {
            $set: {
              commissionStatus: "paid",
              paidAt: new Date(),
              paymentId: payment._id,
            },
          },
          { new: true }
        );
        console.log("✅ AffiliateSale updated:", affiliateSale);

        // 📝 3. Push a PaymentRecord snapshot to Affiliate.paymentHistory
        await Affiliate.findOneAndUpdate(
          { refId: input.refId },
          {
            $push: {
              paymentHistory: {
                paidCommission: parseFloat(commission.toFixed(2)), // ✅ ensure it's a number,
                saleAmount: parseFloat(input.saleAmount.toFixed(2)), // ✅ ensure it's a number,
                date: payment.date,
                method: input.method,
                transactionId: input.transactionId,
                notes: input.notes,
                productName: productName,
              },
            },
          }
        );

        // ✅ 4. Return the new Payment record
        return payment;
      } catch (error) {
        console.error("❌ Error recording affiliate payment:", error);
        throw new Error("Failed to record affiliate payment");
      }
    },

    // addMonthlyReport: async (
    //   _: any,
    //   { month, pdf }: { month: string; pdf: string }
    // ) => {
    //   const buffer = Buffer.from(pdf, "base64");

    //   const updated = await ReportHistory.findOneAndUpdate(
    //     { month },
    //     {
    //       pdf: buffer,
    //       createdAt: new Date(),
    //     },
    //     { upsert: true, new: true }
    //   );

    //   if (!updated) {
    //     throw new Error("Failed to create or update the report");
    //   }

    //   const reportId = (updated._id as Types.ObjectId).toString();

    //   return {
    //     id: reportId,
    //     month: updated.month,
    //     html: updated.html ?? null,
    //     pdf: updated.pdf ? updated.pdf.toString("base64") : null,
    //     createdAt: updated.createdAt?.toISOString() ?? null,
    //   };
    // },

    addAffiliatePayment: async (
      _: unknown,
      {
        payment,
        refId,
      }: {
        payment: PaymentInput;
        refId: string;
      }
    ) => {
      try {
        // 🔍 1. Find the affiliate by refId
        const affiliate = await Affiliate.findOne({ refId });
        if (!affiliate) throw new Error("Affiliate not found");

        if (payment.amount > affiliate.totalCommissions)
          throw new Error("Payment exceeds unpaid commissions.");

        // 💰 2. Add payment record to history
        affiliate.paymentHistory.push(payment);

        await affiliate.save();

        // 📧 4. Send confirmation emails
        // await sendConfirmationEmail({
        //   buyerEmail,
        //   event,
        //   amount,
        //   commission,
        // });
        // await sendTrackASaleConfEmail({
        //   buyerEmail,
        //   affiliateEmail: affiliate.email,
        //   event,
        //   amount,
        //   commission,
        // });

        return affiliate;
      } catch (error) {
        console.error("❌ Error tracking affiliate sale:", error);
        throw new Error("Failed to track affiliate sale");
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
  },
};

export default resolvers;
