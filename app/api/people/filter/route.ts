import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
  const starred = searchParams.get('starred') === 'true';
  const country = searchParams.get('country');
  const city = searchParams.get('city');
  const location = searchParams.get('location');

  try {
    const where: any = {};
    if (starred) {
      where.isStarred = true;
    }
    if (tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            in: tags
          }
        }
      };
    }
    if (country && city) {
      where.countryCity = {
        country,
        city,
      };
    } else if (country) {
      where.country = country;
    } else if (city) {
      where.city = city;
    }
    if (location) {
      where.visitedLocations = {
        some: {
          location,
        },
      };
    }

    const people = await prisma.person.findMany({
      where,
      include: {
        visitedLocations: true,
        tags: true,
        countryCity: true,
      },
    });

    return NextResponse.json({ success: true, people });
  } catch (error) {
    console.error('Error fetching filtered people:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch filtered people', 
      details: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}