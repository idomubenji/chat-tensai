import { auth } from '@clerk/nextjs';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Database } from '@/types/supabase';

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

// Validate environment variables
if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
  throw new Error('Missing required AWS environment variables');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

// Initialize Supabase admin client
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const AVATAR_PREFIX = 'avatars/';
const URL_EXPIRATION = 604800; // 7 days in seconds

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('\n=== AVATAR UPLOAD: START ===');
    console.log('Attempting operation with:', {
      clerkUserId: userId,
      clerkUserIdType: typeof userId,
      clerkUserIdLength: userId.length
    });

    // Let's check what users exist in Supabase
    const { data: allUsers, error: listError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .limit(5);

    console.log('Supabase users:', {
      users: allUsers?.map(user => ({
        id: user.id,
        idType: typeof user.id,
        idLength: user.id.length,
        email: user.email
      }))
    });
    
    if (listError) {
      console.error('Error listing users:', listError);
    }

    // Try to find the user directly
    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    console.log('User lookup result:', {
      found: !!user,
      error: findError?.message,
      lookupId: userId,
      userData: user
    });

    if (!user) {
      console.log('=== AVATAR UPLOAD: USER NOT FOUND ===\n');
      // Try to create the user
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: 'placeholder@example.com', // We'll update this later
          name: 'New User',
          role: 'USER',
          status: 'ONLINE',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user:', createError);
        return new NextResponse('Failed to create user', { status: 500 });
      }
      console.log('Created new user:', newUser);
    }

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
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      });

      console.log('Attempting S3 upload with:', {
        bucket: BUCKET_NAME,
        key: fileName,
        contentType: file.type,
        region: process.env.AWS_REGION,
        // Don't log credentials!
      });

      await s3.send(putCommand);
      console.log('Successfully uploaded file to S3:', fileName);
    } catch (error: any) {
      const s3Error = error as Error;
      console.error('S3 upload error details:', {
        error: s3Error,
        errorName: s3Error.name,
        errorMessage: s3Error.message,
        bucket: BUCKET_NAME,
        region: process.env.AWS_REGION
      });
      return new NextResponse(`Failed to upload file to S3: ${s3Error.message}`, { status: 500 });
    }

    // 5. Generate pre-signed URL
    let signedUrl: string;
    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
      });
      signedUrl = await getSignedUrl(s3, getCommand, { expiresIn: URL_EXPIRATION });
      console.log('Generated signed URL:', signedUrl);
    } catch (urlError) {
      console.error('Failed to generate signed URL:', urlError);
      return new NextResponse('Failed to generate file URL', { status: 500 });
    }

    // 6. Update database
    try {
      console.log('Attempting to update user profile:', {
        userId,
        avatarUrl: signedUrl
      });

      // First, check if the user exists
      const { data: existingUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error checking user existence:', {
          error: userError,
          userId
        });
        return new NextResponse('User not found', { status: 404 });
      }

      // Then update the user
      const { data, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          avatar_url: signedUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error details:', {
          error: updateError,
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          userId,
          signedUrl
        });
        return new NextResponse(`Database update failed: ${updateError.message}`, { status: 500 });
      }

      console.log('Successfully updated user profile:', data);
      return NextResponse.json({ avatar_url: signedUrl });
    } catch (dbError) {
      console.error('Database error details:', {
        error: dbError,
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        userId,
        avatarUrl: signedUrl
      });
      return new NextResponse(
        `Failed to update user profile: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in avatar upload:', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error', 
      { status: 500 }
    );
  }
} 