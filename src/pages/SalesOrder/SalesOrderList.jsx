import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EntityTable from "../../components/EntityTable";
import { fetchCustomers } from "../../services/quotationApi";
import { fetchSalesOrders } from "../../services/salesOrderApi";
import "./SalesOrder.css";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "-";

const statusColor = (status) => ({
  Confirmed: "success",
  PartiallyInvoiced: "warning",
  Invoiced: "info",
  Cancelled: "error",
  OnHold: "default",
  PendingVerification: "warning",
}[status] || "default");

export default function SalesOrderList({ onNavigate }) {
  const [result, setResult] = useState({ items: [], totalCount: 0, totalPages: 0 });
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({ status: "", customerId: "", fromDate: "", toDate: "", search: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSalesOrders({
        page,
        pageSize,
        status: filters.status || undefined,
        customerId: filters.customerId || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        search: filters.search.trim() || undefined,
      });
      setResult({
        items: data.items ?? data.Items ?? [],
        totalCount: data.totalCount ?? data.TotalCount ?? 0,
        totalPages: data.totalPages ?? data.TotalPages ?? 0,
      });
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to load sales orders.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    fetchCustomers().then(setCustomers).catch(() => setError("Unable to load customers."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeFilter = (name) => (event) => {
    setPage(1);
    setFilters((current) => ({ ...current, [name]: event.target.value }));
  };

  return (
    <Box className="sales-order-list-page">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <Box>
          <Typography variant="h5">Sales Orders</Typography>
          <Typography color="text.secondary">{result.totalCount} total</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => onNavigate("sales-orders/new")}>
          Create from PO
        </Button>
      </Box>

      <Box className="sales-order-list-page__filters" sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="so-status-label">Status</InputLabel>
          <Select labelId="so-status-label" label="Status" value={filters.status} onChange={changeFilter("status")}>
            <MenuItem value="">All statuses</MenuItem>
            {["Draft", "PendingVerification", "Confirmed", "PartiallyInvoiced", "Invoiced", "OnHold", "Cancelled"].map((status) => (
              <MenuItem key={status} value={status}>{status.replace(/([A-Z])/g, " $1").trim()}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="so-customer-label">Customer</InputLabel>
          <Select labelId="so-customer-label" label="Customer" value={filters.customerId} onChange={changeFilter("customerId")}>
            <MenuItem value="">All customers</MenuItem>
            {customers.map((customer) => (
              <MenuItem key={customer.id ?? customer.Id} value={customer.id ?? customer.Id}>
                {customer.name ?? customer.Name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="From date"
          type="date"
          value={filters.fromDate}
          onChange={changeFilter("fromDate")}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          size="small"
          label="To date"
          type="date"
          value={filters.toDate}
          onChange={changeFilter("toDate")}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <EntityTable
        loading={loading}
        title=""
        columns={[
          {
            key: "srNo",
            label: "Sr. No.",
            sortable: false,
            minWidth: 80,
            render: ({ index, page: currentPage, rowsPerPage }) =>
              currentPage * rowsPerPage + index + 1,
          },
          { key: "soNumber", label: "SO No.", sortable: true, minWidth: 170 },
          { key: "soDate", label: "SO Date", sortable: true, minWidth: 130 },
          { key: "customerName", label: "Customer", sortable: true, minWidth: 180 },
          { key: "purchaseOrderNo", label: "PO No.", sortable: true, minWidth: 150 },
          { key: "grandTotal", label: "Grand Total", sortable: true, minWidth: 145 },
          { key: "invoicedAmount", label: "Invoiced", sortable: true, minWidth: 135 },
          { key: "balanceToInvoice", label: "Balance to Invoice", sortable: true, minWidth: 155 },
          {
            key: "status",
            label: "Status",
            sortable: true,
            minWidth: 165,
            render: ({ row }) => (
              <Chip
                label={row.statusLabel}
                color={statusColor(row.status)}
                size="small"
                variant="outlined"
              />
            ),
          },
          {
            key: "actions",
            label: "Actions",
            sortable: false,
            minWidth: 110,
            render: ({ row }) => (
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                <Tooltip title="View sales order">
                  <IconButton
                    size="small"
                    onClick={() => onNavigate(`sales-orders/${row.id}/edit`)}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {["Draft", "PendingVerification"].includes(row.status) && (
                  <Tooltip title="Edit sales order">
                    <IconButton
                      size="small"
                      onClick={() => onNavigate(`sales-orders/${row.id}/edit`)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            ),
          },
        ]}
        rows={result.items.map((row) => {
          const grandTotal = row.grandTotal ?? row.GrandTotal;
          const invoiced = row.invoicedAmount ?? row.InvoicedAmount;
          const status = row.status ?? row.Status ?? "";
          return {
            id: row.id ?? row.Id,
            soNumber: row.soNumber ?? row.SoNumber ?? "-",
            soDate: formatDate(row.soDate ?? row.SoDate),
            customerName: row.customerName ?? row.CustomerName ?? "-",
            purchaseOrderNo: row.purchaseOrderNo ?? row.PurchaseOrderNo ?? "-",
            grandTotal: formatCurrency(grandTotal),
            invoicedAmount: formatCurrency(invoiced),
            balanceToInvoice: formatCurrency(
              Math.max(Number(grandTotal || 0) - Number(invoiced || 0), 0),
            ),
            status,
            statusLabel: status.replace(/([A-Z])/g, " $1").trim(),
          };
        })}
        searchValue={filters.search}
        onSearchChange={(search) => {
          setPage(1);
          setFilters((current) => ({ ...current, search }));
        }}
        serverPagination={{
          page,
          pageSize,
          totalCount: result.totalCount,
          totalPages: result.totalPages,
          onPageChange: setPage,
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          },
        }}
      />
    </Box>
  );
}
