"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/api";

interface UserAccount {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function UserManagementView() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [token]);

  const loadUsers = async () => {
    try {
      const data = await apiRequest<UserAccount[]>("/api/v1/users", {}, token);
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      await apiRequest(
        "/api/v1/users",
        {
          method: "POST",
          body: JSON.stringify({
            email: newEmail,
            password: newPassword,
            role: newRole,
          }),
        },
        token
      );
      setNotice(`User account '${newEmail}' created successfully.`);
      setNewEmail("");
      setNewPassword("");
      loadUsers();
    } catch (err: any) {
      setNotice(`Error creating account: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, targetRole: string) => {
    try {
      await apiRequest(
        `/api/v1/users/${userId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ role: targetRole }),
        },
        token
      );
      loadUsers();
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUser?.id) {
      alert("You cannot modify your own administrative account active status.");
      return;
    }
    try {
      await apiRequest(
        `/api/v1/users/${userId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: !currentStatus }),
        },
        token
      );
      loadUsers();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 font-mono">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-lg font-bold text-white tracking-wider uppercase">
          Identity and Access Management (RBAC)
        </h1>
        <p className="text-xs text-slate-400">
          Manage user accounts, assign role permissions (User, Handler, Admin), and disable access.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border border-slate-800 bg-slate-950/60 p-5 rounded-lg space-y-4">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 pb-2">
            Provision New Corporate Account
          </div>

          {notice && (
            <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs text-cyan-300">
              {notice}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Corporate Email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                placeholder="employee@aihas.local"
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Initial Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="TemporaryPassword123!"
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Assigned RBAC Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="user">User (Chat Self-Service)</option>
                <option value="handler">Handler (Agent Queue HITL)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {loading ? "Provisioning..." : "Create Account"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 border border-slate-800 bg-slate-950/60 p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Registered Accounts ({users.length})
            </span>
            <button
              onClick={loadUsers}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="text-slate-300 hover:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2 py-1 text-[11px]"
                      >
                        <option value="user">user</option>
                        <option value="handler">handler</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                          u.is_active
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                            : "bg-rose-950 text-rose-400 border border-rose-900"
                        }`}
                      >
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                        className={`text-[11px] hover:underline ${
                          u.is_active ? "text-amber-400" : "text-emerald-400"
                        }`}
                      >
                        {u.is_active ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
