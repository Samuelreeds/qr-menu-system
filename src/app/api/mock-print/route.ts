import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  console.log("🖨️ MOCK PRINTER RECEIVED:\n", body.text || body);
  
  // Return success so the POS UI thinks the print worked
  return NextResponse.json({ status: 'success', message: 'Mock print successful' });
}