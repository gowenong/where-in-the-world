import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Star, X, Edit } from 'lucide-react';

interface ViewPersonProps {
  person: {
    id: number;
    name: string;
    country?: string;
    city?: string;
    visitedLocations: { id: number; location: string }[];
    tags: { id: number; tag: string }[];
    isStarred: boolean;
  };
  onEdit: () => void;
  onClose: () => void;
}

export default function ViewPerson({ person, onEdit, onClose }: ViewPersonProps) {
  const initials = person.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const location = [person.city, person.country].filter(Boolean).join(', ');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleOverlayClick}>
      <Card className="w-full max-w-2xl mx-auto bg-white relative z-50 overflow-hidden">
        <CardHeader className="relative pb-0">
          <div className="flex justify-between items-center mb-4">
            <CardTitle className="text-2xl font-bold">View Person</CardTitle>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
              <span className="text-3xl font-semibold">{initials}</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold">{person.name}</h2>
                {person.isStarred && <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />}
              </div>
              {location && <p className="text-gray-500">{location}</p>}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Visited Locations</h3>
            <div className="flex flex-wrap gap-2">
              {person.visitedLocations.map((location) => (
                <Button
                  key={location.id}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  {location.location}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {person.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm"
                >
                  {tag.tag}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}