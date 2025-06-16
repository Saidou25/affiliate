import { useQuery } from "@apollo/client";
import { GET_ALL_PAYMENTS } from "../utils/queries";
import { PiFilePdfThin, PiPrinterThin } from "react-icons/pi";
import { IoMdClose } from "react-icons/io";

export default function SalesReport() {
  const { data } = useQuery(GET_ALL_PAYMENTS);
  // console.log("payment data: ", data?.getAllPayments);
  return (
    <div className="print">
      <div className="res">
        <h3>
          So far {data?.getAllPayments?.length} payments were maid for this month.
        </h3>
        <br />
        <div className="pis-container no-print">
          <div className="pdf-print-line">
            <PiFilePdfThin
              className="pifile"
              // onClick={() => saveToPDF()}
            />
            <PiPrinterThin
              className="piprint"
              // onClick={() => window.print()}
            />
          </div>
          <div className="close">
            <IoMdClose
              className="ioclose"
              // onClick={() => setShowReport(null)}
            />
          </div>
        </div>
        <div
          id="pdf-content"
          style={{
            padding: "2%",
            borderRadius: "10px",
            backgroundColor: "rgb(243, 238, 220)",
          }}
        >
          {/* <h3 style={{ color: "black" }}>Detailed Report for {currentMonth}</h3> */}

          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th className="cell-style-top">Payment date</th>
                <th className="cell-style-top">Payment ID</th>
                <th className="cell-style-top">Payment method</th>
                <th className="cell-style-top">Transaction ID</th>
                {/* <th className="cell-style-top">Product ID</th> */}
                <th className="cell-style-top">Sale ID</th>
                <th className="cell-style-top">Affiliate ID</th>
                <th className="cell-style-top">Amount</th>
                <th className="cell-style-top">note</th>
                {/* <th className="cell-style-top">Action</th> */}
              </tr>
            </thead>
            <tbody>
              {data?.getAllPayments &&
                data?.getAllPayments?.map((payment: any, index: number) => (
                  <tr key={index}>
                    <td className="cell-style">
                      {new Date(payment.date).toLocaleDateString("en-US", {
                        timeZone: "America/New_York",
                      })}
                    </td>
                    <td className="cell-style">{payment.id}</td>
                    <td className="cell-style">{payment.method}</td>
                    {/* <td className="cell-style">
                      {payment.event.length <= 20
                        ? payment.event
                        : `${payment.event.slice(0, 20)}...`}
                    </td> */}
                    <td className="cell-style">{payment.transactionId}</td>
                    <td className="cell-style">{payment.saleIds[0]}</td>
                    <td className="cell-style">{payment.affiliateId}</td>
                    <td className="cell-style">${payment.amount}</td>
                    <td className="cell-style">{payment.notes}</td>
                    {/* <td className="cell-style">
                      <button
                        className={
                          payment?.commissionStatus === "paid"
                            ? "paid-button"
                            : "unpaid-button"
                        }
                        onClick={() => payNow(payment)}
                        disabled={loadingId === payment.id}
                      >
                        {loadingId === payment.id && <Spinner />}
                        {payment?.commissionStatus === "paid" &&
                          loadingId !== payment.id && <span>paid</span>}
                        {payment.commissionStatus === "unpaid" &&
                          loadingId !== payment.id && <span>pay</span>}
                      </button>
                    </td> */}
                  </tr>
                ))}
            </tbody>
          </table>
          <>
            {/* <TotalBar
              addedSales={addedSales()}
              addedCommissions={addedCommissions()}
              calculateCommissionsByStatus={calculateCommissionsByStatus()}
              currentMonth={currentMonth}
              salesPerMonth={salesPerMonth}
              clicksPerMonth={clicksPerMonth}
              monthSales={monthSales}
              findClicks={findClicks()}
              me={me}
            /> */}
            <br />
          </>
        </div>
      </div>
    </div>
  );
}
