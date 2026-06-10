"use client";

import React, { useState } from "react";

type ReportType = "daily" | "monthly" | "yearly" | "custom";

export default function ReportsPage({ shopId }: { shopId: string }) {
  const [type, setType] = useState<ReportType>("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ type, shopId }); // Pass shopId to API
      if (type === "custom") {
        if (!startDate || !endDate) {
          alert("Please select both start and end dates.");
          setIsLoading(false);
          return;
        }
        params.append("start", startDate);
        params.append("end", endDate);
      }

      const response = await fetch(`/api/reports/export?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to generate report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Report_${type}_${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Error downloading the report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Generate Excel Reports</h1>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Report Period</label>
          <div className="flex flex-wrap gap-3">
            {["daily", "monthly", "yearly", "custom"].map((t) => (
              <button
                key={t}
                onClick={() => setType(t as ReportType)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
                  type === t
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {type === "custom" && (
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={isLoading}
          className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Generating Excel..." : "Generate Excel Report"}
        </button>
      </div>
    </div>
  );
}