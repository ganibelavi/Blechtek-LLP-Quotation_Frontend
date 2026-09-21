import axios from "axios";

const resolveApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_BASE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "";
  }

  return "http://localhost:5000";
};

const client = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { "Content-Type": "application/json" }
});

export async function fetchUsers() {
  const { data } = await client.get("/api/users");
  return data.map((user) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    passwordHash: user.passwordHash
  }));
}

export async function createUser(user) {
  const { data } = await client.post("/api/users", {
    email: user.email,
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role
  });
  return {
    id: data.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    isActive: data.isActive,
    createdAt: data.createdAt,
    lastLoginAt: data.lastLoginAt,
    passwordHash: data.passwordHash
  };
}

export async function updateUser(id, user) {
  const { data } = await client.put(`/api/users/${id}`, {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    password: user.password
  });
  return {
    id: data.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    isActive: data.isActive,
    createdAt: data.createdAt,
    lastLoginAt: data.lastLoginAt,
    passwordHash: data.passwordHash
  };
}

export async function deleteUser(id) {
  await client.delete(`/api/users/${id}`);
}

export default client;
