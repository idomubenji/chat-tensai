import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if channel exists and is not private
    const channel = await prisma.channel.findUnique({
      where: { id: params.channelId },
      select: { isPrivate: true },
    });

    if (!channel) {
      return new NextResponse('Channel not found', { status: 404 });
    }

    if (channel.isPrivate) {
      return new NextResponse('Cannot join private channel directly', { status: 403 });
    }

    // Check if user is already a member
    const existingMembership = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId: params.channelId,
          userId,
        },
      },
    });

    if (existingMembership) {
      return new NextResponse('Already a member', { status: 400 });
    }

    // Add user as member
    const membership = await prisma.channelMember.create({
      data: {
        channelId: params.channelId,
        userId,
        roleInChannel: 'MEMBER',
      },
      include: {
        channel: true,
      },
    });

    return NextResponse.json(membership);
  } catch (error) {
    console.error('[CHANNEL_JOIN]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 