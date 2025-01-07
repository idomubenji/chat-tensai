import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/app/lib/auth';
import { Message, File } from '@/app/types';

export async function GET(req: NextRequest) {
  const user = await authenticateUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchQuery = req.nextUrl.searchParams.get('q');

  if (!searchQuery) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  // Mock data - in a real app, you'd search your database
  const messages: Message[] = [
    {
      id: '1',
      content: 'This is a sample message containing the search query',
      created_at: new Date(),
      updated_at: new Date(),
      channel_id: '1',
      user_id: '1',
      parent_id: null,
    },
  ];

  const files: File[] = [
    {
      id: '1',
      url: 'https://example.com/file.pdf',
      uploaded_by: '1',
      message_id: '1',
      uploaded_at: new Date(),
    },
  ];

  return NextResponse.json({ messages, files });
}

