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

const readStoredPurchaseOrders = () => {
  try {
    const raw = sessionStorage.getItem("purchaseOrders");
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to read saved purchase orders", error);
    return [];
  }
};

export default function CreatedPurchaseOrders({ onNavigate }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPurchaseOrders = () => {
    try {
      setLoading(true);
      const rows = readStoredPurchaseOrders();
      setPurchaseOrders(rows);
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

  const openPurchaseOrder = (row) => {
    sessionStorage.setItem("purchaseOrderData", JSON.stringify(row.data || row));
    onNavigate("purchase-order");
  };

  const deletePurchaseOrder = (id) => {
    try {
      const next = readStoredPurchaseOrders().filter((po) => po.id !== id);
      sessionStorage.setItem("purchaseOrders", JSON.stringify(next));
      setPurchaseOrders(next);
    } catch (err) {
      setError("Unable to remove purchase order.");
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
    { key: "poNo", label: "PO No.", sortable: true, minWidth: 150 },
    { key: "buyerName", label: "Customer", sortable: true, minWidth: 180 },
    { key: "quotationRefNo", label: "Quotation No.", sortable: true, minWidth: 180 },
    { key: "poDate", label: "PO Date", sortable: true, minWidth: 140 },
    { key: "totalAmount", label: "Amount", sortable: true, minWidth: 140 },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      minWidth: 120,
      render: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Open PO">
            <IconButton size="small" onClick={() => openPurchaseOrder(row)}>
              <VisibilityIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete PO">
            <IconButton size="small" onClick={() => deletePurchaseOrder(row.id)}>
              <DeleteOutlineIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const rows = purchaseOrders.map((po) => ({
    id: po.id,
    poNo: po.poNo || "-",
    buyerName: po.buyerName || "-",
    quotationRefNo: po.quotationRefNo || "-",
    poDate: po.poDate || "-",
    totalAmount: po.totalAmount ? `₹${Number(po.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₹0.00",
    data: po.data || po,
  }));

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <h1 className="page-heading page-heading__text">Purchase Orders</h1>
        <Button
          variant="contained"
          onClick={() => onNavigate("purchase-order-entry")}
          sx={{ px: 3, py: 1 }}
        >
          New Purchase Order
        </Button>
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
    </Box>
  );
}
