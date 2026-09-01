import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EntityTable from "../../components/EntityTable";
import { fetchInvoices, deleteInvoice as deleteInvoiceApi } from "../../services/quotationApi";

export default function CreatedInvoices({ onNavigate }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const rows = await fetchInvoices();
      setInvoices(Array.isArray(rows) ? rows : []);
      setError(null);
    } catch (err) {
      setError("Unable to load saved invoices.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const openInvoice = (row) => {
    const invoiceData = row.data || row;
    const normalizedData = invoiceData?.invoice
      ? invoiceData
      : {
          invoice: invoiceData,
          items: invoiceData?.items || [],
          totals: invoiceData?.totals || { grandTotal: invoiceData?.totalAmount || 0 },
          id: invoiceData?.id,
          invoiceNo: invoiceData?.invoiceNo,
        };

    sessionStorage.setItem("invoiceData", JSON.stringify(normalizedData));
    sessionStorage.setItem("invoiceBackView", "created-invoices");
    onNavigate("invoice");
  };

  const deleteInvoice = async (id) => {
    try {
      await deleteInvoiceApi(id);
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== id));
    } catch (err) {
      setError("Unable to remove invoice.");
      console.error(err);
    }
  };

  const columns = [
    {
      key: "srNo",
      label: "Sr. No.",
      render: ({ index, page, rowsPerPage }) => page * rowsPerPage + index + 1,
      sortable: false,
      minWidth: 80,
    },
    { key: "invoiceNo", label: "Invoice No.", sortable: true, minWidth: 180 },
    { key: "receiverName", label: "Customer", sortable: true, minWidth: 180 },
    { key: "companyName", label: "Company", sortable: true, minWidth: 180 },
    { key: "dateOfIssue", label: "Invoice Date", sortable: true, minWidth: 150 },
    { key: "poNoDate", label: "PO Ref.", sortable: true, minWidth: 180 },
    {
      key: "totalAmount",
      label: "Amount",
      sortable: true,
      minWidth: 150,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      minWidth: 120,
      render: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Open Invoice">
            <IconButton size="small" onClick={() => openInvoice(row)}>
              <VisibilityIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Invoice">
            <IconButton size="small" onClick={() => deleteInvoice(row.id)}>
              <DeleteOutlineIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const rows = invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNo: invoice.invoice?.invoiceNo || invoice.invoiceNo || "-",
    receiverName: invoice.invoice?.receiverName || invoice.receiverName || "-",
    companyName: invoice.invoice?.companyName || invoice.companyName || "-",
    dateOfIssue: invoice.invoice?.dateOfIssue || invoice.dateOfIssue || "-",
    poNoDate: invoice.invoice?.poNoDate || invoice.poNoDate || "-",
    totalAmount: invoice.totals?.grandTotal
      ? `₹${Number(invoice.totals.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "₹0.00",
    data: invoice.data || invoice,
  }));

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <h1 className="page-heading page-heading__text">GST Invoices</h1>
        <Button
          variant="contained"
          onClick={() => {
            sessionStorage.setItem("invoiceBackView", "created-invoices");
            onNavigate("invoice-entry");
          }}
          sx={{ px: 3, py: 1 }}
        >
          New Invoice
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <Typography>Loading invoices...</Typography>
        </Box>
      ) : (
        <EntityTable title="" columns={columns} rows={rows} />
      )}
    </Box>
  );
}
