// import mongoose, { Document, Schema } from "mongoose";

// interface INotification  {
//   date: Date;
//   title: string;
//   text: string;
//   read: boolean;
// }

// const NotificationSchema = new Schema({
//   title: { type: String, required: true },
//   text: { type: String, default: "" },
//   read: { type: Boolean, default: false },
//   date: {
//     type: Date,
//     required: true,
//     default: Date.now,
//     set: (v: any) => {
//       if (!v) return new Date();
//       const d = new Date(String(v).trim());
//       if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${v}`);
//       return d;
//     },
//   },
// });

// const Notification = mongoose.model<INotification>(
//   "Notification",
//   NotificationSchema
// );

// export default Notification;
