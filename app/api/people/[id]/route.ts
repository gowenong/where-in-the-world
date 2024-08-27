import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    console.log('Received update data:', body);

    const { isStarred, visitedLocations, tags, ...otherData } = body;

    if (typeof isStarred !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid isStarred value' }, { status: 400 });
    }

    const updatedPerson = await prisma.person.update({
      where: { id },
      data: {
        ...otherData,
        isStarred,
        visitedLocations: visitedLocations ? {
          deleteMany: {},
          create: visitedLocations.map(({ location }) => ({ location }))
        } : undefined,
        tags: tags ? {
          deleteMany: {},
          create: tags.map(({ tag }) => ({ tag }))
        } : undefined
      },
      include: {
        visitedLocations: true,
        tags: true
      }
    });

    console.log('Updated person:', updatedPerson);
    return NextResponse.json({ success: true, person: updatedPerson });
  } catch (error) {
    console.error('Detailed error updating person:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Person not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: 'Failed to update person', details: error.message }, { status: 500 });
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
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.person.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete person' }, { status: 500 });
  }
}