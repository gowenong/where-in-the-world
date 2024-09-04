import React, { useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AddPerson from '@/components/AddPerson';
import { X, Plus } from 'lucide-react';

type Person = {
  id: number;
  name: string;
  city: string;
  country: string;
  // Add other properties as needed
};

type CityInfoCardProps = {
  city: string;
  country: string;
  residents: Person[];
  visitors: Person[];
  onPersonClick: (person: Person) => void;
  onClose: () => void;
  onUpdate: () => void;
  onUpdateResidents: (updatedResidents: Person[]) => void;
  onUpdateVisitors: (updatedVisitors: Person[]) => void;
  availableTags: string[];
  newlyAddedPerson: Person | null;
};

const CityInfoCard: React.FC<CityInfoCardProps> = ({
  city,
  country,
  residents,
  visitors,
  onPersonClick,
  onClose,
  onUpdate,
  onUpdateResidents,
  onUpdateVisitors,
  availableTags,
  newlyAddedPerson
}) => {
  const updatePeople = useCallback(() => {
    if (newlyAddedPerson && (newlyAddedPerson.city === city && newlyAddedPerson.country === country)) {
      const updatedResidents = residents.map(r => {
        if (r.id === newlyAddedPerson.id) {
          return { ...r, ...newlyAddedPerson };
        }
        return r;
      });
      if (!updatedResidents.some(r => r.id === newlyAddedPerson.id)) {
        updatedResidents.push(newlyAddedPerson);
      }
      onUpdateResidents(updatedResidents);

      const updatedVisitors = visitors.filter(v => v.id !== newlyAddedPerson.id);
      onUpdateVisitors(updatedVisitors);

      onUpdate();
    }
  }, [newlyAddedPerson, city, country, residents, visitors, onUpdateResidents, onUpdateVisitors, onUpdate]);

  useEffect(() => {
    updatePeople();
  }, [updatePeople]);

  return (
    <Card className="w-64 absolute top-16 left-4 z-10">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="text-lg font-semibold">{city}, {country}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2 text-sm">Residents ({residents.length}):</h3>
        <ul className="mb-4 text-sm">
          {residents.map(person => (
            <li key={person.id} className="cursor-pointer hover:underline" onClick={() => onPersonClick(person)}>
              {person.name}
            </li>
          ))}
        </ul>
        <h3 className="font-semibold mb-2 text-sm">Visitors ({visitors.length}):</h3>
        <ul className="mb-4 text-sm">
          {visitors.map(person => (
            <li key={person.id} className="cursor-pointer hover:underline" onClick={() => onPersonClick(person)}>
              {person.name}
            </li>
          ))}
        </ul>
      </CardContent>
      <div className="absolute bottom-4 right-4">
        <AddPerson
          isEditing={false}
          personData={{ country, city }}
          onClose={() => {}}
          onUpdate={onUpdate}
          availableTags={availableTags}
          trigger={
            <Button size="icon" className="h-8 w-8 rounded-full">
              <Plus className="h-4 w-4" />
            </Button>
          }
        />
      </div>
    </Card>
  );
};

export default CityInfoCard;