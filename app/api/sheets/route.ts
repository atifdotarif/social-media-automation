import { NextResponse } from 'next/server';

const GOOGLE_SHEET_ID = '1eTTD5ImO8w1NpYu5MHJUz11p43IjOHkmVzcpY2l-wCw';

export async function GET() {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=0`;
    const response = await fetch(csvUrl, {
      next: { revalidate: 10 } // Revalidate every 10 seconds
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
    }

    const csvText = await response.text();
    return NextResponse.json({ data: csvText });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Google Sheet data' },
      { status: 500 }
    );
  }
}

