import { Box, Paper, Typography, useTheme } from "@mui/material";

const colorMap = {
  primary: { main: "#308aea", light: "#48cae4" },
  secondary: { main: "#308aea", light: "#48cae4" },
  info: { main: "#0d9488", light: "#14b8a6" },
  success: { main: "#059669", light: "#10b981" },
  warning: { main: "#d97706", light: "#f59e0b" },
  error: { main: "#dc2626", light: "#ef4444" },
};

export default function DataCard({ label, value, icon, color = "primary", borderRadius = 4 }) {
  const mainColor = colorMap[color]?.main || colorMap.primary.main;
  const theme = useTheme();
  const paperBackground = theme.palette.background.paper;
  const gradientBackground = `linear-gradient(135deg, ${paperBackground} 0%, ${mainColor}08 100%)`;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: borderRadius,
        border: "1px solid",
        borderColor: "divider",
        background: gradientBackground,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: `0 12px 28px rgba(0, 0, 0, 0.25), 0 0 0 1px ${mainColor}40`,
          borderColor: `${mainColor}40`,
          "& .iconBox": {
            transform: "scale(1.1) rotate(-5deg)",
            backgroundColor: `${mainColor}20`,
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              mb: 0.5,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="h4"
            fontWeight={900}
            color="text.primary"
            sx={{ letterSpacing: "-0.02em" }}
          >
            {value}
          </Typography>
        </Box>
        {icon && (
          <Box
            className="iconBox"
            sx={{
              p: 1.25,
              borderRadius: 3,
              backgroundColor: `${mainColor}12`,
              color: mainColor,
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `radial-gradient(circle at center, ${mainColor}15 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
    </Paper>
  );
}