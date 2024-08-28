import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, country, city, visitedLocations, tags, isStarred } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    if ((country && !city) || (!country && city)) {
      return NextResponse.json({ success: false, error: 'Both country and city must be provided if either is specified' }, { status: 400 });
    }

    const person = await prisma.$transaction(async (prisma) => {
      let countryCityId = null;
      if (country && city) {
        const countryCity = await prisma.countryCity.upsert({
          where: { country_city: { country, city } },
          update: {},
          create: { country, city },
        });
        countryCityId = countryCity.id;
      }

      const createdPerson = await prisma.person.create({
        data: {
          name: name.trim(),
          country,
          city,
          isStarred: isStarred || false,
          countryCityId,
          visitedLocations: {
            create: visitedLocations.map((location: string) => ({ location })),
          },
          tags: {
            create: tags.map((tag: string) => ({ tag })),
          },
        },
        include: {
          visitedLocations: true,
          tags: true,
          countryCity: true,
        },
      });

      return createdPerson;
    });

    return NextResponse.json({ success: true, person });
  } catch (error) {
    console.error('Error saving person:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save person', 
      details: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID provided' }, { status: 400 });
    }
    await prisma.person.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete person', 
      details: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}