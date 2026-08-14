import { useEffect, useState } from "react";
import { fetchUsers, createUser, updateUser, deleteUser } from "../services/userApi";
import EntityTable from "../components/EntityTable";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Snackbar from "@mui/material/Snackbar";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
} from "@mui/material";

const emptyUser = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "User",
  isActive: true,
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [form, setForm] = useState(emptyUser);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError("Failed to load users. Please check if the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const openAddDialog = () => {
    setEditingUserId(null);
    setForm(emptyUser);
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (user) => {
    setEditingUserId(user.id);
    setForm({
      ...emptyUser,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      password: "",
    });
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingUserId(null);
    setForm(emptyUser);
    setShowPassword(false);
  };

  const updateField = (event) => {
    const { name, value, type } = event.target;
    if (type === "checkbox") {
      setForm((current) => ({ ...current, [name]: value === "true" }));
    } else {
      setForm((current) => ({ ...current, [name]: value }));
    }
  };

  const saveUser = async (event) => {
    event.preventDefault();
    const isNewUser = editingUserId === null;

    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      (isNewUser && !form.password)
    ) {
      return;
    }

    try {
      setLoading(true);
      if (isNewUser) {
        await createUser({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          isActive: form.isActive,
        });
        showSnackbar("User created successfully");
      } else {
        await updateUser(editingUserId, {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          isActive: form.isActive,
          password: form.password || undefined,
        });
        showSnackbar("User updated successfully");
      }
      await loadUsers();
      closeDialog();
    } catch (err) {
      const message = err.response?.data?.error || "Failed to save user";
      showSnackbar(message, "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      setLoading(true);
      await deleteUser(id);
      await loadUsers();
      showSnackbar("User deleted successfully");
    } catch (err) {
      const message = err.response?.data?.error || "Failed to delete user";
      showSnackbar(message, "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const userColumns = [
    { key: "id", label: "Id", sortable: true, minWidth: 80 },
    { key: "firstName", label: "First Name", sortable: true, minWidth: 140 },
    { key: "lastName", label: "Last Name", sortable: true, minWidth: 140 },
    { key: "email", label: "Email", sortable: true, minWidth: 220 },
    { key: "passwordHash", label: "Password", minWidth: 120 },
    { key: "isActive", label: "Status", sortable: true, minWidth: 100, render: (user) => user.isActive ? "Active" : "Inactive" },
    { key: "createdAt", label: "Created At", sortable: true, minWidth: 160 },
    { key: "lastLoginAt", label: "Last Login", sortable: true, minWidth: 160 },
    { key: "role", label: "Role", sortable: true, minWidth: 100 },
    {
      key: "actions",
      label: "Actions",
      minWidth: 100,
      render: (user) => (
        <Box sx={{ whiteSpace: "nowrap" }}>
          <IconButton
            aria-label={`Edit ${user.email}`}
            size="small"
            onClick={() => openEditDialog(user)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={`Delete ${user.email}`}
            size="small"
            onClick={() => removeUser(user.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAddDialog}
          disabled={loading}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <Typography>Loading users...</Typography>
        </Box>
      ) : (
        <EntityTable title="" columns={userColumns} rows={users} />
      )}

      <Dialog
        open={isDialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ component: "form", onSubmit: saveUser }}
      >
        <DialogTitle
          sx={{
            background: "var(--primary-gradient)",
            color: "white",
            px: 3,
            py: 2,
            mb: 2,
            borderTopLeftRadius: "var(--radius-md)",
            borderTopRightRadius: "var(--radius-md)",
          }}
        >
          {editingUserId === null ? "Add User" : "Edit User"}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              pt: 1,
            }}
          >
            <TextField
              required
              label="First Name"
              name="firstName"
              value={form.firstName}
              onChange={updateField}
            />
            <TextField
              required
              label="Last Name"
              name="lastName"
              value={form.lastName}
              onChange={updateField}
            />
            <TextField
              required
              sx={{ gridColumn: { sm: "1 / -1" } }}
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
            />
            <TextField
              required={editingUserId === null}
              helperText={
                editingUserId === null
                  ? "Minimum 6 characters"
                  : "Leave blank to keep the current password"
              }
              sx={{ gridColumn: { sm: "1 / -1" } }}
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={updateField}
              inputProps={{ minLength: editingUserId === null ? 6 : undefined }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    sx={{ color: "text.secondary" }}
                  >
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                ),
              }}
            />
            <FormControl>
              <InputLabel id="user-role-label">Role</InputLabel>
              <Select
                labelId="user-role-label"
                label="Role"
                name="role"
                value={form.role}
                onChange={updateField}
              >
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Manager">Manager</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel id="user-status-label">Is Active</InputLabel>
              <Select
                labelId="user-status-label"
                label="Is Active"
                name="isActive"
                value={form.isActive.toString()}
                onChange={updateField}
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" color="secondary" onClick={closeDialog} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {editingUserId === null ? "Create" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
