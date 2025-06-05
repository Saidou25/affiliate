// import dotenv from "dotenv";
// dotenv.config();

// import mongoose from "mongoose";
// import ReportHistory from "../models/ReportHistory";
// import { generateMonthlyReportForAdmin } from "./generateMonthlyReportForAdmin";

// async function test() {
//   const now = new Date();
//   const formattedMonth = new Intl.DateTimeFormat("en-US", {
//     timeZone: "America/New_York",
//     year: "numeric",
//     month: "2-digit",
//   })
//     .format(now)
//     .replace("/", "-");

//   try {
//     // Connect to MongoDB (adjust your connection string)
//     await mongoose.connect(process.env.MONGODB_URI || "");

//     // Prepare some example HTML content (replace with your real content)
//     // const htmlContent = "<h1>Test PDF Report</h1><p>Month: 05-2025</p>";

//     // Generate PDF buffer
//     const pdfBuffer = await generateMonthlyReportForAdmin();

//     // Find existing ReportHistory or create a new one
//     let history = await ReportHistory.findOne();
//     if (!history) {
//       history = new ReportHistory({ reports: [] });
//     }

//     // Remove any existing report for this month
//     history.reports = history.reports.filter((r) => r.month !== "05-2025");

//     // Add new report entry
//     history.reports = history.reports.filter((r) => r.month !== formattedMonth);
//     history.reports.push({
//       month: formattedMonth,
//       pdf: pdfBuffer,
//       createdAt: new Date(),
//     });

//     // Save updated document
//     await history.save();

//     console.log("PDF report saved to MongoDB in 'reports' array.");
//     await mongoose.disconnect();
//   } catch (error) {
//     console.error("Error generating or saving PDF report:", error);
//   }
// }

// test();
