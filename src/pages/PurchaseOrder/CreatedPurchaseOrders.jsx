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
import { fetchPurchaseOrders, deletePurchaseOrder as deletePurchaseOrderApi } from "../../services/quotationApi";

export default function CreatedPurchaseOrders({ onNavigate }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const openPurchaseOrder = (row) => {
    const purchaseOrderData = row.data || row;
    const normalizedData = purchaseOrderData?.po
      ? purchaseOrderData
      : {
          po: purchaseOrderData,
          items: purchaseOrderData?.items || [],
          totals: purchaseOrderData?.totals || { totalPrice: purchaseOrderData?.totalAmount || 0 },
          id: purchaseOrderData?.id,
          poNo: purchaseOrderData?.poNo,
        };

    sessionStorage.setItem("purchaseOrderData", JSON.stringify(normalizedData));
    sessionStorage.setItem("purchaseOrderBackView", "created-purchase-orders");
    onNavigate("purchase-order");
  };

  const deletePurchaseOrder = async (id) => {
    try {
      await deletePurchaseOrderApi(id);
      setPurchaseOrders((prev) => prev.filter((po) => po.id !== id));
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
          onClick={() => {
            sessionStorage.setItem("purchaseOrderBackView", "created-purchase-orders");
            onNavigate("purchase-order-entry");
          }}
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
