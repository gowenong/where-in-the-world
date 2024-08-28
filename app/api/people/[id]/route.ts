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

    const updatedPerson = await prisma.$transaction(async (prisma) => {
      let updateData: any = { ...body };
      
      if (body.country && body.city) {
        const countryCity = await prisma.countryCity.upsert({
          where: { country_city: { country: body.country, city: body.city } },
          update: {},
          create: { country: body.country, city: body.city },
        });
        updateData.countryCityId = countryCity.id;
      } else {
        // If either country or city is missing, remove the association
        updateData.countryCityId = null;
      }

      if (body.visitedLocations) {
        // Disconnect all existing locations
        await prisma.person.update({
          where: { id },
          data: {
            visitedLocations: {
              set: [],
            },
          },
        });

        // Create new locations and connect them to the person
        const locationPromises = body.visitedLocations.map(async (location: string) => {
          const existingLocation = await prisma.visitedLocation.findFirst({
            where: { location },
          });

          if (existingLocation) {
            return existingLocation.id;
          } else {
            const newLocation = await prisma.visitedLocation.create({
              data: { location },
            });
            return newLocation.id;
          }
        });

        const locationIds = await Promise.all(locationPromises);

        updateData.visitedLocations = {
          connect: locationIds.map(id => ({ id })),
        };
      }

      if (body.tags) {
        // Disconnect all existing tags
        await prisma.person.update({
          where: { id },
          data: {
            tags: {
              set: [],
            },
          },
        });

        // Create new tags and connect them to the person
        const tagPromises = body.tags.map(async (tag: string) => {
          const existingTag = await prisma.tag.findFirst({
            where: { tag },
          });

          if (existingTag) {
            return existingTag.id;
          } else {
            const newTag = await prisma.tag.create({
              data: { tag },
            });
            return newTag.id;
          }
        });

        const tagIds = await Promise.all(tagPromises);

        updateData.tags = {
          connect: tagIds.map(id => ({ id })),
        };
      }

      const updatedPerson = await prisma.person.update({
        where: { id },
        data: updateData,
        include: {
          visitedLocations: true,
          tags: true,
          countryCity: true,
        },
      });

      // Clean up unused VisitedLocations
      await prisma.visitedLocation.deleteMany({
        where: {
          persons: { none: {} },
        },
      });

      // Clean up unused Tags
      await prisma.tag.deleteMany({
        where: {
          persons: { none: {} },
        },
      });

      // Clean up unused CountryCities
      await prisma.countryCity.deleteMany({
        where: {
          persons: { none: {} },
        },
      });

      return updatedPerson;
    });

    console.log('Updated person:', updatedPerson);
    return NextResponse.json({ success: true, person: updatedPerson });
  } catch (error: unknown) {
    console.error('Detailed error updating person:', error);
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Person not found' }, { status: 404 });
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update person', 
      details: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
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
        countryCity: true,
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

    await prisma.$transaction(async (prisma) => {
      await prisma.person.delete({
        where: { id },
      });

      // Clean up unused VisitedLocations
      await prisma.visitedLocation.deleteMany({
        where: {
          persons: { none: {} },
        },
      });

      // Clean up unused Tags
      await prisma.tag.deleteMany({
        where: {
          persons: { none: {} },
        },
      });

      // Clean up unused CountryCities
      await prisma.countryCity.deleteMany({
        where: {
          persons: { none: {} },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete person' }, { status: 500 });
  }
}