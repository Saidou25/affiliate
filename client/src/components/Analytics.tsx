import TotalSales from "./TotalSales";
import TotalClick from "./TotalClicks";
import TotalCommissions from "./TotalCommissions";
import { useSalesTracker } from "../hooks/useSalesTracker";
import { useCommissionsTracker } from "../hooks/useCommissionsTracker";
import { useClicksTracker } from "../hooks/useClicksTracker";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";

import "./Analytics.css";

export default function Analytics() {
  const { data } = useQuery(QUERY_ME);
  const me = data?.me || {};

  const { commissionPerDay } = useCommissionsTracker();

  const { totalSales } = useSalesTracker(me?.refId);

  const { clicksPerDay } = useClicksTracker();

  if (
    (totalSales === 0 || totalSales === undefined) &&
    !clicksPerDay[0]?.data?.length &&
    !commissionPerDay[0]?.data?.length
  ) {
    return (
      <div className="empty-state">
        {/* <img src="https://cdn.pixabay.com/photo/2016/03/31/20/53/analytics-1294847_1280.png"  alt="No reports" /> */}
        <h3>No Analytics Available</h3>
        <p>
          Once you start generating clicks and sales, analytics will appear
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="container-fluid g-0 p-0 m-0">
      <div className="row">
        <div className="col-12 col-md-12 col-lg-12 col-xl-6">
          <TotalClick />
        </div>
        <div className="col-12 col-md-12 col-lg-12 col-xl-6">
          <TotalSales />
        </div>
        <div className="col-12">
          <TotalCommissions />
        </div>
        <br />
      </div>
    </div>
  );
}
