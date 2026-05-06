import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing Google Drive ID', { status: 400 });
  }

  // The direct download URL
  const driveUrl = `https://drive.google.com/uc?export=download&id=${id}`;

  try {
    // 1. Fetch the image from Google Drive on the server (bypasses browser CORS!)
    const response = await fetch(driveUrl);
    
    if (!response.ok) {
      throw new Error(`Google returned status ${response.status}`);
    }

    // 2. Read the image data
    const blob = await response.blob();

    // 3. Send it directly to your frontend as a raw image
    return new NextResponse(blob, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        // Cache the image for 24 hours so it loads instantly next time
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error('Image Proxy Error:', error);
    return new NextResponse('Failed to fetch image', { status: 500 });
  }
}