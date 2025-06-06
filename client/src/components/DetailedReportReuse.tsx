// import { IoMdClose } from "react-icons/io";
// import { PiFilePdfThin, PiPrinterThin } from "react-icons/pi";

// export default function DetailedReportReuse() {
//   const ths = [
//     "Purchase date",
//     "Sale ID",
//     "Buyer's email",
//     "Product",
//     "Product ID",
//     "Reference ID",
//     "Price",
//     "Commission",
//     "Action",
//   ];
//   return (
//     <div className="res">
//       DetailedReportReuse
//       <div className="">
//         <div className="pis-container no-print">
//           <div className="pdf-print-line">
//             <PiFilePdfThin
//               className="pifile"
//               // onClick={() => saveToPDF()}
//             />
//             <PiPrinterThin
//               className="piprint"
//               // onClick={() => window.print()}
//             />
//           </div>
//           <div className="close">
//             <IoMdClose
//               className="ioclose"
//               //   onClick={() => setShowReport(null)}
//             />
//           </div>
//         </div>
//         <div
//           id="pdf-content"
//           style={{
//             padding: "2%",
//             borderRadius: "10px",
//             backgroundColor: "rgb(243, 238, 220)",
//           }}
//         >
//           {/* <h3 style={{ color: "black" }}>Detailed Report for {currentMonth}</h3> */}
//           <table style={{ borderCollapse: "collapse", width: "100%" }}>
//             <thead>
//               <tr>
//                 {ths &&
//                   ths.map((th, index) => (
//                     <th key={`${index}=${th}`} className="cell-style-top">
//                       {th}
//                     </th>
//                   ))}
//               </tr>
//             </thead>
//             {/* <tbody>
//               {monthSales &&
//                 monthSales?.map((sale: any, index: number) => (
//                   <tr key={index}>
//                     <td className="cell-style">
//                       {new Date(sale.timestamp).toLocaleDateString("en-US", {
//                         timeZone: "America/New_York",
//                       })}
//                     </td>
//                     <td className="cell-style">{sale.id}</td>
//                     <td className="cell-style">{sale.buyerEmail}</td>
//                     <td className="cell-style">
//                       {sale.event.length <= 20
//                         ? sale.event
//                         : `${sale.event.slice(0, 20)}...`}
//                     </td>
//                     <td className="cell-style">{sale.productId}</td>
//                     <td className="cell-style">{sale.refId}</td>
//                     <td className="cell-style">${sale.amount}</td>
//                     <td className="cell-style">${sale.commissionEarned}</td>
//                     {/* <td className="cell-style">
//                       <button
//                         className={
//                           sale?.commissionStatus === "paid"
//                             ? "paid-button"
//                             : "unpaid-button"
//                         }
//                         onClick={() => payNow(sale)}
//                         disabled={
//                           loadingId === sale.id ||
//                           sale.commissionStatus === "paid"
//                         }
//                       >
//                         {loadingId === sale.id && <Spinner />}
//                         {sale?.commissionStatus === "paid" &&
//                           loadingId !== sale.id && <span>paid</span>}
//                         {sale.commissionStatus === "unpaid" &&
//                           loadingId !== sale.id && <span>pay</span>}
//                       </button>
//                     </td> */}
//             {/* </tr> */}
//             {/* ))} */}
//             {/* </tbody> */}
//           </table>
//           <>
//             {/* <TotalBar
//               addedSales={addedSales()}
//               addedCommissions={addedCommissions()}
//               calculateCommissionsByStatus={calculateCommissionsByStatus()}
//               currentMonth={currentMonth}
//               salesPerMonth={salesPerMonth}
//               clicksPerMonth={clicksPerMonth}
//               monthSales={monthSales}
//               findClicks={findClicks()}
//               me={me}
//             /> */}
//             <br />
//           </>
//         </div>
//       </div>
//     </div>
//   );
// }
