import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  if (!query) {
    return NextResponse.json({ success: false, error: 'Search query is required' }, { status: 400 });
  }

  try {
    const people = await prisma.person.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: limit,
      select: {
        id: true,
        name: true,
        country: true,
        city: true,
      },
    });

    return NextResponse.json({ success: true, people });
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to search people', 
      details: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}