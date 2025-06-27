import { useQuery } from "@apollo/client";
import { GET_ALLREPORTS } from "../utils/queries";
import SalesReport from "./PaymentsReports";

type ReportEntry = {
  id: string;
  month: string;
  pdf: string | null;
  html?: string;
  createdAt?: string;
};

export default function DataCenter() {
  const { data, loading, error } = useQuery<{ getAllReports: ReportEntry[] }>(
    GET_ALLREPORTS
  );

  const handleDownloadPDF = (report: ReportEntry) => {
    if (!report.pdf) {
      alert("PDF is not available for this report.");
      return;
    }

    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${report.pdf}`;
    link.download = `report-${report.month}.pdf`;
    document.body.appendChild(link); // for Firefox compatibility
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h2>🗂️ Archive of reports</h2>
      <div className="res">
        <h3>Saved reports for the current year:</h3>
        {data?.getAllReports.length ? (
          data.getAllReports.map((report) => (
            <div key={report.id}>
              <span>📄</span>
              <span
                className="view-line"
                onClick={() => handleDownloadPDF(report)}
              >
                Download report for {report.month}
              </span>
            </div>
          ))
        ) : (
          <p>No reports found.</p>
        )}
      </div>
      <SalesReport />
    
    </div>
  );
}
