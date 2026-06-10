import * as XLSX from "xlsx";

export interface ReportData {
  summary: Record<string, any>[];
  orders: Record<string, any>[];
  products: Record<string, any>[];
  payments: Record<string, any>[];
  monthly?: Record<string, any>[];
}

export function generateExcelReport(data: ReportData, reportType: string): Buffer {
  const wb = XLSX.utils.book_new();

  const formatSheet = (ws: XLSX.WorkSheet, colWidths: number[]) => {
    ws["!cols"] = colWidths.map((wch) => ({ wch }));
    ws["!views"] = [{ state: "frozen", ySplit: 1 }];
    return ws;
  };

  const applyCurrency = (ws: XLSX.WorkSheet, colIndex: number) => {
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
    for (let R = 1; R <= range.e.r; ++R) {
      const cellRef = XLSX.utils.encode_cell({ c: colIndex, r: R });
      if (ws[cellRef]) {
        ws[cellRef].t = "n";
        ws[cellRef].z = '"$"#,##0.00';
      }
    }
  };

  // 1. Summary
  const wsSummary = XLSX.utils.json_to_sheet(data.summary);
  XLSX.utils.book_append_sheet(wb, formatSheet(wsSummary, [25, 20]), "Summary");

  // 2. Orders (Total Amount is index 7)
  const wsOrders = XLSX.utils.json_to_sheet(data.orders);
  applyCurrency(wsOrders, 7);
  XLSX.utils.book_append_sheet(wb, formatSheet(wsOrders, [25, 12, 10, 15, 20, 40, 10, 15, 15, 15]), "Orders");

  // 3. Product Sales (Revenue is index 2)
  const wsProducts = XLSX.utils.json_to_sheet(data.products);
  applyCurrency(wsProducts, 2);
  XLSX.utils.book_append_sheet(wb, formatSheet(wsProducts, [30, 15, 15]), "Product Sales");

  // 4. Payment Breakdown (Revenue is index 2)
  const wsPayments = XLSX.utils.json_to_sheet(data.payments);
  applyCurrency(wsPayments, 2);
  XLSX.utils.book_append_sheet(wb, formatSheet(wsPayments, [20, 15, 15]), "Payment Breakdown");

  // 5. Monthly Summary
  if (reportType === "yearly" && data.monthly) {
    const wsMonthly = XLSX.utils.json_to_sheet(data.monthly);
    applyCurrency(wsMonthly, 2);
    XLSX.utils.book_append_sheet(wb, formatSheet(wsMonthly, [15, 15, 15]), "Monthly Summary");
  }

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}