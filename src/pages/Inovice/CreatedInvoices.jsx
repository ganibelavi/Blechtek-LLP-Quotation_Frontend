import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import EntityTable from "../../components/EntityTable";
import { fetchInvoices, deleteInvoice as deleteInvoiceApi } from "../../services/quotationApi";
import {
  dialogPrimaryActionSx,
  dialogSecondaryActionSx,
} from "../../styles/modalActionButtonStyles";

export default function CreatedInvoices({ onNavigate }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

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

  const handleRemoveInvoice = (row) => {
    setInvoiceToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleConfirmRemoveInvoice = async () => {
    if (!invoiceToDelete) return;

    try {
      await deleteInvoiceApi(invoiceToDelete.id);
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== invoiceToDelete.id));
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    } catch (err) {
      setError("Unable to remove invoice.");
      console.error(err);
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
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
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Invoice">
            <IconButton size="small" onClick={() => handleRemoveInvoice(row)}>
              <DeleteIcon fontSize="small" />
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

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
        sx={{
          "& .MuiDialog-container": {
            alignItems: "flex-start",
            paddingTop: "1vh",
          },
        }}
        PaperProps={{ sx: { borderRadius: 1 } }}
      >
        <DialogTitle
          sx={{
            color: "white",
            background: "linear-gradient(120deg, #308aea 0%, #48cae4 100%)",
            py: 1.5,
          }}
        >
          Confirm Delete Invoice
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1, fontSize: "14px" }}>
            Are you sure you want to delete the invoice{" "}
            <strong>
              {invoiceToDelete ? `Invoice No. ${invoiceToDelete.invoiceNo || invoiceToDelete.id}` : ""}
            </strong>
            ? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            sx={dialogSecondaryActionSx}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemoveInvoice}
            variant="contained"
            sx={dialogPrimaryActionSx}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
