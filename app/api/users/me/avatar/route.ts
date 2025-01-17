import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

// Import environment variables from .env.development
import 'dotenv/config';

// Load environment variables
const AWS_REGION = process.env.AWS_REGION;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

console.log('Loading AWS config:', {
  region: AWS_REGION,
  bucket: AWS_BUCKET_NAME,
  hasAccessKey: !!AWS_ACCESS_KEY_ID,
  hasSecretKey: !!AWS_SECRET_ACCESS_KEY
});

// Create S3 client with explicit environment variables
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    console.log('[Avatar Upload] Environment variables:', {
      AWS_REGION: process.env.AWS_REGION || 'not set',
      AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || 'not set',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'set' : 'not set',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'set' : 'not set',
      NODE_ENV: process.env.NODE_ENV
    });

    console.log('[Avatar Upload] Request received');
    
    // Create a cookies instance
    const cookieStore = cookies();
    console.log('[Avatar Upload] Cookie headers:', request.headers.get('cookie'));
    
    // Create a Supabase client with the cookies
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    console.log('[Avatar Upload] Supabase client created');
    
    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[Avatar Upload] Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      error: sessionError
    });

    if (sessionError) {
      console.error('[Avatar Upload] Session error:', sessionError);
      return new NextResponse('Authentication error', { status: 401 });
    }

    if (!session?.user) {
      console.error('[Avatar Upload] No session or user');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new NextResponse('No file uploaded', { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return new NextResponse('File must be an image', { status: 400 });
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new NextResponse('File size must be less than 5MB', { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate S3 key
    const fileExt = file.name.split('.').pop();
    const fileName = `avatars/${session.user.id}-${Date.now()}.${fileExt}`;

    // Upload to S3
    try {
      console.log('[Avatar Upload] Attempting S3 upload:', {
        bucket: process.env.AWS_BUCKET_NAME,
        region: process.env.AWS_REGION,
        fileName,
        contentType: file.type,
        hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      });

      await s3Client.send(new PutObjectCommand({
        Bucket: AWS_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      }));

      console.log('[Avatar Upload] S3 upload successful');

      // Construct the public URL
      const publicUrl = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileName}`;
      console.log('[Avatar Upload] Generated public URL:', publicUrl);

      // Update user's avatar_url in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('[Avatar Upload] Error updating avatar URL:', updateError);
        return new NextResponse('Error updating avatar URL', { status: 500 });
      }

      console.log('[Avatar Upload] Successfully updated user record with new avatar URL');
      return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
      console.error('S3 upload error:', error);
      return new NextResponse(
        error.code === 'NoSuchBucket' ? 'S3 bucket not found' :
        error.code === 'AccessDenied' ? 'Access denied to S3 bucket' :
        error.code === 'InvalidAccessKeyId' ? 'Invalid AWS credentials' :
        'Failed to upload file',
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error handling avatar upload:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 