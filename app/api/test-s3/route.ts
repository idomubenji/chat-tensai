import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME!,
      MaxKeys: 1,
    });

    const response = await s3Client.send(command);

    return NextResponse.json({
      success: true,
      message: 'S3 connection successful',
      bucketName: process.env.AWS_BUCKET_NAME,
      region: process.env.AWS_REGION,
      hasObjects: (response.Contents ?? []).length > 0,
      firstObject: response.Contents?.[0]?.Key ?? null
    });
  } catch (error: any) {
    console.error('S3 test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.Code,
      bucketName: process.env.AWS_BUCKET_NAME,
      region: process.env.AWS_REGION
    }, { status: 500 });
  }
} 