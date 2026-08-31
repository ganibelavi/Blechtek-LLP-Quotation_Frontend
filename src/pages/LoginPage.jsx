import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import CustomSnackbar from "../components/CustomSnackbar";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

export default function LoginPage() {
  const { login } = useAuth();
  const { register, handleSubmit } = useForm();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (values) => {
    try {
      setError("");
      await login(values);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Box
      sx={{
        // minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
        px: 2,
        py: 4,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
        }}
        className="gradient-bg"
      />

      <Card className="glass animate-in" sx={{ width: "100%", maxWidth: 440 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
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
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: "primary.main",
                fontFamily: "var(--font-display)",
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
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: "0 0 0 1000px white inset",
                    transition: "background-color 5000s ease-in-out 0s",
                  },
                  "& input:-webkit-autofill:focus": {
                    WebkitBoxShadow: "0 0 0 1000px white inset",
                  },
                }}
              />
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                fullWidth
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow: "0 0 0 1000px white inset",
                    transition: "background-color 5000s ease-in-out 0s",
                  },
                  "& input:-webkit-autofill:focus": {
                    WebkitBoxShadow: "0 0 0 1000px white inset",
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        sx={{ color: "text.secondary" }}
                      >
                        {showPassword ? (
                          <VisibilityOffIcon fontSize="small" />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: "none",
                  background: "linear-gradient(120deg, #308aea, #48cae4)",
                  boxShadow: "0 4px 14px rgba(48, 138, 234, 0.4)",
                  "&:hover": {
                    background: "linear-gradient(120deg, #308aea, #48cae4)",
                    boxShadow: "0 6px 20px rgba(48, 138, 234, 0.5)",
                  },
                }}
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
