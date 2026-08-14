import React from "react";
import { Snackbar, Alert, IconButton, Portal } from "@mui/material";
import { Close } from "@mui/icons-material";

export default function CustomSnackbar({
  open,
  onClose,
  severity = "success",
  message,
  autoHideDuration = 6000,
  anchorOrigin = { vertical: "top", horizontal: "right" },
}) {
  const container = typeof document !== "undefined" ? document.body : undefined;

  return (
    <Portal container={container}>
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={onClose}
        anchorOrigin={anchorOrigin}
        sx={{
          position: "fixed",
          zIndex: 16000,
          top: "24px",
          right: "24px",
        }}
        ContentProps={{
          "aria-describedby": "snackbar-message",
        }}
      >
        <Alert
          id="snackbar-message"
          severity={severity}
          onClose={onClose}
          variant="filled"
          sx={{
            minWidth: 300,
            maxWidth: 450,
            boxShadow: 3,
            borderRadius: 1,
            backgroundColor:
              severity === "success"
                ? "#4caf50"
                : severity === "error"
                  ? "#6c757d"
                  : severity === "warning"
                    ? "#ff9800"
                    : severity === "info"
                      ? "#2196f3"
                      : undefined,
            color: "white",
          }}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={onClose}
              aria-label="Close notification"
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          {message}
        </Alert>
      </Snackbar>
    </Portal>
  );
}
