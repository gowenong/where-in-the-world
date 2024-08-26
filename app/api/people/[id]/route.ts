import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    const { name, country, city, visitedLocations, tags, isStarred } = await request.json();

    const updatedPerson = await prisma.person.update({
      where: { id },
      data: {
        name,
        country,
        city,
        isStarred,
        visitedLocations: {
          deleteMany: {},
          create: visitedLocations.map((location: string) => ({ location })),
        },
        tags: {
          deleteMany: {},
          create: tags.map((tag: string) => ({ tag })),
        },
      },
    });

    return NextResponse.json({ success: true, person: updatedPerson });
  } catch (error) {
    console.error('Error updating person:', error);
    return NextResponse.json({ success: false, error: 'Failed to update person' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    const person = await prisma.person.findUnique({
      where: { id },
      include: {
        visitedLocations: true,
        tags: true,
      },
    });

    if (!person) {
      return NextResponse.json({ success: false, error: 'Person not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, person });
  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch person' }, { status: 500 });
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