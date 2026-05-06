import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/google';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch the Asset_Vault tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Asset_Vault!A:H',
    });

    const rows = response.data.values;

    if (!rows || rows.length <= 1) {
      return NextResponse.json({ assets: [] });
    }

    // Convert the spreadsheet rows into clean JSON
    const assets = rows.slice(1).map((row) => ({
      id: row[0],
      brandId: row[1],
      uploader: row[2],
      name: row[3],
      downloadUrl: row[4],
      type: row[5],
      size: row[6],
      date: row[7] || 'Unknown',
    }));

    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Fetch Assets Error:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}