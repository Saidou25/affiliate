// import cron from 'node-cron';
// import moment from 'moment-timezone';
// import { generateMonthlyReportForAdmin } from './generateMonthlyReportForAdmin';

// cron.schedule('57 23 * * *', () => {
//   const now = moment().tz('America/New_York');
//   const tomorrow = now.clone().add(1, 'day');

//   if (tomorrow.date() === 1) {
//     console.log('Running scheduled report generation at 11:57 PM ET');
//     generateMonthlyReportForAdmin().catch((err) => {
//       console.error('Error generating report:', err);
//     });
//   }
// });
