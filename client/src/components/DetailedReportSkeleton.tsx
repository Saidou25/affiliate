import "./DetailedReport.css";

export default function DetailedReportSkeleton() {
  return (
      <div className="detailed-report-container">
        {/* Title */}
        <div className="skel skel-title skel-shimmer" />

        {/* Month links */}
        <div className="view-line-div">
          <span className="skel skel-dot skel-shimmer" />
          <span className="skel skel-link skel-shimmer" />
        </div>
        <div className="view-line-div">
          <span className="skel skel-dot skel-shimmer" />
          <span className="skel skel-link skel-shimmer" />
        </div>
        <div className="view-line-div">
          <span className="skel skel-dot skel-shimmer" />
          <span className="skel skel-link skel-shimmer" />
        </div>

        {/* Table/card placeholder */}
        <div className="skel-card">
          <div className="skel skel-row skel-shimmer" />
          <div className="skel skel-row skel-shimmer" />
          <div className="skel skel-row skel-shimmer" />
          <div className="skel skel-row skel-shimmer" />
        </div>
      </div>
    );
}
