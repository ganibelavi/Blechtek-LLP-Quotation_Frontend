import axios from "axios";

const client = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "https://localhost:5001",
  headers: { "Content-Type": "application/json" }
});

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  passwordHash: string;
}

export async function fetchUsers(): Promise<User[]> {
  const { data } = await client.get("/api/users");
  return data.map((user: any) => ({
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

export async function createUser(user: Omit<User, "id" | "createdAt" | "lastLoginAt" | "passwordHash"> & { password: string }): Promise<User> {
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

export async function updateUser(id: number, user: Partial<User> & { password?: string }): Promise<User> {
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

export async function deleteUser(id: number): Promise<void> {
  await client.delete(`/api/users/${id}`);
}

export default client;