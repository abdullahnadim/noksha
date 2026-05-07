import { google } from 'googleapis';

export function getGoogleAuth() {
  // THE VERCEL FIX: 
  // Vercel turns physical line breaks into literal "\n" strings. 
  // This .replace() function forces them back into physical line breaks so Google accepts the key!
  const privateKey = process.env.GOOGLE_PRIVATE_KEY 
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined;

  // Double-check that the email exists to prevent silent crashes
  if (!process.env.GOOGLE_CLIENT_EMAIL || !privateKey) {
    throw new Error("Missing Google Authentication credentials in Environment Variables.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets'
    ],
  });

  return auth;
}