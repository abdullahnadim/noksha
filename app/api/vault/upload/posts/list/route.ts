import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/google';

export async function GET() {
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch everything from the Editorial_Calendar tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Editorial_Calendar!A:G',
    });

    const rows = response.data.values;

    // If the sheet is empty (or only has headers), return an empty array
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ posts: [] });
    }

    // Convert the raw spreadsheet rows into clean JSON objects (skipping the header row)
    const posts = rows.slice(1).map((row) => ({
      id: row[0],
      brandName: row[1],
      // Safely handle platforms if they are empty
      platforms: row[2] ? row[2].split(', ') : [],
      caption: row[3],
      scheduleDate: row[4],
      mediaUrl: row[5],
      status: row[6],
    }));

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Fetch Posts Error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}