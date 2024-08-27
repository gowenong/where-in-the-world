import { Button } from "@/components/ui/button"

interface PersonSearchResultProps {
  person: {
    id: number;
    name: string;
    country?: string;
    city?: string;
  };
  onEdit: (person: any) => void;
  onView: (person: any) => void;
  isSelected: boolean;
}

export default function PersonSearchResult({ person, onEdit, onView, isSelected }: PersonSearchResultProps) {
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

  const initials = getInitials(person.name);

  const location = [person.city, person.country].filter(Boolean).join(', ');

  return (
    <div 
      className={`flex items-center justify-between p-2 cursor-pointer ${
        isSelected ? 'bg-gray-200' : 'hover:bg-gray-100'
      }`}
      onClick={() => onView(person)}
    >
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-3">
          <span className="text-sm font-semibold">{initials}</span>
        </div>
        <div>
          <p className="font-semibold">{person.name}</p>
          {location && <p className="text-sm text-gray-500">{location}</p>}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(person); }}>Edit</Button>
    </div>
  );
}