import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../utils/queries";
import { useClickTracker } from "../hooks/useClickTracker";
import { ResponsiveBar } from "@nivo/bar";

export default function TotalClick() {
  const { data: meData } = useQuery(QUERY_ME);
  const me = meData?.me || {};

  const clickPerDay = useClickTracker();
  return (
    <>
      <h2>Total Clicks:</h2>
      {me.totalClicks && (
        <>
          <strong>total clicks - </strong>
          {me.totalClicks}
          <br />
          <br />
        </>
      )}
      <div className="res">
        <ResponsiveBar
          data={clickPerDay[0]?.data || []}
          keys={["y"]}
          indexBy="x"
          margin={{ top: 50, right: 50, bottom: 80, left: 60 }}
          padding={0.3}
          layout="vertical"
          colors={{ scheme: "category10" }} // Or a function for custom coloring
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: "Date",
            legendPosition: "middle",
            legendOffset: 50,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            legend: "Sales",
            legendPosition: "middle",
            legendOffset: -50,
          }}
          theme={{
            axis: {
              domain: { line: { stroke: "#777777", strokeWidth: 1 } },
              ticks: {
                line: { stroke: "#777777", strokeWidth: 1 },
                text: { fill: "#f3efef", fontSize: 12 },
              },
            },
            labels: { text: { fill: "#000", fontSize: 16 } },
            tooltip: {
              container: {
                background: "#f0da9c",
                color: "#fff",
                fontSize: 13,
                borderRadius: 4,
                padding: 10,
              },
            },
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          animate={true}
          motionConfig="gentle"
        />
      </div>
    </>
  );
}
