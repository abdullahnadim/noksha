import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/google';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'No ID provided' }, { status: 400 });

    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Fetch just Column A to find the row number of our asset
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Asset_Vault!A:A',
    });

    const rows = response.data.values;
    if (!rows) return NextResponse.json({ error: 'Sheet empty' }, { status: 404 });

    // 2. Find the row index (adding 1 because sheets start at row 1, not 0)
    const rowIndex = rows.findIndex(row => row[0] === id) + 1;

    if (rowIndex > 0) {
      // 3. Clear that specific row
      await sheets.spreadsheets.values.clear({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Asset_Vault!A${rowIndex}:H${rowIndex}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}