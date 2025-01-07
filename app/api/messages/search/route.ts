import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
});

export async function GET(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchQuerySchema.parse({
      q: searchParams.get('q'),
      limit: Number(searchParams.get('limit')) || 20,
      offset: Number(searchParams.get('offset')) || 0,
    });

    // Get channels the user is a member of
    const userChannels = await prisma.channelMember.findMany({
      where: { userId },
      select: { channelId: true },
    });

    const channelIds = userChannels.map(c => c.channelId);

    // Search messages in user's channels
    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where: {
          channelId: { in: channelIds },
          content: { contains: query.q, mode: 'insensitive' },
        },
        include: {
          channel: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: [
          {
            createdAt: 'desc',
          },
        ],
        take: query.limit,
        skip: query.offset,
      }),
      prisma.message.count({
        where: {
          channelId: { in: channelIds },
          content: { contains: query.q, mode: 'insensitive' },
        },
      }),
    ]);

    // Search files in user's channels
    const files = await prisma.file.findMany({
      where: {
        message: {
          channelId: { in: channelIds },
        },
        url: { contains: query.q, mode: 'insensitive' },
      },
      include: {
        message: {
          select: {
            id: true,
            channelId: true,
            content: true,
            channel: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: query.limit,
    });

    return NextResponse.json({
      messages,
      files,
      totalCount,
      hasMore: query.offset + messages.length < totalCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid search parameters', { status: 422 });
    }

    console.error('[MESSAGES_SEARCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

