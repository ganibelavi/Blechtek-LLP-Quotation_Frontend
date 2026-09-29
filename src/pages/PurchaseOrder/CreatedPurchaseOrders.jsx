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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Input,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import EntityTable from "../../components/EntityTable";
import {
  fetchPurchaseOrders,
  deletePurchaseOrder as deletePurchaseOrderApi,
} from "../../services/quotationApi";
import {
  dialogPrimaryActionSx,
  dialogSecondaryActionSx,
} from "../../styles/modalActionButtonStyles";

const STATUS_LABEL = {
  open: "Open",
  partially_fulfilled: "Partially fulfilled",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const STATUS_COLOR = {
  open: "info",
  partially_fulfilled: "warning",
  fulfilled: "success",
  cancelled: "error",
};

const VERIFICATION_STATUS_LABEL = {
  Draft: "Draft",
  PendingReview: "Pending Review",
  Approved: "Approved",
  ApprovedWithMismatch: "Approved with Mismatch",
  Rejected: "Rejected",
};

const VERIFICATION_STATUS_COLOR = {
  Draft: "default",
  PendingReview: "warning",
  Approved: "success",
  ApprovedWithMismatch: "warning",
  Rejected: "error",
};

export default function CreatedPurchaseOrders({ onNavigate }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] = useState(null);
  const [verificationFilter, setVerificationFilter] = useState("all");

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      const rows = await fetchPurchaseOrders();
      setPurchaseOrders(Array.isArray(rows) ? rows : []);
      setError(null);
    } catch (err) {
      setError("Unable to load saved purchase orders.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const openPurchaseOrder = (row, viewOnly = true) => {
    const purchaseOrderData = row.data || row;
    sessionStorage.setItem("purchaseOrderBackView", "created-purchase-orders");
    sessionStorage.setItem("purchaseOrderId", String(purchaseOrderData.id));
    if (viewOnly) {
      sessionStorage.setItem("purchaseOrderViewOnly", "true");
    } else {
      sessionStorage.removeItem("purchaseOrderViewOnly");
    }
    onNavigate("purchase-order-entry");
  };

  const openVerification = (row) => {
    const purchaseOrderData = row.data || row;
    sessionStorage.setItem("purchaseOrderBackView", "created-purchase-orders");
    sessionStorage.setItem("purchaseOrderId", String(purchaseOrderData.id));
    onNavigate("po-verification");
  };

  const handleRemovePurchaseOrder = (row) => {
    setPurchaseOrderToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleConfirmRemovePurchaseOrder = async () => {
    if (!purchaseOrderToDelete) return;

    try {
      await deletePurchaseOrderApi(purchaseOrderToDelete.id);
      setPurchaseOrders((prev) =>
        prev.filter((po) => po.id !== purchaseOrderToDelete.id),
      );
      setDeleteDialogOpen(false);
      setPurchaseOrderToDelete(null);
    } catch (err) {
      setError("Unable to remove purchase order.");
      console.error(err);
      setDeleteDialogOpen(false);
      setPurchaseOrderToDelete(null);
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPurchaseOrderToDelete(null);
  };

  const filteredPurchaseOrders = purchaseOrders.filter((po) => {
    if (verificationFilter === "all") return true;
    return po.verificationStatus === verificationFilter;
  });

  const columns = [
    {
      key: "srNo",
      label: "Sr. No.",
      render: ({ index, page, rowsPerPage }) => page * rowsPerPage + index + 1,
      sortable: false,
      minWidth: 80,
    },
    { key: "poNo", label: "PO No.", sortable: true, minWidth: 150 },
    { key: "buyerName", label: "Customer", sortable: true, minWidth: 180 },
    {
      key: "quotationRefNo",
      label: "Quotation No.",
      sortable: true,
      minWidth: 180,
    },
    { key: "poDate", label: "PO Date", sortable: true, minWidth: 140 },
    {
      key: "status",
      label: "PO Status",
      sortable: true,
      minWidth: 150,
      render: ({ row }) => {
        const status = String(row.status || "open").toLowerCase();
        return (
          <Chip
            label={STATUS_LABEL[status] || status}
            color={STATUS_COLOR[status] || "default"}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      key: "verificationStatus",
      label: "Verification",
      sortable: true,
      minWidth: 180,
      render: ({ row }) => {
        const vStatus = row.verificationStatus || "Draft";
        return (
          <Chip
            label={VERIFICATION_STATUS_LABEL[vStatus] || vStatus}
            color={VERIFICATION_STATUS_COLOR[vStatus] || "default"}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    { key: "totalAmount", label: "Amount", sortable: true, minWidth: 140 },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      minWidth: 160,
      render: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          <Tooltip title="Open PO">
            <IconButton
              size="small"
              onClick={() => openPurchaseOrder(row, true)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit PO">
            <IconButton
              size="small"
              onClick={() => openPurchaseOrder(row, false)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Verify PO">
            <IconButton size="small" onClick={() => openVerification(row)}>
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete PO">
            <IconButton
              size="small"
              onClick={() => handleRemovePurchaseOrder(row)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const rows = filteredPurchaseOrders.map((po) => ({
    id: po.id,
    poNo: po.poNo || "-",
    buyerName: po.organizationName || po.companyName || po.buyerName || "-",
    quotationRefNo: po.quotationRefNo || "-",
    poDate: po.poDate || "-",
    status: po.status || "open",
    verificationStatus: po.verificationStatus || "Draft",
    totalAmount: po.totalAmount
      ? `₹${Number(po.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "₹0.00",
    data: po.data || po,
  }));

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <h1 className="page-heading page-heading__text">Purchase Orders</h1>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="verification-filter-label">
              Verification Status
            </InputLabel>
            <Select
              labelId="verification-filter-label"
              value={verificationFilter}
              label="Verification Status"
              onChange={(e) => setVerificationFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="Draft">Draft</MenuItem>
              <MenuItem value="PendingReview">Pending Review</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="ApprovedWithMismatch">
                Approved with Mismatch
              </MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Create purchase order">
            <IconButton
              color="primary"
              aria-label="Create purchase order"
              onClick={() => {
                sessionStorage.removeItem("purchaseOrderId");
                sessionStorage.removeItem("purchaseOrderViewOnly");
                sessionStorage.setItem(
                  "purchaseOrderBackView",
                  "created-purchase-orders",
                );
                onNavigate("purchase-order-entry");
              }}
              sx={{
                bgcolor: "primary.main",
                color: "common.white",
                borderRadius: 1,
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <Typography>Loading purchase orders...</Typography>
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
          Confirm Delete Purchase Order
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1, fontSize: "14px" }}>
            Are you sure you want to delete the purchase order{" "}
            <strong>
              {purchaseOrderToDelete
                ? `PO No. ${purchaseOrderToDelete.poNo || purchaseOrderToDelete.id}`
                : ""}
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
            onClick={handleConfirmRemovePurchaseOrder}
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
