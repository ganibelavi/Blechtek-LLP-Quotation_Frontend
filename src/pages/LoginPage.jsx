import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import CustomSnackbar from "../components/CustomSnackbar";

export default function LoginPage() {
  const { login } = useAuth();
  const { register, handleSubmit } = useForm();
  const [error, setError] = useState("");

  const onSubmit = async (values) => {
    try {
      setError("");
      await login(values);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <Box
      sx={{
        // minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          //   position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
        }}
        className="gradient-bg"
      />

      <Card className="glass animate-in" sx={{ width: 440 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Box
              sx={{
                width: 50,
                height: 40,
                bgcolor: "primary.main",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 32,
                fontWeight: 800,
                mx: "auto",
                mb: 2,
                boxShadow: "0 8px 16px rgba(15, 107, 95, 0.3)",
              }}
            >
              Q
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                letterSpacing: "-0.04em",
                color: "primary.main",
              }}
            >
              Laser Quotation Suite
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Secure portal for estimates, rates, and production.
            </Typography>
          </Box>

          <CustomSnackbar
            open={Boolean(error)}
            onClose={() => setError("")}
            severity="error"
            message={error}
            autoHideDuration={6000}
          />

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2.5}>
              <TextField
                label="Email Address"
                {...register("email")}
                fullWidth
                inputProps={{ style: { padding: "8px 12px", fontSize: "13px"} }}
              />
              <TextField
                label="Password"
                type="password"
                {...register("password")}
                fullWidth
                inputProps={{ style: { padding: "8px 12px", fontSize: "13px" } }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                sx={{ py: 1.5, fontSize: "1rem" }}
              >
                Sign In
              </Button>
            </Stack>
          </form>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", textAlign: "center", mt: 4 }}
          >
            &copy; 2026 BlechTek Solutions India Pvt Ltd.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
