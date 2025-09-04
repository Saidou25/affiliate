import { Request, Response } from "express";
import Affiliate from "../models/Affiliate";
import ClickLog from "../models/ClickLog";

const gif1x1 = Buffer.from(
  "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
  "base64"
);

export default async function clickPixel(req: Request, res: Response) {
  const refId = (req.query.refId || req.query.pg_refId)?.toString().trim();
  const url = (req.query.url as string) || req.get("referer") || "";
  const source = (req.query.source as string) || "wordpress";

  try {
    if (refId) {
      const affiliate = await Affiliate.findOne({ refId }).lean();
      await ClickLog.create({
        refId,
        affiliateId: affiliate?._id,
        source,
        url,
        userAgent: req.get("user-agent"),
        ip:
          (req.headers["x-forwarded-for"] as string) ||
          req.socket.remoteAddress,
        createdAt: new Date(),
      });
    }
  } catch (e) {
    // swallow errors so the pixel still returns
    console.error("[clickPixel] log failed:", (e as Error).message);
  } finally {
    res.set("Content-Type", "image/gif");
    res.set("Cache-Control", "no-store, max-age=0");
    res.status(200).end(gif1x1);
  }
}
