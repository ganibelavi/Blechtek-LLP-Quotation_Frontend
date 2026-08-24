import { Box, Stack, Typography } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function StatusPie({ data }) {
  const chartData = (data || [])
    .filter((d) => Number(d.count ?? d.Count ?? 0) > 0)
    .map((d, index) => ({
      name: d.status ?? d.Status ?? "Unknown",
      value: Number(d.count ?? d.Count ?? 0),
      color: STATUS_COLORS[index % STATUS_COLORS.length],
    }));

  if (chartData.length === 0) {
    return (
      <div style={{ width: "100%", height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        No status data available
      </div>
    );
  }

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Box sx={{ height: 290, display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: "center", flexWrap: "wrap" }}>
        {chartData.map((item) => {
          const pct = total ? Math.round((item.value / total) * 100) : 0;

          return (
            <Box key={item.name} sx={{ display: "flex", alignItems: "center", gap: 1, px: 0.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: item.color,
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                {item.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                ({pct}%)
              </Typography>
            </Box>
          );
        })}
      </Stack>

      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", minHeight: 220 }}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
              label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
              labelLine={false}
              stroke="#fff"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: 12,
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
              formatter={(value) => [value, "Quotes"]}
            />
          </PieChart>
        </ResponsiveContainer>

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Typography variant="h4" fontWeight={700} color="text.primary" lineHeight={1.1}>
            {total}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.8 }}>
            Total
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}