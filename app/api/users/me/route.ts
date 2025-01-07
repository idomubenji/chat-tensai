import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/app/lib/auth';

export async function GET(req: NextRequest) {
  const user = await authenticateUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(user);
}

