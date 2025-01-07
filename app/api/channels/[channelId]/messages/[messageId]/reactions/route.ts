import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type ReactionWithUser = {
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

type GroupedReactions = Record<string, {
  count: number;
  users: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
  }>;
}>;

const reactionSchema = z.object({
  emoji: z.string().min(1).max(10), // Unicode emoji or custom emoji ID
});

export async function GET(
  req: Request,
  { params }: { params: { channelId: string; messageId: string } }
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

    // Get all reactions for the message with user details
    const reactions = await (prisma as any).messageReaction.findMany({
      where: {
        messageId: params.messageId,
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc: GroupedReactions, reaction: ReactionWithUser) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          count: 0,
          users: [],
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user);
      return acc;
    }, {});

    return NextResponse.json(groupedReactions);
  } catch (error) {
    console.error('[MESSAGE_REACTIONS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { channelId: string; messageId: string } }
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
    const body = reactionSchema.parse(json);

    // Check if reaction already exists
    const existingReaction = await (prisma as any).messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId: params.messageId,
          userId,
          emoji: body.emoji,
        },
      },
    });

    if (existingReaction) {
      // Remove reaction if it exists
      await (prisma as any).messageReaction.delete({
        where: {
          messageId_userId_emoji: {
            messageId: params.messageId,
            userId,
            emoji: body.emoji,
          },
        },
      });
    } else {
      // Add new reaction
      // First check if user has reached the reaction limit
      const userReactionCount = await (prisma as any).messageReaction.count({
        where: {
          messageId: params.messageId,
          userId,
        },
      });

      if (userReactionCount >= 10) {
        return new NextResponse('Maximum reactions reached', { status: 400 });
      }

      await (prisma as any).messageReaction.create({
        data: {
          messageId: params.messageId,
          userId,
          emoji: body.emoji,
        },
      });
    }

    // Return updated reactions for the message with user details
    const reactions = await (prisma as any).messageReaction.findMany({
      where: {
        messageId: params.messageId,
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc: GroupedReactions, reaction: ReactionWithUser) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          count: 0,
          users: [],
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user);
      return acc;
    }, {});

    return NextResponse.json(groupedReactions);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 });
    }

    console.error('[MESSAGE_REACTION]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 