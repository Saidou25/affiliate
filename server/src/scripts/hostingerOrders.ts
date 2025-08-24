import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import type { Page, Frame } from "puppeteer";

dotenv.config();
puppeteer.use(StealthPlugin());

const DOWNLOAD_PATH = path.resolve("./downloads");

// ✅ Path to your actual Chrome profile (Mac example)
// 🔹 On Windows: C:\\Users\\<YourUser>\\AppData\\Local\\Google\\Chrome\\User Data
// 🔹 On Linux: /home/<YourUser>/.config/google-chrome
const USER_DATA_DIR = "/Users/coding/Library/Application Support/Google/Chrome";

async function clickButtonWithRetry(
  pageOrFrame: Page | Frame,
  selector: string,
  description: string,
  retries = 3
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const buttons = await pageOrFrame.$$(selector);
      console.log(`🔎 Found ${buttons.length} "${description}" buttons`);
      for (const btn of buttons) {
        const text = await pageOrFrame.evaluate((el) => el.textContent?.trim(), btn);
        console.log(`➡️ Button text: "${text}"`);
        if (text?.includes(description)) {
          await btn.click();
          console.log(`✅ Clicked ${description} button`);
          return true;
        }
      }
    } catch (e) {
      console.warn(`⚠️ Attempt ${i + 1} failed for ${description}, retrying...`);
    }
    await new Promise((res) => setTimeout(res, 2000));
  }
  return false;
}

(async () => {
  console.log("🚀 Starting Hostinger Orders CSV export...");

  // ✅ Launch Chrome using your real profile
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: USER_DATA_DIR, // Using your real Chrome profile
    slowMo: 50,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);

  if (!fs.existsSync(DOWNLOAD_PATH)) {
    fs.mkdirSync(DOWNLOAD_PATH);
    console.log(`📂 Created downloads folder at: ${DOWNLOAD_PATH}`);
  }

  const client = await page.createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: DOWNLOAD_PATH,
  });
  console.log("📥 Download behavior set");

  // Go to Hostinger panel (you should already be logged in)
  console.log("🌐 Navigating to Hostinger panel...");
  await page.goto("https://hpanel.hostinger.com", {
    waitUntil: "networkidle0",
  });
  console.log("✅ Hostinger panel loaded");
  console.log("🔗 Current URL after panel load:", page.url());

  // Detect if already logged in
  if (page.url().includes("/login")) {
    console.warn("⚠️ You are not logged in. Please log in manually in Chrome first.");
    await browser.close();
    return;
  }

  console.log("🖱️ Clicking Websites tab...");
  const websiteButtons = await page.$$("div.hp-menu__item-content span.h-typography");
  let websitesButtonHandle = null;

  for (const btn of websiteButtons) {
    const text = await page.evaluate((el) => el.textContent?.trim(), btn);
    console.log(`➡️ Found menu button with text: ${text}`);
    if (text === "Websites") {
      websitesButtonHandle = btn;
      break;
    }
  }

  if (websitesButtonHandle) {
    await websitesButtonHandle.click();
    console.log("✅ Clicked Websites tab");
  } else {
    throw new Error("❌ Websites tab not found");
  }

  console.log("🔎 Searching for website: princetongreen.org");
  const editClicked = await clickButtonWithRetry(
    page,
    "span.h-typography.h-typography-button-4.h-button-v2__text",
    "Edit website"
  );
  if (!editClicked) throw new Error("❌ Edit website button not found");

  console.log("🌐 Navigating to Website Builder...");
  await page.waitForNavigation({ waitUntil: "networkidle0" });
  console.log("✅ Website Builder loaded");

  console.log("🛒 Looking for Store button...");
  await page.waitForSelector('div[data-qa="sidebaraction-store-button"] button', { visible: true });
  await page.click('div[data-qa="sidebaraction-store-button"] button');
  console.log("✅ Store button clicked");

  console.log("📂 Looking for Orders button...");
  const ordersClicked = await clickButtonWithRetry(
    page,
    "p.manage-ecommerce-drawer__item-title.text-body-2",
    "Orders"
  );
  if (!ordersClicked) throw new Error("❌ Orders button not found");

  console.log("📥 Looking for Export to CSV button...");
  const exportClicked = await clickButtonWithRetry(
    page,
    "span.v-btn__content",
    "Export to CSV"
  );
  if (!exportClicked) throw new Error("❌ Export CSV button not found");

  console.log("⏳ Waiting for CSV download...");
  await new Promise((resolve) => setTimeout(resolve, 10000));

  const files = fs.readdirSync(DOWNLOAD_PATH);
  const csvFile = files.find((f) => f.endsWith(".csv"));
  if (csvFile) {
    console.log(`✅ CSV downloaded successfully: ${csvFile}`);
  } else {
    console.error("❌ CSV file not found in download directory");
  }

  await browser.close();
  console.log("🎉 Script finished successfully");
})();
