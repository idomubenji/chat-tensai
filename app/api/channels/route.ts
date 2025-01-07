import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for channel creation
const createChannelSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  isPrivate: z.boolean().default(false),
});

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Get all channels where the user is a member
    const channels = await prisma.channel.findMany({
      where: {
        channelMembers: {
          some: {
            userId,
          },
        },
      },
      include: {
        _count: {
          select: {
            channelMembers: true,
            messages: true,
          },
        },
        channelMembers: {
          where: {
            userId,
          },
          select: {
            roleInChannel: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(channels);
  } catch (error) {
    console.error('[CHANNELS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const json = await req.json();
    const body = createChannelSchema.parse(json);

    // Check if user is an admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return new NextResponse('Forbidden - Admin access required', { status: 403 });
    }

    // Create channel and add creator as admin member
    const channel = await prisma.$transaction(async (tx) => {
      const newChannel = await tx.channel.create({
        data: {
          name: body.name,
          description: body.description,
          isPrivate: body.isPrivate,
          createdById: userId,
        },
      });

      // Add creator as admin member
      await tx.channelMember.create({
        data: {
          channelId: newChannel.id,
          userId: userId,
          roleInChannel: 'ADMIN',
        },
      });

      return newChannel;
    });

    return NextResponse.json(channel);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 });
    }

    console.error('[CHANNELS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 