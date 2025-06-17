import puppeteer from "puppeteer";

export const generatePDF = async (htmlContent: string): Promise<Buffer> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfUint8Array = await page.pdf({
    format: "A4",
    printBackground: true,
    landscape: true, // 👈 this enables landscape mode
  });

  await browser.close();

  // Convert Uint8Array to Buffer to satisfy Mongoose Buffer type
  const pdfBuffer = Buffer.from(pdfUint8Array);

  return pdfBuffer;
};
