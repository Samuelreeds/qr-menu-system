import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust path to your prisma client
import { generateExcelReport } from "@/lib/excel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "daily";
  const shopId = searchParams.get("shopId"); // Required for SaaS schema

  if (!shopId) {
    return new NextResponse("shopId is required", { status: 400 });
  }

  let start = new Date();
  let end = new Date();

  if (type === "custom") {
    start = new Date(searchParams.get("start") || new Date());
    end = new Date(searchParams.get("end") || new Date());
    end.setHours(23, 59, 59, 999);
  } else if (type === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (type === "yearly") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setHours(0, 0, 0, 0);
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        shopId,
        createdAt: { gte: start, lte: end },
        status: "COMPLETED",
      },
      include: { items: true, user: true },
      orderBy: { createdAt: "asc" },
    });

    let totalRevenue = 0, cashRev = 0, khqrRev = 0;
    let cashOrders = 0, khqrOrders = 0;
    
    const productMap: Record<string, { qty: number; rev: number }> = {};
    const monthlyMap: Record<string, { orders: number; rev: number }> = {};

    const formattedOrders = orders.map((order) => {
      totalRevenue += order.total;

      if (order.paymentMethod === "CASH") {
        cashRev += order.total;
        cashOrders++;
      } else if (order.paymentMethod === "KHQR") {
        khqrRev += order.total;
        khqrOrders++;
      }

      const month = order.createdAt.toLocaleString("default", { month: "long" });
      if (!monthlyMap[month]) monthlyMap[month] = { orders: 0, rev: 0 };
      monthlyMap[month].orders++;
      monthlyMap[month].rev += order.total;

      const itemNames = order.items.map((i) => {
        if (!productMap[i.name]) productMap[i.name] = { qty: 0, rev: 0 };
        productMap[i.name].qty += i.quantity;
        productMap[i.name].rev += i.price * i.quantity;
        return `${i.quantity}x ${i.name}`;
      }).join(", ");

      const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);

      return {
        "Order ID": order.id,
        Date: order.createdAt.toISOString().split("T")[0],
        Time: order.createdAt.toTimeString().split(" ")[0],
        "Table Number": order.tableNumber || "N/A",
        "Customer Name": "Walk-in", 
        Items: itemNames,
        Quantity: totalItems,
        "Total Amount": order.total,
        "Payment Method": order.paymentMethod,
        "Order Status": order.status,
      };
    });

    const productList = Object.entries(productMap)
      .map(([name, data]) => ({ "Product Name": name, "Quantity Sold": data.qty, Revenue: data.rev }))
      .sort((a, b) => b["Quantity Sold"] - a["Quantity Sold"]);

    const summary = [
      { Metric: "Report Type", Value: type.toUpperCase() },
      { Metric: "Date Range", Value: `${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]}` },
      { Metric: "Generated At", Value: new Date().toLocaleString() },
      { Metric: "Total Orders", Value: orders.length },
      { Metric: "Total Revenue", Value: `$${totalRevenue.toFixed(2)}` },
      { Metric: "Average Order Value", Value: `$${orders.length ? (totalRevenue / orders.length).toFixed(2) : "0.00"}` },
      { Metric: "Cash Revenue", Value: `$${cashRev.toFixed(2)}` },
      { Metric: "KHQR Revenue", Value: `$${khqrRev.toFixed(2)}` },
      { Metric: "Cash Orders", Value: cashOrders },
      { Metric: "KHQR Orders", Value: khqrOrders },
      { Metric: "Best Selling Product", Value: productList[0]?.["Product Name"] || "N/A" },
      { Metric: "Highest Revenue Product", Value: [...productList].sort((a, b) => b.Revenue - a.Revenue)[0]?.["Product Name"] || "N/A" },
    ];

    const payments = [
      { "Payment Method": "Cash", "Number of Orders": cashOrders, Revenue: cashRev },
      { "Payment Method": "KHQR", "Number of Orders": khqrOrders, Revenue: khqrRev },
    ];

    const monthlyList = Object.entries(monthlyMap).map(([Month, data]) => ({
      Month,
      Orders: data.orders,
      Revenue: data.rev,
    }));

    const buffer = generateExcelReport(
      {
        summary,
        orders: formattedOrders,
        products: productList,
        payments,
        monthly: type === "yearly" ? monthlyList : undefined,
      },
      type
    );

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=Restaurant_Report_${type}_${new Date().toISOString().split("T")[0]}.xlsx`,
      },
    });
  } catch (error) {
    console.error("Export Error:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to generate report" }), { status: 500 });
  }
}