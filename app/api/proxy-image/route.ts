import { NextResponse } from 'next/server';

// THE MAGIC FIX: This moves the proxy off the restricted Node.js server 
// and onto Vercel's global Edge Network, allowing infinite payload sizes!
export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing Google Drive ID', { status: 400 });
  }

  const driveUrl = `https://drive.google.com/uc?export=download&id=${id}`;

  try {
    const response = await fetch(driveUrl, {
      // Trick Google into thinking this request is coming from a normal computer browser
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Google returned status ${response.status}`);
    }

    // STREAM THE DATA: Instead of downloading the whole image into memory (which crashes Vercel),
    // we pipe the raw data stream directly to the frontend.
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        // Cache the image aggressively on Vercel's Edge network for 1 week
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image Proxy Error:', error);
    return new NextResponse('Failed to fetch image', { status: 500 });
  }
}