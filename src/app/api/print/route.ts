import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Sends the structured payload directly to your running a-Shell server IP
    const printerResponse = await fetch('http://192.168.0.139:8080/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: body.table,
        items: body.items,
      }),
    });

    const data = await printerResponse.json();

    if (!printerResponse.ok) {
      return NextResponse.json({ status: 'error', message: data.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}