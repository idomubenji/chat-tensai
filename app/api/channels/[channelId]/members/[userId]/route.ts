import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateMemberSchema = z.object({
  roleInChannel: z.enum(['ADMIN', 'MEMBER']),
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
  { params }: { params: { channelId: string; userId: string } }
) {
  const { userId: currentUserId } = auth();

  if (!currentUserId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if current user is channel admin
    if (!(await isChannelAdmin(currentUserId, params.channelId))) {
      return new NextResponse('Forbidden - Admin access required', { status: 403 });
    }

    const json = await req.json();
    const body = updateMemberSchema.parse(json);

    const membership = await prisma.channelMember.update({
      where: {
        channelId_userId: {
          channelId: params.channelId,
          userId: params.userId,
        },
      },
      data: {
        roleInChannel: body.roleInChannel,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(membership);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 });
    }

    console.error('[CHANNEL_MEMBER_UPDATE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { channelId: string; userId: string } }
) {
  const { userId: currentUserId } = auth();

  if (!currentUserId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Allow users to remove themselves, or admins to remove others
    if (
      currentUserId !== params.userId &&
      !(await isChannelAdmin(currentUserId, params.channelId))
    ) {
      return new NextResponse('Forbidden - Admin access required', { status: 403 });
    }

    // Check if this is the last admin
    if (await isChannelAdmin(params.userId, params.channelId)) {
      const adminCount = await prisma.channelMember.count({
        where: {
          channelId: params.channelId,
          roleInChannel: 'ADMIN',
        },
      });

      if (adminCount <= 1) {
        return new NextResponse(
          'Cannot remove last admin - Promote another member first',
          { status: 400 }
        );
      }
    }

    await prisma.channelMember.delete({
      where: {
        channelId_userId: {
          channelId: params.channelId,
          userId: params.userId,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[CHANNEL_MEMBER_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 