import { groupSalesByMonth } from "../shared/groupSalesBymonth";
import { generateMonthlyPDFReportPDF } from "./generateMonthlyReportPDF";
import { generateReportHTML } from "./generateReportHTML";
import { AffiliateSale } from "../graphql/types";
import AffiliateSaleModel from "../models/AffiliateSale";

export async function generateMonthlyReportForAdmin() {
  // 1. Get all sales
  const allSales: AffiliateSale[] = await AffiliateSaleModel.find({}).lean();

  // 2. Group by month
  const monthlyGroups = groupSalesByMonth(allSales);

  // 3. Pick the most recent month
  const { sales: monthSales, month: currentMonth } = monthlyGroups[0];

  // 4. Calculate totals
  const totalSales = monthSales.reduce((sum, s) => sum + s.amount, 0);
  const totalCommissions = monthSales.reduce(
    (sum, s) => sum + s.commissionEarned,
    0
  );
  const totalClicks = 0; // You can fetch click logs similarly if needed

  // 5. Generate HTML and PDF
  const html = generateReportHTML({
    monthSales,
    currentMonth,
    addedSales: totalSales,
    addedCommissions: totalCommissions,
    clicks: totalClicks,
  });

  const pdfBuffer = await generateMonthlyPDFReportPDF(html, currentMonth);
  return pdfBuffer;
}
