import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

async function canManageMessage(userId: string, messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      userId: true,
      channel: {
        select: {
          channelMembers: {
            where: {
              userId,
              roleInChannel: 'ADMIN',
            },
          },
        },
      },
    },
  });

  if (!message) return false;

  // User can manage if they are the author or a channel admin
  return message.userId === userId || message.channel.channelMembers.length > 0;
}

export async function PUT(
  req: Request,
  { params }: { params: { channelId: string; messageId: string } }
) {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if user can edit the message
    if (!(await canManageMessage(userId, params.messageId))) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const json = await req.json();
    const body = updateMessageSchema.parse(json);

    const message = await prisma.message.update({
      where: { id: params.messageId },
      data: {
        content: body.content,
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

    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 });
    }

    console.error('[MESSAGE_UPDATE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { channelId: string; messageId: string } }
) {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if user can delete the message
    if (!(await canManageMessage(userId, params.messageId))) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    await prisma.message.delete({
      where: { id: params.messageId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[MESSAGE_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 