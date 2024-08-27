import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Star, X, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
  onStarToggle: (personId: number, isStarred: boolean) => void;
  onDelete: (personId: number) => void;
}

const getInitials = (name: string) => {
  const nameParts = name.trim().split(/\s+/);
  if (nameParts.length === 0 || name.trim() === '') {
    return '';
  } else if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  } else {
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }
};

export default function ViewPerson({ person, onEdit, onClose, onStarToggle, onDelete }: ViewPersonProps) {
  const initials = getInitials(person.name);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const location = [person.city, person.country].filter(Boolean).join(', ');

  const handleStarToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStarToggle(person.id, !person.isStarred);
  };

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

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
                variant="destructive"
                size="icon"
                onClick={() => setShowDeleteConfirmation(true)}
              >
                <Trash2 className="h-4 w-4" />
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
                <Star
                  className={`h-6 w-6 cursor-pointer ${person.isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  onClick={handleStarToggle}
                />
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
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {person.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmation(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(person.id);
                setShowDeleteConfirmation(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}