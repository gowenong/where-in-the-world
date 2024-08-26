import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      distinct: ['tag'],
      select: { tag: true },
    });

    const uniqueTags = tags.map(t => t.tag);

    return NextResponse.json({ success: true, tags: uniqueTags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tags' }, { status: 500 });
  }
}
