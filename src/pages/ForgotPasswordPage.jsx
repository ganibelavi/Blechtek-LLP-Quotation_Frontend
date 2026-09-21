import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import KeyIcon from "@mui/icons-material/Key";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import axios from "axios";
import CustomSnackbar from "../components/CustomSnackbar";

const passwordRule = /^(?=.*[0-9])(?=.*[A-Z]).{6,}$/;

export default function ForgotPasswordPage({ onBackToLogin }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const request = async (path, body) => {
    const response = await axios.post(`/api/auth/${path}`, body);
    return response.data;
  };

  const sendOtp = async () => {
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      const data = await request("send-otp", { email: normalizedEmail });
      setVerificationToken(data.verificationToken);
      setStep("otp");
      setSuccess("OTP sent successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Unable to send OTP.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit OTP sent to your email.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      await request("verify-otp", {
        email: email.trim(),
        otp,
        verificationToken,
      });
      setStep("password");
      setSuccess("OTP verified successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP.");
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!passwordRule.test(newPassword)) {
      setError(
        "Password must be at least 6 characters and include one number and one capital letter.",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      await request("reset-password", {
        email: email.trim(),
        otp,
        newPassword,
        verificationToken,
      });
      setSuccess("Password reset successfully. Please sign in.");
      setTimeout(onBackToLogin, 1500);
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      const message = validationErrors
        ? Object.values(validationErrors).flat().join(" ")
        : err.response?.data?.error;
      setError(message || "Unable to reset password.");
    } finally {
      setBusy(false);
    }
  };

  const passwordAdornment = (visible, setVisible, label) => (
    <InputAdornment position="end">
      <IconButton
        onClick={() => setVisible((current) => !current)}
        edge="end"
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      >
        {visible ? (
          <VisibilityOffIcon fontSize="small" />
        ) : (
          <VisibilityIcon fontSize="small" />
        )}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        minHeight: "70vh",
        px: 2,
        py: 4,
      }}
    >
      <Card className="glass animate-in" sx={{ width: "100%", maxWidth: 440 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                mx: "auto",
                mb: 2,
                color: "white",
                background: "linear-gradient(120deg, #308aea, #48cae4)",
              }}
            >
              <KeyIcon />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "primary.main",
                fontFamily: "var(--font-display)",
              }}
            >
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {step === "email" &&
                "We'll send a one-time password to your email."}
              {step === "otp" && "Enter the 6-digit OTP sent to your email."}
              {step === "password" && "Choose a new password for your account."}
            </Typography>
          </Box>

          <CustomSnackbar
            open={Boolean(error)}
            onClose={() => setError("")}
            severity="error"
            message={error}
            autoHideDuration={6000}
          />
          <CustomSnackbar
            open={Boolean(success)}
            onClose={() => setSuccess("")}
            severity="success"
            message={success}
            autoHideDuration={4000}
          />

          <Stack spacing={2.5}>
            {step === "email" && (
              <>
                <TextField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  fullWidth
                  size="small"
                  autoFocus
                />
                <Button
                  variant="contained"
                  onClick={sendOtp}
                  disabled={busy}
                  size="large"
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    background: "linear-gradient(120deg, #308aea, #48cae4)",
                  }}
                >
                  {busy ? "Sending..." : "Send OTP"}
                </Button>
              </>
            )}

            {step === "otp" && (
              <>
                <TextField
                  label="6-digit OTP"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  fullWidth
                  size="small"
                  autoFocus
                  inputProps={{ inputMode: "numeric", maxLength: 6 }}
                />
                <Button
                  variant="contained"
                  onClick={verifyOtp}
                  disabled={busy}
                  size="large"
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    background: "linear-gradient(120deg, #308aea, #48cae4)",
                  }}
                >
                  {busy ? "Verifying..." : "Verify OTP"}
                </Button>
              </>
            )}

            {step === "password" && (
              <>
                <TextField
                  label="New Password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: passwordAdornment(
                      showNewPassword,
                      setShowNewPassword,
                      "new password",
                    ),
                  }}
                  autoFocus
                />
                <TextField
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: passwordAdornment(
                      showConfirmPassword,
                      setShowConfirmPassword,
                      "confirm password",
                    ),
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  At least 6 characters, including one number and one capital
                  letter.
                </Typography>
                <Button
                  variant="contained"
                  onClick={resetPassword}
                  disabled={busy}
                  size="large"
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    background: "linear-gradient(120deg, #308aea, #48cae4)",
                  }}
                >
                  {busy ? "Resetting..." : "Reset Password"}
                </Button>
              </>
            )}
          </Stack>

          <Button
           type="button"
            variant="text"
            onClick={onBackToLogin}
            sx={{
              display: "block",
              mx: "auto",
              mt:1,
              textTransform: "none",
              // color: "white",
              // backgroundColor: "#6c757d",
              // "&:hover": {
              //   color: "white",
              //   backgroundColor: "#5c636a",
              // },
            }}
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
