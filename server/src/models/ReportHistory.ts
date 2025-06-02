import mongoose, { Schema, Document } from "mongoose";

export interface ReportEntry {
  month: string;
  pdf: Buffer;
  createdAt?: Date;
}

export interface IReportHistory extends Document {
  reports: ReportEntry[];
}

const ReportEntrySchema = new Schema<ReportEntry>(
  {
    month: { type: String, required: true },
    pdf: { type: Buffer, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ReportHistorySchema = new Schema<IReportHistory>({
  reports: { type: [ReportEntrySchema], default: [] },
});

const ReportHistory = mongoose.model<IReportHistory>(
  "ReportHistory",
  ReportHistorySchema
);

export default ReportHistory;
