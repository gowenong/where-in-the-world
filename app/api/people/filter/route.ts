import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
  const starred = searchParams.get('starred') === 'true';

  try {
    const people = await prisma.person.findMany({
      where: {
        ...(starred ? { isStarred: true } : {}),
        ...(tags.length > 0 ? {
          tags: {
            some: {
              tag: {
                in: tags
              }
            }
          }
        } : {}),
      },
      include: {
        visitedLocations: true,
        tags: true,
      },
    });

    return NextResponse.json({ success: true, people });
  } catch (error) {
    console.error('Error fetching filtered people:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch filtered people' }, { status: 500 });
  }
}