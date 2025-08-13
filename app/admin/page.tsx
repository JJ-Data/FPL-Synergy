"use client";
import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  company: string | null;
  entryId: number;
  status: "PENDING" | "APPROVED" | "BLOCKED";
  createdAt: string;
}

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error";
}

export default function AdminPage() {
  const [pending, setPending] = useState<User[]>([]);
  const [approved, setApproved] = useState<User[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    entryId: "",
    adminPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "danger" | "primary";
  } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  async function load() {
    try {
      const [p, a] = await Promise.all([
        fetch("/api/users?status=PENDING").then((r) => r.json()),
        fetch("/api/users?status=APPROVED").then((r) => r.json()),
      ]);
      setPending(p);
      setApproved(a);
    } catch (error) {
      addToast("Failed to load users", "error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.adminPassword) {
      addToast("Admin password is required", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, entryId: Number(form.entryId) }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to add user");
      }

      addToast(`User ${form.name} added successfully`, "success");
      setForm({
        name: "",
        email: "",
        company: "",
        entryId: "",
        adminPassword: "",
      });
      load();
    } catch (e: any) {
      addToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function performUserAction(
    id: number,
    action: "approve" | "block" | "remove",
    userName: string
  ) {
    if (!form.adminPassword) {
      addToast("Please enter admin password first", "error");
      return;
    }

    const actionKey = `${action}-${id}`;
    setActionLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      let res: Response;

      if (action === "remove") {
        res = await fetch(
          `/api/users/${id}?adminPassword=${encodeURIComponent(
            form.adminPassword
          )}`,
          { method: "DELETE" }
        );
      } else {
        const status = action === "approve" ? "APPROVED" : "BLOCKED";
        res = await fetch(`/api/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, adminPassword: form.adminPassword }),
        });
      }

      if (res.ok) {
        const actionText =
          action === "approve"
            ? "approved"
            : action === "block"
            ? "blocked"
            : "removed";
        addToast(`${userName} ${actionText} successfully`, "success");
        load();
      } else {
        const json = await res.json();
        throw new Error(json.error || `Failed to ${action} user`);
      }
    } catch (e: any) {
      addToast(e.message, "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  }

  const confirmAction = (
    action: "approve" | "block" | "remove",
    user: User
  ) => {
    const actionText =
      action === "approve"
        ? "approve"
        : action === "block"
        ? "block"
        : "permanently delete";
    const isDangerous = action === "remove";

    setConfirmDialog({
      show: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `Are you sure you want to ${actionText} ${user.name}? ${
        isDangerous ? "This action cannot be undone." : ""
      }`,
      onConfirm: () => {
        performUserAction(user.id, action, user.name);
        setConfirmDialog(null);
      },
      type: isDangerous ? "danger" : "primary",
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin – Manage Participants</h1>

      {/* Global Admin Password */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Admin Authentication</h2>
        <div className="max-w-md">
          <label className="label">
            Admin password (required for all actions)
          </label>
          <input
            className="input"
            type="password"
            value={form.adminPassword}
            onChange={(e) =>
              setForm((s) => ({ ...s, adminPassword: e.target.value }))
            }
            placeholder="Enter admin password"
          />
        </div>
      </div>

      {/* Add User Form */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">Add Approved Participant</h2>
        <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Full name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Email *</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((s) => ({ ...s, email: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="label">Company</label>
            <input
              className="input"
              value={form.company}
              onChange={(e) =>
                setForm((s) => ({ ...s, company: e.target.value }))
              }
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="label">FPL Team ID *</label>
            <input
              className="input"
              type="number"
              value={form.entryId}
              onChange={(e) =>
                setForm((s) => ({ ...s, entryId: e.target.value }))
              }
              placeholder="e.g., 1234567"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <button
              className="btn btn-primary"
              disabled={loading || !form.adminPassword}
            >
              {loading ? (
                <>
                  <span className="spinner mr-2" />
                  Adding...
                </>
              ) : (
                "Add User (Pre-approved)"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* User Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">
            Pending Requests
            <span className="ml-2 text-sm bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
              {pending.length}
            </span>
          </h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Entry ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium">{user.name}</td>
                    <td className="text-sm text-neutral-400">{user.email}</td>
                    <td>{user.entryId}</td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-primary text-xs px-2 py-1"
                          onClick={() => confirmAction("approve", user)}
                          disabled={
                            !form.adminPassword ||
                            actionLoading[`approve-${user.id}`]
                          }
                        >
                          {actionLoading[`approve-${user.id}`] ? (
                            <span className="spinner" />
                          ) : (
                            "✓"
                          )}
                        </button>
                        <button
                          className="btn text-xs px-2 py-1"
                          onClick={() => confirmAction("block", user)}
                          disabled={
                            !form.adminPassword ||
                            actionLoading[`block-${user.id}`]
                          }
                        >
                          {actionLoading[`block-${user.id}`] ? (
                            <span className="spinner" />
                          ) : (
                            "✕"
                          )}
                        </button>
                        <button
                          className="btn btn-danger text-xs px-2 py-1"
                          onClick={() => confirmAction("remove", user)}
                          disabled={
                            !form.adminPassword ||
                            actionLoading[`remove-${user.id}`]
                          }
                        >
                          {actionLoading[`remove-${user.id}`] ? (
                            <span className="spinner" />
                          ) : (
                            "🗑"
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pending.length === 0 && (
                  <tr>
                    <td
                      className="py-8 text-center text-neutral-400"
                      colSpan={4}
                    >
                      No pending requests
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-3">
            Approved Participants
            <span className="ml-2 text-sm bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
              {approved.length}
            </span>
          </h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Entry ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approved.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium">{user.name}</td>
                    <td className="text-sm text-neutral-400">{user.email}</td>
                    <td>{user.entryId}</td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn text-xs px-2 py-1"
                          onClick={() => confirmAction("block", user)}
                          disabled={
                            !form.adminPassword ||
                            actionLoading[`block-${user.id}`]
                          }
                        >
                          {actionLoading[`block-${user.id}`] ? (
                            <span className="spinner" />
                          ) : (
                            "✕"
                          )}
                        </button>
                        <button
                          className="btn btn-danger text-xs px-2 py-1"
                          onClick={() => confirmAction("remove", user)}
                          disabled={
                            !form.adminPassword ||
                            actionLoading[`remove-${user.id}`]
                          }
                        >
                          {actionLoading[`remove-${user.id}`] ? (
                            <span className="spinner" />
                          ) : (
                            "🗑"
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {approved.length === 0 && (
                  <tr>
                    <td
                      className="py-8 text-center text-neutral-400"
                      colSpan={4}
                    >
                      No approved users yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-neutral-300 mb-4">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button className="btn" onClick={() => setConfirmDialog(null)}>
                Cancel
              </button>
              <button
                className={`btn ${
                  confirmDialog.type === "danger" ? "btn-danger" : "btn-primary"
                }`}
                onClick={confirmDialog.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-40 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${
              toast.type === "success" ? "toast-success" : "toast-error"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">{toast.message}</span>
              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="ml-2 text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
