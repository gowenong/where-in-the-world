import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, country, city, visitedLocations, tags, isStarred } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const person = await prisma.person.create({
      data: {
        name: name.trim(),
        country,
        city,
        isStarred: isStarred || false,
        visitedLocations: {
          create: visitedLocations,
        },
        tags: {
          create: tags,
        },
      },
      include: {
        visitedLocations: true,
        tags: true,
      },
    });

    return NextResponse.json({ success: true, person });
  } catch (error) {
    console.error('Error saving person:', error);
    return NextResponse.json({ success: false, error: 'Failed to save person', details: error.message }, { status: 500 });
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