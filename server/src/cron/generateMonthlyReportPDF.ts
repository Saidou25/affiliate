import { generatePDF } from "../utils/generatePDF";

/**
 * Generate a PDF buffer from HTML content.
 *
 * @param htmlContent - The HTML content to convert to PDF.
 * @returns A Promise that resolves to a PDF buffer
 */
export const generateMonthlyPDFReportPDF = async (
  htmlContent: string,
  _currentMonth: string // still passed in for consistency, but not used here
): Promise<Buffer> => {
  const pdfBuffer = await generatePDF(htmlContent);
  return pdfBuffer;
};
