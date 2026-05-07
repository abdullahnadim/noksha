import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/google';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

async function getOrCreateFolder(drive: any, folderName: string, parentId: string) {
  const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`;
  
  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
    supportsAllDrives: true,         // <-- REQUIRED FOR SHARED DRIVES
    includeItemsFromAllDrives: true, // <-- REQUIRED FOR SHARED DRIVES
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id;
  } else {
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };
    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
      supportsAllDrives: true,       // <-- REQUIRED FOR SHARED DRIVES
    });
    return folder.data.id;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const brandId = formData.get('brandId') as string;
    const brandName = formData.get('brandName') as string; 
    const uploaderName = formData.get('uploaderName') as string;

    if (!file || !brandId || !brandName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!rootFolderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID is missing!");
    
    // 1. Get/Create Brand Folder
    const targetBrandFolderId = await getOrCreateFolder(drive, brandName, rootFolderId);

    // 2. Determine Category
    let categoryName = 'Documents';
    let typeIcon = 'archive';
    if (file.type.includes('video') || file.name.endsWith('.mp4')) {
      categoryName = 'Videos';
      typeIcon = 'video';
    } else if (file.type.includes('image') || file.name.endsWith('.psd') || file.name.endsWith('.ai')) {
      categoryName = 'Designs';
      typeIcon = 'design';
    }

    // 3. Get/Create Category Folder
    const targetCategoryFolderId = await getOrCreateFolder(drive, categoryName, targetBrandFolderId);

    // 4. Sub-category logic
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
        parents: [finalDestinationId], 
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, webContentLink',
      supportsAllDrives: true,       // <-- REQUIRED FOR SHARED DRIVES
    });

    const fileId = driveResponse.data.id;
    const downloadUrl = driveResponse.data.webContentLink;

    // Permissions
    await drive.permissions.create({
      fileId: fileId!,
      requestBody: { role: 'reader', type: 'anyone' },
      supportsAllDrives: true,       // <-- REQUIRED FOR SHARED DRIVES
    });

    // --- DATABASE LOGIC ---
    const assetId = `asset_${Date.now()}`;
    const dateUploaded = new Date().toLocaleDateString();
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    
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
    return NextResponse.json(
      { error: 'Failed to process file', details: error.message || 'Unknown error' }, 
      { status: 500 }
    );
  }
}