import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Skeleton,
} from "@mui/material";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import { fetchPoFile } from "../services/quotationApi";

const FileViewer = ({ poId, fileName, contentType }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imgRef = useRef(null);
  const iframeRef = useRef(null);

  const isImage = contentType?.startsWith("image/");
  const isPdf = contentType === "application/pdf";
  const hasFileMetadata = !!(fileName || contentType);

  useEffect(() => {
    if (!poId || !hasFileMetadata) {
      return;
    }

    let mounted = true;
    let timeoutId;

    const loadFile = async () => {
      setLoading(true);
      setError(null);

      timeoutId = setTimeout(() => {
        if (mounted) {
          console.error('File fetch timeout');
          setError("Request timed out. No file found or server not responding.");
          setLoading(false);
        }
      }, 15000);

      try {
        const blob = await fetchPoFile(poId);
        if (!mounted) return;
        clearTimeout(timeoutId);
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err) {
        console.error("Failed to load file:", err);
        if (!mounted) return;
        clearTimeout(timeoutId);
        let errorMessage = "Failed to load the uploaded file. Please try again.";
        if (err.response) {
          if (err.response.status === 404) {
            errorMessage = "No file uploaded for this purchase order.";
          } else if (err.response.status === 401) {
            errorMessage = "Authentication required. Please log in again.";
          } else if (err.response.status === 403) {
            errorMessage = "Access denied.";
          } else {
            errorMessage = `Error: ${err.response.status} ${err.response.statusText}`;
          }
        } else if (err.request) {
          errorMessage = "Network error. Please check your connection.";
        } else if (err.message) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        if (mounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    loadFile();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [poId, hasFileMetadata]);

  useEffect(() => {
    if (isFullscreen && imgRef.current) {
      imgRef.current.requestFullscreen?.().catch(() => {});
    } else if (!isFullscreen && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [isFullscreen]);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.25));
  const handleResetZoom = () => setScale(1);
  const handleFullscreenToggle = () => setIsFullscreen((f) => !f);

  const toolbar = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1,
        bgcolor: "grey.100",
        borderBottom: "1px solid",
        borderColor: "grey.300",
        flexWrap: "wrap",
      }}
    >
      <Typography
        variant="body2"
        color="text.primary"
        sx={{
          flexGrow: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {fileName || "Uploaded document"}
      </Typography>
      {isImage && (
        <>
          <Tooltip title="Zoom in">
            <IconButton size="small" onClick={handleZoomIn} disabled={scale >= 3}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom out">
            <IconButton size="small" onClick={handleZoomOut} disabled={scale <= 0.25}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset zoom">
            <IconButton size="small" onClick={handleResetZoom} disabled={scale === 1}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {Math.round(scale * 100)}%
              </Typography>
            </IconButton>
          </Tooltip>
        </>
      )}
      <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
        <IconButton size="small" onClick={handleFullscreenToggle}>
          {isFullscreen ? <CloseFullscreenIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Box>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: "300px",
            bgcolor: "grey.50",
          }}
        >
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading document...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert
          severity="error"
          sx={{
            width: "100%",
            minHeight: "300px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 2,
            p: 3,
          }}
        >
          <Typography variant="body1" gutterBottom>{error}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
            File: {fileName || "Unknown"} | Type: {contentType || "Unknown"} | PO ID: {poId}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Alert>
      );
    }

    if (!blobUrl && !hasFileMetadata) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: "300px",
            bgcolor: "grey.50",
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "grey.300",
            p: 3,
          }}
        >
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No file uploaded for this purchase order
          </Typography>
          <Typography variant="caption" color="text.secondary">
            PO ID: {poId || "Not specified"}
          </Typography>
        </Box>
      );
    }

    if (!blobUrl) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: "300px",
            bgcolor: "grey.50",
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "grey.300",
            p: 3,
          }}
        >
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No file available
          </Typography>
          <Typography variant="caption" color="text.secondary">
            File: {fileName || "Not specified"} | Type: {contentType || "Not specified"} | PO ID: {poId || "Not specified"}
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </Box>
      );
    }

    if (isImage) {
      return (
        <img
          ref={imgRef}
          src={blobUrl}
          alt={fileName || "Uploaded PO document"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            transition: "transform 0.1s ease",
          }}
        />
      );
    }

    if (isPdf) {
      return (
        <iframe
          ref={iframeRef}
          src={blobUrl}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            background: "#fff",
            overflow: "hidden",
          }}
          scrolling="no"
          title={fileName || "Uploaded PO document"}
        />
      );
    }

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Unsupported file type: {contentType}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This file type cannot be previewed inline.
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "500px",
        border: "1px solid",
        borderColor: "grey.300",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "white",
      }}
    >
      {toolbar}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: isImage ? "auto" : "hidden",
          bgcolor: isImage ? "#f5f5f5" : "white",
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default FileViewer;