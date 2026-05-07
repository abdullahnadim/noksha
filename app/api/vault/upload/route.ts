import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/google';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

// Helper function to find or create a Google Drive folder
async function getOrCreateFolder(drive: any, folderName: string, parentId: string) {
  // Search for the folder by name inside the parent
  const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`;
  
  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
    supportsAllDrives: true,           // <--- ADD THIS
    includeItemsFromAllDrives: true,
  });

  if (response.data.files && response.data.files.length > 0) {
    // Folder exists, return its ID
    return response.data.files[0].id;
  } else {
    // Folder doesn't exist, create it
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };
    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    });
    return folder.data.id;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const brandId = formData.get('brandId') as string;
    const brandName = formData.get('brandName') as string; // We need the actual name for the folder
    const uploaderName = formData.get('uploaderName') as string;

    if (!file || !brandId || !brandName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    // --- FOLDER ROUTING LOGIC ---
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    // Safety check just in case the env variable is missing on Vercel
    if (!rootFolderId) {
      throw new Error("GOOGLE_DRIVE_FOLDER_ID environment variable is missing!");
    }
    
    // 1. Get or Create the Brand Folder (e.g., "Happier")
    const targetBrandFolderId = await getOrCreateFolder(drive, brandName, rootFolderId);

    // 2. Determine Category based on file type
    let categoryName = 'Documents';
    let typeIcon = 'archive';
    
    if (file.type.includes('video') || file.name.endsWith('.mp4')) {
      categoryName = 'Videos';
      typeIcon = 'video';
    } else if (file.type.includes('image') || file.name.endsWith('.psd') || file.name.endsWith('.ai')) {
      categoryName = 'Designs';
      typeIcon = 'design';
    }

    // 3. Get or Create Category Folder (e.g., "Videos")
    const targetCategoryFolderId = await getOrCreateFolder(drive, categoryName, targetBrandFolderId);

    // 4. Optional Sub-category logic (e.g., if filename contains "reel")
    let finalDestinationId = targetCategoryFolderId;
    if (categoryName === 'Videos' && file.name.toLowerCase().includes('reel')) {
      finalDestinationId = await getOrCreateFolder(drive, 'Reels', targetCategoryFolderId);
    }

    // --- UPLOAD LOGIC ---
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const stream = Readable.from(buffer);

    const driveResponse = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [finalDestinationId], // Uploading to the dynamically created folder!
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, webContentLink',
      supportsAllDrives: true,
    });

    const fileId = driveResponse.data.id;
    const downloadUrl = driveResponse.data.webContentLink;

    // Make the file downloadable for the team
    await drive.permissions.create({
      fileId: fileId!,
      requestBody: { role: 'reader', type: 'anyone' },
      supportsAllDrives: true,
    });

    // --- DATABASE LOGIC ---
    const assetId = `asset_${Date.now()}`;
    const dateUploaded = new Date().toLocaleDateString();
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    
    // THE FIX: Changed range from A:G to A:H so all 8 columns fit perfectly!
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Asset_Vault!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[assetId, brandId, uploaderName, file.name, downloadUrl, typeIcon, sizeInMB, dateUploaded]],
      },
    });

    return NextResponse.json({ success: true, assetId, downloadUrl });

  } catch (error: any) {
    console.error('Detailed Upload Error:', error);
    
    // THE ULTIMATE DEBUGGER: This will send the exact crash reason to your frontend red UI
    return NextResponse.json(
      { 
        error: 'Failed to process file', 
        details: error.message || 'Unknown server error occurred.' 
      }, 
      { status: 500 }
    );
  }
}