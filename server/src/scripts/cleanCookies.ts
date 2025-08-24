import fs from "fs";
import path from "path";

const RAW_PATH = path.resolve("src/scripts/raw-cookies.json");
const CLEANED_PATH = path.resolve("src/scripts/cookies.json");

try {
  // Load raw EditThisCookie export
  const rawCookies = JSON.parse(fs.readFileSync(RAW_PATH, "utf-8"));

  // Deduplicate cookies (keep last occurrence)
  const uniqueCookies = new Map();

  for (const cookie of rawCookies) {
    const key = `${cookie.domain}|${cookie.path}|${cookie.name}`;
    uniqueCookies.set(key, {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite || "Lax",
      expires: cookie.expirationDate
        ? Math.floor(cookie.expirationDate)
        : undefined,
    });
  }

  const cleanedCookies = Array.from(uniqueCookies.values());

  // Save final cookies.json
  fs.writeFileSync(CLEANED_PATH, JSON.stringify(cleanedCookies, null, 2));

  console.log(
    `✅ Cleaned and deduplicated ${cleanedCookies.length} cookies saved to ${CLEANED_PATH}`
  );
} catch (error) {
  console.error("❌ Error cleaning cookies:", error);
}
