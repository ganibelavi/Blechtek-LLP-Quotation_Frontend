import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";

export default function MachineUtilChart({ data }) {
  const chartData = (data || []).slice(0, 8).map((d) => {
    const machineName = d.machine ?? d.Machine ?? "";
    const shortMachine = machineName.length > 5 ? machineName.substring(0, 5) + "..." : machineName;
    return {
      machine: shortMachine,
      fullMachine: machineName,
      utilization: Number(d.utilization ?? d.Utilization ?? d.usage ?? d.Usage ?? d.count ?? d.Count ?? 0),
    };
  });

  if (chartData.length === 0) {
    return (
      <div style={{ width: "100%", height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        No machine utilization data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="horizontal" margin={{ top: 20, right: 18, left: 20, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          type="category"
          dataKey="machine"
          width={60}
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
        />
        <Label value="Machine" position="bottom" offset={38} fontSize={12} fill="#64748b" fontWeight={600} />
        <YAxis
          type="number"
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: "#e0e0e0" }}
          tickFormatter={(value) => `${value}%`}
        />
        <Label value="Utilization (%)" angle={-90} position="insideLeft" offset={-30} fontSize={12} fill="#64748b" fontWeight={600} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
          formatter={(value) => [`${value}%`, "Utilization"]}
          labelFormatter={(label) => {
            const item = chartData.find((d) => d.machine === label);
            return item ? item.fullMachine : label;
          }}
        />
        <Bar dataKey="utilization" radius={[4, 0, 0, 4]} barSize={20} fill="#607d8b" />
      </BarChart>
    </ResponsiveContainer>
  );
}