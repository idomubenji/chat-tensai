import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Database } from '@/types/supabase';
import { getAuthSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

const AVATAR_PREFIX = 'avatars/';
const URL_EXPIRATION = 604800;

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function validateEnvironment() {
  // This will throw if any required variable is missing
  const requiredVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_BUCKET_NAME',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  requiredVars.forEach(getRequiredEnvVar);
}

function getS3Client() {
  return new S3Client({
    region: getRequiredEnvVar('AWS_REGION'),
    credentials: {
      accessKeyId: getRequiredEnvVar('AWS_ACCESS_KEY_ID'),
      secretAccessKey: getRequiredEnvVar('AWS_SECRET_ACCESS_KEY'),
    }
  });
}

export async function POST(req: Request) {
  try {
    validateEnvironment();
    const s3 = getS3Client();
    const supabase = getSupabaseAdmin();
    
    // 1. Auth check
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;

    // 2. Get and validate file
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse('No file provided', { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return new NextResponse('File must be an image', { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new NextResponse('File size must be less than 5MB', { status: 400 });
    }

    // 3. Prepare file for upload
    const fileExtension = file.name.split('.').pop();
    const fileName = `${AVATAR_PREFIX}${userId}-${Date.now()}.${fileExtension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // 4. Upload to S3
    try {
      const putCommand = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      });

      await s3.send(putCommand);

      // Generate a signed URL for the uploaded file
      const getCommand = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
      });

      const signedUrl = await getSignedUrl(s3, getCommand, { expiresIn: URL_EXPIRATION });

      // Store just the S3 key in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: fileName })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to update avatar URL:', updateError);
        return new NextResponse('Failed to update avatar URL', { status: 500 });
      }

      // Return the signed URL for immediate use
      return NextResponse.json({ url: signedUrl });
    } catch (error: any) {
      const s3Error = error as Error;
      console.error('S3 upload error details:', {
        error: s3Error,
        errorName: s3Error.name,
        errorMessage: s3Error.message,
        bucket: process.env.AWS_BUCKET_NAME,
        region: process.env.AWS_REGION
      });
      return new NextResponse(`Failed to upload file to S3: ${s3Error.message}`, { status: 500 });
    }
  } catch (error) {
    console.error('Error in avatar upload:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE() {
  try {
    validateEnvironment();
    const supabase = getSupabaseAdmin();
    
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const userId = session.user.id;

    // Update user in database to use default avatar
    const { data, error } = await supabase
      .from('users')
      .update({
        avatar_url: '/default-avatar.jpeg',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error removing avatar:', error);
      return new NextResponse('Failed to remove avatar', { status: 500 });
    }

    return NextResponse.json({ avatar_url: '/default-avatar.jpeg' });
  } catch (error) {
    console.error('Error in avatar removal:', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    );
  }
} 