import { useEffect, useState } from "react";
import {
  fetchDashboardData,
  fetchPurchaseOrders,
  fetchInvoices,
} from "../services/quotationApi";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import DataCard from "../components/DataCard";
import TrendChart from "../components/TrendChart";
import UserQuotationBar from "../components/UserQuotationBar";
import StatusPie from "../components/StatusPie";
import ModuleBar from "../components/ModuleBar";
import TopOrganizationsBar from "../components/TopOrganizationsBar";
import MachineUtilChart from "../components/MachineUtilChart";
import EntityTable, { StatusText } from "../components/EntityTable";

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  if (!value) return "0";
  return `${Number(value).toLocaleString("en-IN")}`;
}

function getNumericValue(value) {
  if (value === null || value === undefined || value === "") return 0;
  const asNumber = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(asNumber) ? asNumber : 0;
}

function getNestedValue(record, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], record);
}

function buildMonthlyTrend(entries, dateKeys, amountKeys) {
  const grouped = new Map();

  (entries || []).forEach((entry) => {
    const rawDate = dateKeys
      .map((key) => getNestedValue(entry, key))
      .find((value) => value !== null && value !== undefined && value !== "");

    if (!rawDate) return;

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return;

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleString("en-US", {
      month: "short",
      year: "2-digit",
    });

    const amount = amountKeys
      .map((key) => getNestedValue(entry, key))
      .reduce((sum, value) => sum + getNumericValue(value), 0);

    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, { month: monthLabel, revenue: 0, count: 0 });
    }

    const current = grouped.get(monthKey);
    current.revenue += amount;
    current.count += 1;
  });

  return [...grouped.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export default function DashboardPage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashboardResult, poRows, invoiceRows] = await Promise.all([
        fetchDashboardData(),
        fetchPurchaseOrders(),
        fetchInvoices(),
      ]);
      setData(dashboardResult);
      setPurchaseOrders(Array.isArray(poRows) ? poRows : []);
      setInvoices(Array.isArray(invoiceRows) ? invoiceRows : []);
      setError(null);
    } catch (err) {
      setError(
        "Failed to load dashboard data. Please check if the backend is running.",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");

  const monthlyOptions = (data?.monthlyQuotes || []).map((item) => {
    const monthLabel = item.month ?? item.Month ?? "";
    const match = monthLabel.match(/^([A-Za-z]{3})\s+(\d{4})$/);
    if (match) {
      return { label: monthLabel, month: match[1], year: match[2] };
    }

    const date = new Date(monthLabel);
    if (!Number.isNaN(date.getTime())) {
      return {
        label: date.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        }),
        month: date.toLocaleString("en-US", { month: "short" }),
        year: String(date.getFullYear()),
      };
    }

    return { label: monthLabel, month: monthLabel, year: "" };
  });

  const availableYears = [
    ...new Set(
      monthlyOptions.filter((item) => item.year).map((item) => item.year),
    ),
  ].sort();
  const filteredMonthlyData = (data?.monthlyQuotes || []).filter((item) => {
    const monthLabel = item.month ?? item.Month ?? "";
    const match = monthLabel.match(/^([A-Za-z]{3})\s+(\d{4})$/);
    const month = match ? match[1] : "";
    const year = match ? match[2] : "";

    const matchesYear = selectedYear === "all" || year === selectedYear;
    const matchesMonth = selectedMonth === "all" || month === selectedMonth;
    return matchesYear && matchesMonth;
  });

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }} onClose={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Typography sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
        No dashboard data available
      </Typography>
    );
  }

  const statCards = [
    {
      label: "Total Quotations",
      value: data.totalQuotations ?? 0,
      icon: <img src="/logo/report.png" alt="Total Quotations" style={{ width: 28, height: 28 }} />,
      color: "primary",
    },
    {
      label: "Organizations",
      value: data.totalOrganizations ?? 0,
      icon: <img src="/logo/industry.png" alt="Organizations" style={{ width: 28, height: 28 }} />,
      color: "secondary",
    },
    {
      label: "Modules",
      value: data.totalModules ?? 0,
      icon: <img src="/logo/report.png" alt="Modules" style={{ width: 28, height: 28 }} />,
      color: "primary",
    },
    {
      label: "Quotation Value",
      value: formatCurrency(data.totalQuotedAmount ?? 0),
      icon: <img src="/logo/speedometer.png" alt="Quotation Value" style={{ width: 28, height: 28 }} />,
      color: "primary",
    },
    // {
    //   label: "Active Pipeline",
    //   value:
    //     data.statusBreakdown?.find((s) => s.status === "Valid")?.count ?? 0,
    //   icon: <img src="/logo/users.png" alt="Active Pipeline" style={{ width: 28, height: 28 }} />,
    //   color: "primary",
    // },
  ];

  const totalPurchaseOrderValue = purchaseOrders.reduce((sum, order) => {
    const amount =
      getNumericValue(order.totalAmount) ||
      getNumericValue(order.totals?.grandTotal) ||
      getNumericValue(order.totals?.totalPrice) ||
      getNumericValue(order.amount);
    return sum + amount;
  }, 0);

  const totalInvoiceValue = invoices.reduce((sum, invoice) => {
    const amount =
      getNumericValue(invoice.totalAmount) ||
      getNumericValue(invoice.totals?.grandTotal) ||
      getNumericValue(invoice.totals?.totalPrice) ||
      getNumericValue(invoice.amount);
    return sum + amount;
  }, 0);

  const poInvoiceCards = [
    {
      label: "Total Purchase Orders",
      value: purchaseOrders.length,
      icon: <img src="/logo/clipboard.png" alt="Total Purchase Orders" style={{ width: 28, height: 28 }} />,
      color: "info",
    },
    {
      label: "Purchase Order Value",
      value: `₹${formatCurrency(totalPurchaseOrderValue)}`,
      icon: <img src="/logo/report.png" alt="Purchase Order Value" style={{ width: 28, height: 28 }} />,
      color: "info",
    },
    {
      label: "Total Invoices",
      value: invoices.length,
      icon: <img src="/logo/calculator.png" alt="Total Invoices" style={{ width: 28, height: 28 }} />,
      color: "info",
    },
    {
      label: "Invoice Value",
      value: `₹${formatCurrency(totalInvoiceValue)}`,
      icon: <img src="/logo/speedometer.png" alt="Invoice Value" style={{ width: 28, height: 28 }} />,
      color: "info",
    },
  ];

  const poMonthlyTrend = buildMonthlyTrend(
    purchaseOrders,
    ["poDate", "dateOfIssue", "generatedAt", "createdAt"],
    ["totalAmount", "totals.grandTotal", "totals.totalPrice", "amount"],
  );

  const invoiceMonthlyTrend = buildMonthlyTrend(
    invoices,
    ["dateOfIssue", "poDate", "generatedAt", "createdAt"],
    ["totalAmount", "totals.grandTotal", "totals.totalPrice", "amount"],
  );

  const recentColumns = [
    {
      key: "srNo",
      label: "Sr. No.",
      sortable: false,
      minWidth: 70,
      render: ({ index, page, rowsPerPage }) => page * rowsPerPage + index + 1,
    },
    {
      key: "quotationNo",
      label: "Quotation No.",
      sortable: true,
      minWidth: 180,
      render: ({ row }) => (
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ fontFamily: "monospace", fontSize: 12 }}
        >
          {row.quotationNo}
        </Typography>
      ),
    },
    {
      key: "organizationName",
      label: "Customer Name",
      sortable: true,
      minWidth: 200,
    },
    {
      key: "modules",
      label: "Modules",
      sortable: false,
      minWidth: 250,
      render: ({ row }) => (
        <Typography
          variant="body2"
          sx={{
            maxWidth: 300,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.modules}
        </Typography>
      ),
    },
    {
      key: "generatedAt",
      label: "Date",
      sortable: true,
      minWidth: 160,
      render: ({ row }) => formatDateTime(row.generatedAt),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      minWidth: 120,
      render: ({ row }) => <StatusText status={row.status} />,
    },
    {
      key: "valuation",
      label: "Valuation",
      sortable: true,
      minWidth: 140,
      render: ({ row }) => formatCurrency(row.valuation),
    },
    {
      key: "totalQuotedAmount",
      label: "Quotation Value",
      sortable: true,
      minWidth: 140,
      render: ({ row }) => formatCurrency(row.totalQuotedAmount),
    },
  ];

  const recentRows = (data.recentQuotations || []).map((q) => ({
    quotationNo: q.quotationNo || q.quotationId,
    organizationName: q.organizationName,
    modules: q.modules?.join(", ") || "—",
    generatedAt: q.generatedAt,
    status: q.status || "Draft",
    valuation: q.valuation || 0,
    totalQuotedAmount: q.totalQuotedAmount || 0,
  }));

  const chartContainerStyle = {
    elevation: 0,
    sx: {
      p: { xs: 2, md: 3 },
      borderRadius: 1,
      border: "1px solid",
      borderColor: "divider",
      overflow: "hidden",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      minHeight: 350,
    },
  };

  return (
    <Box
      sx={{
        p: 0,
        fontSize: "13px",
        overflow: "visible",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        {/* <Box>
          <Typography variant="h4" fontWeight={900} gutterBottom>
            Dashboard
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ opacity: 0.8 }}
          >
            Real-time insights and quotation analytics
          </Typography>
        </Box> */}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 3,
          mb: 4,
        }}
      >
        {statCards.map((card, index) => (
          <DataCard key={index} {...card} borderRadius={2} />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 3,
          mb: 4,
        }}
      >
        {poInvoiceCards.map((card, index) => (
          <DataCard key={`po-invoice-${index}`} {...card} borderRadius={2} />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
          gap: 3,
          alignItems: "stretch",
          mb: 4,
        }}
      >
        <Paper {...chartContainerStyle}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            Purchase Order Trend
          </Typography>
          <Box sx={{ flex: 1, minHeight: 300 }}>
            <TrendChart data={poMonthlyTrend} />
          </Box>
        </Paper>

        <Paper {...chartContainerStyle}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            Invoice Trend
          </Typography>
          <Box sx={{ flex: 1, minHeight: 300 }}>
            <TrendChart data={invoiceMonthlyTrend} />
          </Box>
        </Paper>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" },
          gap: 3,
          alignItems: "stretch",
          mb: 4,
        }}
      >
        <Paper {...chartContainerStyle}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            Quotation Creation by User
          </Typography>
          <Box sx={{ flex: 1, minHeight: 300 }}>
            <UserQuotationBar data={data.userQuotationStats ?? []} />
          </Box>
        </Paper>

        <Paper {...chartContainerStyle}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              mb: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="h6" fontWeight={700}>
              Monthly Quotation Trend
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="trend-month-label">Month</InputLabel>
                <Select
                  labelId="trend-month-label"
                  value={selectedMonth}
                  label="Month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <MenuItem value="all">All Months</MenuItem>
                  {Array.from(
                    new Set(
                      monthlyOptions.map((item) => item.month).filter(Boolean),
                    ),
                  ).map((month) => (
                    <MenuItem key={month} value={month}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel id="trend-year-label">Year</InputLabel>
                <Select
                  labelId="trend-year-label"
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <MenuItem value="all">All Years</MenuItem>
                  {availableYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box sx={{ flex: 1, minHeight: 300 }}>
            <TrendChart data={filteredMonthlyData} />
          </Box>
        </Paper>

        <Paper {...chartContainerStyle}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            Quotation Status
          </Typography>
          <Box
            sx={{
              flex: 1,
              minHeight: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <StatusPie data={data.statusBreakdown ?? []} />
          </Box>
        </Paper>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 3,
          alignItems: "stretch",
          // mb: 4,
        }}
      >
        <Paper {...chartContainerStyle}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            Top Modules by Usage
          </Typography>
          <Box sx={{ flex: 1, minHeight: 300 }}>
            <ModuleBar data={data.moduleDistribution ?? []} />
          </Box>
        </Paper>

        <Paper {...chartContainerStyle}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            Top Organizations
          </Typography>
          <Box sx={{ flex: 1, minHeight: 300 }}>
            <TopOrganizationsBar data={data.topOrganizations ?? []} />
          </Box>
        </Paper>

        <Paper {...chartContainerStyle}>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            Machine Utilization
          </Typography>
          <Box sx={{ flex: 1, minHeight: 300 }}>
            <MachineUtilChart data={data.machineUtilization ?? []} />
          </Box>
        </Paper>
      </Box>

      <Stack spacing={1.5} sx={{ mt: 2 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
          Recent Quotations
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 0,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          <EntityTable title="" columns={recentColumns} rows={recentRows} />
        </Paper>
      </Stack>
    </Box>
  );
}
