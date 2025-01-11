import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export async function GET() {
  console.log('\n=== S3 CONNECTION TEST: START ===');
  
  // First verify environment variables
  if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
    console.error('Missing required AWS environment variables:', {
      hasRegion: !!process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasBucketName: !!process.env.S3_BUCKET_NAME
    });
    return NextResponse.json({
      success: false,
      error: 'Missing required AWS environment variables',
      missingVars: {
        AWS_REGION: !process.env.AWS_REGION,
        AWS_ACCESS_KEY_ID: !process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: !process.env.AWS_SECRET_ACCESS_KEY,
        S3_BUCKET_NAME: !process.env.S3_BUCKET_NAME
      }
    }, { status: 500 });
  }

  try {
    console.log('Testing S3 connection with:', {
      bucket: process.env.S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
    });

    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      MaxKeys: 1,
      Prefix: 'avatars/',
    });

    console.log('Sending ListObjectsV2Command...');
    const response = await s3.send(command);
    console.log('Received response:', {
      success: true,
      objectCount: response.KeyCount,
      hasContents: !!response.Contents,
      contentsLength: response.Contents?.length
    });
    
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to S3',
      bucketName: process.env.S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
      objectCount: response.KeyCount,
      objects: response.Contents?.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
      }))
    });
  } catch (error: any) {
    console.error('S3 test error:', {
      error,
      name: error.name,
      message: error.message,
      code: error.Code,
      bucket: process.env.S3_BUCKET_NAME,
      region: process.env.AWS_REGION
    });

    return NextResponse.json({
      success: false,
      error: error.message,
      name: error.name,
      code: error.Code,
      bucket: process.env.S3_BUCKET_NAME,
      region: process.env.AWS_REGION
    }, { status: 500 });
  } finally {
    console.log('=== S3 CONNECTION TEST: END ===\n');
  }
} 