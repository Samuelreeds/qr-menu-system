// lib/printer.ts
export async function printReceipt(payload: any) {
  try {
    const response = await fetch(
      "http://192.168.0.139:8080/print",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    return await response.json();
  } catch (error) {
    console.error("Print failed", error);
    throw error;
  }
}