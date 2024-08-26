import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, country, city, visitedLocations, tags, isStarred } = await request.json();

    const person = await prisma.person.create({
      data: {
        name,
        country,
        city,
        isStarred,
        visitedLocations: {
          create: visitedLocations.map((location: string) => ({ location })),
        },
        tags: {
          create: tags.map((tag: string) => ({ tag })),
        },
      },
    });

    return NextResponse.json({ success: true, personId: person.id });
  } catch (error) {
    console.error('Error saving person:', error);
    return NextResponse.json({ success: false, error: 'Failed to save person' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    await prisma.person.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete person' }, { status: 500 });
  }
}