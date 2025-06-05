// import { generatePDF } from "../utils/generatePDF";
// import PDFReport from "../models/ReportHistory";
// import mongoose from "mongoose";

// /**
//  * Save a generated PDF report to MongoDB for a specific month.
//  *
//  * @param htmlContent - The HTML content to convert to PDF.
//  * @param currentMonth - The month string (e.g., "2025-05") to store alongside the PDF.
//  */
// export const generateMonthlyPDFReportPDF = async (
//   htmlContent: string,
//   currentMonth: string
// ) => {
//   if (mongoose.connection.readyState === 0) {
//     await mongoose.connect(process.env.MONGODB_URI || "", {
//       dbName: "your-db-name",
//     });
//   }

//   const pdfBuffer = await generatePDF(htmlContent);

//   await PDFReport.create({
//     month: currentMonth, // Now using the passed-in value
//     pdf: pdfBuffer,
//   });

//   return pdfBuffer;
// };
