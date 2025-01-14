import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';

const URL_EXPIRATION = 604800; // 7 days in seconds

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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

export async function GET(
  request: Request,
  { params }: { params: { key: string } }
) {
  try {
    // Auth check
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { key } = params;
    if (!key) {
      return new NextResponse('Missing avatar key', { status: 400 });
    }

    // If it's the default avatar, return it directly
    if (key === 'default-avatar.jpeg') {
      return NextResponse.json({ url: '/default-avatar.jpeg' });
    }

    const s3 = getS3Client();
    const command = new GetObjectCommand({
      Bucket: getRequiredEnvVar('AWS_BUCKET_NAME'),
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: URL_EXPIRATION });
    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal Server Error',
      { status: 500 }
    );
  }
} 