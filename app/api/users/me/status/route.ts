import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['ONLINE', 'OFFLINE', 'AWAY']),
});

export async function PUT(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const json = await req.json();
    const body = updateStatusSchema.parse(json);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: body.status,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 });
    }

    console.error('[USER_STATUS_UPDATE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 