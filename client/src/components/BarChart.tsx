import { ResponsiveBar } from "@nivo/bar";

interface Props {
  propsData?: any;
}
export default function BarChart({ propsData }: Props) {
  return (
    <div style={{ height: "400px" }}>
      <ResponsiveBar
        data={propsData[0]?.data || []}
        keys={["y"]}
        indexBy="x"
        margin={{ top: 50, right: 50, bottom: 80, left: 60 }}
        padding={0.3}
        layout="vertical"
        colors={{ scheme: "accent" }} // Or a function for custom coloring
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
              text: { fill: "#393030", fontSize: 12 },
            },
          },
          labels: { text: { fill: "#000", fontSize: 16 } },
          tooltip: {
            container: {
              background: "#f7f5f1",
              color: "#393030",
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
  );
}
