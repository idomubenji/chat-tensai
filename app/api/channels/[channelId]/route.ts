import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateChannelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  isPrivate: z.boolean().optional(),
});

async function isChannelAdmin(userId: string, channelId: string) {
  const membership = await prisma.channelMember.findUnique({
    where: {
      channelId_userId: {
        channelId,
        userId,
      },
    },
    select: { roleInChannel: true },
  });

  return membership?.roleInChannel === 'ADMIN';
}

export async function PUT(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if user is channel admin
    if (!(await isChannelAdmin(userId, params.channelId))) {
      return new NextResponse('Forbidden - Admin access required', { status: 403 });
    }

    const json = await req.json();
    const body = updateChannelSchema.parse(json);

    const channel = await prisma.channel.update({
      where: { id: params.channelId },
      data: {
        name: body.name,
        description: body.description,
        isPrivate: body.isPrivate,
      },
    });

    return NextResponse.json(channel);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 });
    }

    console.error('[CHANNEL_UPDATE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if user is channel admin
    if (!(await isChannelAdmin(userId, params.channelId))) {
      return new NextResponse('Forbidden - Admin access required', { status: 403 });
    }

    // Delete channel and all related data
    await prisma.channel.delete({
      where: { id: params.channelId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[CHANNEL_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 