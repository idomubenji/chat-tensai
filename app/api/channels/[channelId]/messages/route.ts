import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs";

type Reaction = {
  emoji: string;
  userIds: string[]; // List of users who reacted with this emoji
};

// Temporary in-memory storage until we set up the database
let messages: {
  id: string;
  content: string;
  userId: string;
  userName: string;
  channelId: string;
  createdAt: string;
  reactions: { [key: string]: Reaction }; // Map emoji to reaction data
  parentId?: string; // Add this for thread support
}[] = [];

export async function GET(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Return messages for this channel
  const channelMessages = messages.filter(
    (message) => message.channelId === params.channelId
  );

  return NextResponse.json(channelMessages);
}

export async function POST(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId || !user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { content, parentId } = await req.json();

    // Create a new message
    const newMessage = {
      id: Math.random().toString(36).substring(7),
      content,
      userId,
      userName: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.username || user.emailAddresses[0].emailAddress.split('@')[0],
      channelId: params.channelId,
      createdAt: new Date().toISOString(),
      reactions: {},
      parentId, // Add the parentId if it exists
    };

    messages.push(newMessage);

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Add a reaction to a message
export async function PUT(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId || !user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { messageId, emoji } = await req.json();
    const message = messages.find(m => m.id === messageId);

    if (!message) {
      return new NextResponse("Message not found", { status: 404 });
    }

    // Initialize reaction if it doesn't exist
    if (!message.reactions[emoji]) {
      message.reactions[emoji] = { emoji, userIds: [] };
    }

    const reaction = message.reactions[emoji];

    // Check if user already reacted with this emoji
    if (reaction.userIds.includes(userId)) {
      // Remove the reaction if user already added it
      reaction.userIds = reaction.userIds.filter(id => id !== userId);
      if (reaction.userIds.length === 0) {
        delete message.reactions[emoji];
      }
    } else {
      // Add the reaction if user hasn't reacted with this emoji
      // Check if user has reached the limit of 10 reactions per message
      const userReactionCount = Object.values(message.reactions)
        .filter(r => r.userIds.includes(userId))
        .length;

      if (userReactionCount >= 10) {
        return new NextResponse("Maximum reactions reached", { status: 400 });
      }

      reaction.userIds.push(userId);
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("[MESSAGES_REACTION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
