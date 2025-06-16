// import { AffiliateSale } from "../types";

// type Props = {
//   data: { [key: string]: AffiliateSale[] };
// };

// export default function DisplayTable({ data }: Props) {
//   // console.log("data: ", data);

//   // for (let d in data) {
//   //   console.log(d);
//   // }

//   // const render = () => {
//   //   return Object.keys(data).map((d) => (
//   //     <>
//   //       <span key={d} className="view-line">
//   //         {d} detailed report
//   //       </span>
//   //       <br />
//   //     </>
//   //   ));
//   // };

//   // const render = ()  => { <span>hello</span>}

//   return (
//     <div>
//       {/* {render()} */}
//       <div
//         id="pdf-content"
//         style={{
//           padding: "2%",
//           borderRadius: "10px",
//           backgroundColor: "rgb(243, 238, 220)",
//         }}
//       >
//         {/* <h3 style={{ color: "black" }}>Detailed Report for {currentMonth}</h3> */}
//         <table style={{ borderCollapse: "collapse", width: "100%" }}>
//           <thead>
//             <tr>
//               <th className="cell-style-top">Payment date</th>
//               <th className="cell-style-top">Payment ID</th>
//               <th className="cell-style-top">Payment method</th>
//               <th className="cell-style-top">Transaction ID</th>
//               {/* <th className="cell-style-top">Product ID</th> */}
//               <th className="cell-style-top">Sale ID</th>
//               <th className="cell-style-top">Affiliate ID</th>
//               <th className="cell-style-top">Amount</th>
//               <th className="cell-style-top">note</th>
//               {/* <th className="cell-style-top">Action</th> */}
//             </tr>
//           </thead>
//           <tbody>
//             {/* {data?.getAllPayments &&
//                 data?.getAllPayments?.map((payment: any, index: number) => (
//                   <tr key={index}>
//                     <td className="cell-style">
//                       {new Date(payment.date).toLocaleDateString("en-US", {
//                         timeZone: "America/New_York",
//                       })}
//                     </td>
//                     <td className="cell-style">{}</td>
//                     <td className="cell-style">{}</td>
//                     {/* <td className="cell-style">
//                       {payment.event.length <= 20
//                         ? payment.event
//                         : `${payment.event.slice(0, 20)}...`}
//                     </td> */}
//             <td className="cell-style"></td>
//             <td className="cell-style"></td>
//             <td className="cell-style"></td>
//             <td className="cell-style"></td>
//             <td className="cell-style"></td>
//             {/* <td className="cell-style">
//                       <button
//                         className={
//                           payment?.commissionStatus === "paid"
//                             ? "paid-button"
//                             : "unpaid-button"
//                         }
//                         onClick={() => payNow(payment)}
//                         disabled={loadingId === payment.id}
//                       >
//                         {loadingId === payment.id && <Spinner />}
//                         {payment?.commissionStatus === "paid" &&
//                           loadingId !== payment.id && <span>paid</span>}
//                         {payment.commissionStatus === "unpaid" &&
//                           loadingId !== payment.id && <span>pay</span>}
//                       </button>
//                     </td> */}
//             {/* </tr> */}
//             {/* ))} */}
//           </tbody>
//         </table>
//         <>
//           {/* <TotalBar
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
//           <br />
//         </>
//       </div>
//     </div>
//   );
// }
