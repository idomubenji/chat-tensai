import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Test endpoint hit!');
  return NextResponse.json({ message: 'Test endpoint working!' });
}

export async function POST(req: Request) {
  console.log('Test POST endpoint hit!');
  const body = await req.json();
  console.log('Received body:', body);
  return NextResponse.json({ message: 'Test POST endpoint working!', received: body });
} 