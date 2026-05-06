import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/google';

export async function POST(request: Request) {
  try {
    const { brandName, platforms, caption, scheduleDate, mediaUrl } = await request.json();

    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Generate a unique ID for the post
    const postId = `post_${Date.now()}`;
    
    // Convert the array of platforms into a comma-separated string
    const platformString = platforms.join(', ');

    // Append the new row to the Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Editorial_Calendar!A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [postId, brandName, platformString, caption, scheduleDate, mediaUrl, 'Scheduled']
        ],
      },
    });

    return NextResponse.json({ success: true, postId });
  } catch (error) {
    console.error('Post Creation Error:', error);
    return NextResponse.json({ error: 'Failed to schedule post' }, { status: 500 });
  }
}