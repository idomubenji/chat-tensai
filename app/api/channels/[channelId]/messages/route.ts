import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { Message, User, Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema for message creation
const createMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(), // For thread replies
});

// Schema for message query parameters
const messageQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  parentId: z.string().optional(), // For fetching thread replies
});

type MessageWithUserAndReactions = Message & {
  user: Pick<User, 'id' | 'name' | 'avatarUrl' | 'role'>;
  reactions: {
    messageId: string;
    userId: string;
    emoji: string;
    user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  }[];
};

type MessageResponse = {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userRole: string;
  createdAt: string;
  reactions: Record<string, { emoji: string; userIds: string[] }>;
};

export async function GET(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if user is a member of the channel
    const membership = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId: params.channelId,
          userId,
        },
      },
    });

    if (!membership) {
      return new NextResponse('Not a channel member', { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId: params.channelId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    } as Prisma.MessageFindManyArgs);

    // Transform the messages to include user info
    const formattedMessages: MessageResponse[] = (messages as MessageWithUserAndReactions[]).map(message => ({
      id: message.id,
      content: message.content,
      userId: message.userId,
      userName: message.user.name,
      userRole: message.user.role,
      createdAt: message.createdAt.toISOString(),
      reactions: message.reactions.reduce<Record<string, { emoji: string; userIds: string[] }>>((acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            userIds: [],
          };
        }
        acc[reaction.emoji].userIds.push(reaction.userId);
        return acc;
      }, {}),
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('[MESSAGES_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Check if user is a member of the channel
    const membership = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId: params.channelId,
          userId,
        },
      },
    });

    if (!membership) {
      return new NextResponse('Not a channel member', { status: 403 });
    }

    const json = await req.json();
    const body = createMessageSchema.parse(json);

    // If this is a reply, verify parent message exists and is in the same channel
    if (body.parentId) {
      const parentMessage = await prisma.message.findUnique({
        where: { id: body.parentId },
        select: { channelId: true },
      });

      if (!parentMessage) {
        return new NextResponse('Parent message not found', { status: 404 });
      }

      if (parentMessage.channelId !== params.channelId) {
        return new NextResponse('Parent message not in this channel', { status: 400 });
      }
    }

    const message = await prisma.message.create({
      data: {
        content: body.content,
        channelId: params.channelId,
        userId,
        parentId: body.parentId,
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

    console.error('[MESSAGES_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

