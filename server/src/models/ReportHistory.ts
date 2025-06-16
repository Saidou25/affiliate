import mongoose, { Schema, Document } from "mongoose";

export interface IReportHistory extends Document {
  month: string;
  pdf?: Buffer;
  html?: string;
  createdAt?: Date;
}

const ReportHistorySchema = new Schema<IReportHistory>({
  month: { type: String, required: true, unique: true },
  pdf: { type: Buffer },
  html: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const ReportHistory = mongoose.model<IReportHistory>("ReportHistory", ReportHistorySchema);

export default ReportHistory;
