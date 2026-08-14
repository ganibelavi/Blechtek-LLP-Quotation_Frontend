import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Paper,
} from "@mui/material";
import { useState } from "react";
import PeopleIcon from "@mui/icons-material/People";
import AppsIcon from "@mui/icons-material/Apps";

import UsersPage from "./UsersPage";
import ModulesPage from "./ModulesPage";

export default function SettingsPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("users");

  const menuItems = [
    { id: "users", label: "Users", icon: <PeopleIcon /> },
    { id: "modules", label: "Modules", icon: <AppsIcon /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return <UsersPage onNavigate={onNavigate} showSidebar={false} />;
      case "modules":
        return <ModulesPage onNavigate={onNavigate} showSidebar={false} />;
      default:
        return <UsersPage onNavigate={onNavigate} showSidebar={false} />;
    }
  };

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 160px)", gap: 3 }}>
      {/* Sidebar Partition */}
      <Paper
        elevation={0}
        className="glass"
        sx={{
          overflow: "hidden",
          p: 1,
          border: "1px solid #d8d2c6",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          width: 280,
          flexShrink: 0,
          height: "100%",
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography
            variant="h4"
            sx={{
              color: "primary.main",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Settings
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400}>
            System Configuration
          </Typography>
        </Box>
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <ListItemButton
                key={item.id}
                selected={isActive}
                onClick={() => setActiveTab(item.id)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  py: 1.5,
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    background:
                      "linear-gradient(120deg, #308aea 0%, #48cae4 100%)",
                    boxShadow: "0 4px 12px rgba(48, 138, 234, 0.35)",
                    "&:hover": { backgroundColor: "primary.dark" },
                    "& .MuiListItemIcon-root": { color: "inherit" },
                  },
                  "&:hover:not(.Mui-selected)": {
                    backgroundColor: "rgba(15, 107, 95, 0.08)",
                    color: "primary.main",
                    "& .MuiListItemIcon-root": { color: "primary.main" },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 38,
                    color: isActive ? "inherit" : "text.secondary",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "13px",
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Paper>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Paper
          elevation={0}
          className="glass"
          sx={{
            flex: 1,
            p: { xs: 2, md: 4 },
            overflowY: "auto",
            overflowX: "hidden",
            border: "1px solid #d8d2c6",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          }}
        >
          {renderContent()}
        </Paper>
      </Box>
    </Box>
  );
}
