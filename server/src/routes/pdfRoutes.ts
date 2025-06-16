// To fetch pdf buffer
import express from "express";
import ReportHistory from "../models/ReportHistory";

const router = express.Router();

router.get("/download/:month", async (req, res) => {
  const { month } = req.params;
if (!month) {
    return res.status(400).send("Month parameter is required");
  }
  try {
    const history = await ReportHistory.findOne();
    const report = await ReportHistory.findOne({ month });


    if (!report) return res.status(404).send("Report not found");

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=report-${month}.pdf`,
    });

    res.send(report.pdf);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

export default router;
