"use client";

import React, { useEffect, useState } from "react";
import { getShopStaffRequests, updateStaffRequestStatus, StaffRequestStatus } from "@/lib/staff-admin-actions";

interface RequestItem {
  id: string;
  tableNumber: string;
  status: string;
  createdAt: Date | string; // Updated to allow string for Next.js serialization
  resolvedAt: Date | string | null;
}

export default function StaffRequestsManager({ shopId }: { shopId: string }) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [filter, setFilter] = useState<"ALL" | StaffRequestStatus>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    setIsLoading(true);
    const res = await getShopStaffRequests(shopId);
    if (res.success && res.data) {
      setRequests(res.data as RequestItem[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    // Optional: Add a setInterval here to auto-refresh every 30 seconds
  }, [shopId]);

  const handleUpdateStatus = async (id: string, newStatus: StaffRequestStatus) => {
    // Optimistic UI update
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
    );

    const res = await updateStaffRequestStatus(id, shopId, newStatus);
    if (!res.success) {
      // Revert on failure
      fetchRequests();
      alert("Failed to update status.");
    }
  };

  const filteredRequests = requests.filter((req) => filter === "ALL" || req.status === filter);

  // Safely format dates even if they come back as strings from the server action
  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-800 border-amber-200";
      case "ACKNOWLEDGED": return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED": return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900">Staff Call Requests</h2>
        <button 
          onClick={fetchRequests}
          className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["ALL", "PENDING", "ACKNOWLEDGED", "COMPLETED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === f
                ? "bg-black text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading requests...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="py-8 text-center text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
          No requests found for this filter.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredRequests.map((req) => (
            <div key={req.id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-2xl font-black text-gray-900">Table {req.tableNumber}</span>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatTime(req.createdAt)}
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${getStatusColor(req.status)}`}>
                  {req.status}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-2 flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                {req.status === "PENDING" && (
                  <button
                    onClick={() => handleUpdateStatus(req.id, "ACKNOWLEDGED")}
                    className="flex-1 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                
                {(req.status === "PENDING" || req.status === "ACKNOWLEDGED") && (
                  <button
                    onClick={() => handleUpdateStatus(req.id, "COMPLETED")}
                    className="flex-1 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-bold transition-colors"
                  >
                    Complete
                  </button>
                )}

                {(req.status === "PENDING" || req.status === "ACKNOWLEDGED") && (
                  <button
                    onClick={() => handleUpdateStatus(req.id, "CANCELLED")}
                    className="px-3 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                )}
                
                {(req.status === "COMPLETED" || req.status === "CANCELLED") && (
                  <span className="text-sm text-gray-400 font-medium py-2">
                    Resolved at {req.resolvedAt ? formatTime(req.resolvedAt) : "Unknown"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}