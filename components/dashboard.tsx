"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import AddPerson from "@/components/AddPerson"
import PersonSearchResult from "@/components/PersonSearchResult"
import axios from 'axios';
import { X } from 'lucide-react';
import ViewPerson from '@/components/ViewPerson';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Star } from 'lucide-react';
import { Toast } from "@/components/ui/toast"

type Person = {
  id: number;
  name: string;
  country: string;
  city: string;
  visitedLocations: { id: number; location: string }[];
  tags: { id: number; tag: string }[];
  isStarred: boolean;
};

export function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const [viewingPerson, setViewingPerson] = useState(null);
  const [filterType, setFilterType] = useState<'starred' | 'tags'>('starred');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilteredLoading, setIsFilteredLoading] = useState(false);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        searchPeople();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !(searchRef.current as Node).contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleApiError = (error: unknown, defaultMessage: string) => {
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data.error || defaultMessage;
    }
    return defaultMessage;
  };

  const searchPeople = async () => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const response = await axios.get(`/api/people/search?q=${searchQuery}&limit=10`);
      if (response.data && response.data.people) {
        setSearchResults(response.data.people);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'An error occurred while searching');
      setSearchError(errorMessage);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEdit = async (person: { id: number }) => {
    try {
      const response = await axios.get(`/api/people/${person.id}`);
      if (response.data && response.data.success) {
        setEditingPerson(response.data.person);
        setViewingPerson(null);
      } else {
        throw new Error('Failed to fetch full person data');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to fetch person data');
      alert(errorMessage);
    }
  };

  const handleCloseEdit = () => {
    setEditingPerson(null);
    if (viewingPerson) {
      handleView(viewingPerson);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleClearLocationSearch = () => {
    setLocationQuery('');
  };

  const handleLocationSearch = () => {
    // TODO: Implement location search functionality
    console.log("Searching for location:", locationQuery);
  };

  const handleView = async (person: { id: number }) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const response = await axios.get(`/api/people/${person.id}`);
      if (response.data && response.data.success) {
        setViewingPerson(response.data.person);
        setShowDropdown(false);
      } else {
        throw new Error('Failed to fetch full person data');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to load person data');
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseView = () => {
    setViewingPerson(null);
  };

  const handleFilterChange = async () => {
    setIsFilteredLoading(true);
    try {
      let queryParams = new URLSearchParams();
      if (filterType === 'starred') {
        queryParams.append('starred', 'true');
      } else if (selectedTags.length > 0) {
        queryParams.append('tags', selectedTags.join(','));
      }
      if (locationQuery) {
        queryParams.append('location', locationQuery);
      }

      const response = await axios.get(`/api/people/filter?${queryParams.toString()}`);
      if (response.data.success) {
        setFilteredPeople(response.data.people);
      } else {
        throw new Error('Failed to fetch filtered people');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to fetch filtered people');
      alert(errorMessage);
    } finally {
      setIsFilteredLoading(false);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const response = await axios.get('/api/tags');
      if (response.data && response.data.tags) {
        setAvailableTags(response.data.tags);
      } else {
        throw new Error('Failed to fetch available tags');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to fetch available tags');
      alert(errorMessage);
    }
  };

  useEffect(() => {
    fetchAvailableTags();
  }, []);

  useEffect(() => {
    handleFilterChange();
  }, [filterType, selectedTags, locationQuery]);

  useEffect(() => {
    if (filterType === 'tags' && availableTags.length === 1 && selectedTags.length === 0) {
      setSelectedTags([availableTags[0]]);
    }
  }, [filterType, availableTags, selectedTags]);

  const handlePersonUpdate = async () => {
    await handleFilterChange();
    await fetchAvailableTags();
  };

  const handleStarToggle = async (personId: number, isStarred: boolean) => {
    try {
      const response = await axios.put(`/api/people/${personId}`, { isStarred });
      if (response.data && response.data.success) {
        // Update filteredPeople state
        setFilteredPeople(prevPeople => {
          let updatedPeople = prevPeople.map((p: { id: number }) =>
            p.id === personId ? { ...p, isStarred } : p
          );
          
          if (filterType === 'starred') {
            if (!isStarred) {
              // Remove unstarred person from the list
              updatedPeople = updatedPeople.filter((p: { id: number }) => p.id !== personId);
            } else if (!prevPeople.some((p: { id: number }) => p.id === personId)) {
              // Add newly starred person to the list
              updatedPeople = [...updatedPeople, response.data.person].sort((a: { name: string }, b: { name: string }) => 
                a.name.localeCompare(b.name)
              );
            }
          }
          
          return updatedPeople;
        });

        // Update viewingPerson state if it's the same person
        if (viewingPerson && viewingPerson.id === personId) {
          setViewingPerson({ ...viewingPerson, isStarred });
        }

        // If we're not already viewing starred people and a person was starred,
        // we might want to fetch the updated list of starred people
        if (isStarred && filterType !== 'starred') {
          handleFilterChange();
        }

        setToast({ message: `Person ${isStarred ? 'starred' : 'unstarred'} successfully`, type: 'success' });
      } else {
        throw new Error('Failed to update star status');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update star status');
      alert(errorMessage);
    }
  };

  const handleDeletePerson = async (personId: number) => {
    try {
      const response = await axios.delete(`/api/people/${personId}`);
      if (response.data && response.data.success) {
        setFilteredPeople(prevPeople => prevPeople.filter((p: { id: number }) => p.id !== personId));
        setViewingPerson(null);
        setToast({ message: 'Person deleted successfully', type: 'success' });
      } else {
        throw new Error('Failed to delete person');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to delete person');
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleAddPersonClose = () => {
    setIsAddPersonOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white py-4">
        <div className="container mx-auto flex justify-center items-center">
          <h1 className="text-3xl font-bold">Where in the World</h1>
        </div>
      </header>
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center mb-6 gap-4">
          <div className="w-1/4 relative" ref={searchRef}>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  setSelectedIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex((prevIndex) => {
                      const nextIndex = prevIndex < searchResults.length - 1 ? prevIndex + 1 : prevIndex;
                      const dropdown = document.querySelector('.search-results-dropdown');
                      const selectedItem = dropdown?.children[nextIndex] as HTMLElement;
                      if (selectedItem) {
                        selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                      return nextIndex;
                    });
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex((prevIndex) => {
                      const nextIndex = prevIndex > 0 ? prevIndex - 1 : -1;
                      const dropdown = document.querySelector('.search-results-dropdown');
                      const selectedItem = dropdown?.children[nextIndex] as HTMLElement;
                      if (selectedItem) {
                        selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                      return nextIndex;
                    });
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
                      handleView(searchResults[selectedIndex]);
                    }
                  }
                }}
                className="w-full pr-10"
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={handleClearSearch}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchError && <p className="mt-2 text-red-500">{searchError}</p>}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto search-results-dropdown">
                {searchResults.map((person, index) => (
                  <PersonSearchResult 
                    key={person.id} 
                    person={person} 
                    onEdit={handleEdit} 
                    onView={handleView}
                    isSelected={index === selectedIndex}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="w-1/4 relative">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search location..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full pr-10"
              />
              {locationQuery && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={handleClearLocationSearch}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <Button onClick={handleLocationSearch} className="ml-2">Search</Button>
          <div className="flex-grow flex justify-end">
            <AddPerson
              isEditing={false}
              personData={null}
              onClose={handleAddPersonClose}
              onUpdate={handlePersonUpdate}
              availableTags={availableTags}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1">
            <h2 className="text-xl font-bold mb-4">Filtered People</h2>
            <div className="mb-4">
              <Select
                value={filterType}
                onValueChange={(value: 'starred' | 'tags') => setFilterType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starred">Starred</SelectItem>
                  <SelectItem value="tags">Tags</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filterType === 'tags' && (
              <div className="mb-4">
                <Select
                  multiple
                  value={selectedTags}
                  onValueChange={(value) => {
                    setSelectedTags(Array.isArray(value) ? value : [value]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tags">
                      {selectedTags.length > 0 ? selectedTags.join(', ') : 'Select tags'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              {isFilteredLoading ? (
                <div className="flex justify-center items-center h-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : filterType === 'tags' && availableTags.length === 0 ? (
                <p>No tags available.</p>
              ) : filterType === 'tags' && availableTags.length === 1 && selectedTags.length === 0 ? (
                <p>Showing people for the only available tag: {availableTags[0]}</p>
              ) : filterType === 'tags' && selectedTags.length === 0 ? (
                <p>Please select a tag to view people.</p>
              ) : filteredPeople.length > 0 ? (
                filteredPeople.map((person: Person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleView(person)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold">{getInitials(person.name)}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{person.name}</p>
                        <p className="text-sm text-gray-500">{[person.city, person.country].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStarToggle(person.id, !person.isStarred);
                      }}
                    >
                      <Star className={`h-5 w-5 ${person.isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    </Button>
                  </div>
                ))
              ) : (
                <p>No people found.</p>
              )}
            </div>
          </div>
          <div className="col-span-3">
            <h2 className="text-xl font-bold mb-4">Map</h2>
            <div className="bg-gray-200 h-[500px] flex items-center justify-center">
              <p>Map placeholder - Mapbox integration coming soon</p>
            </div>
          </div>
        </div>
      </div>
      {editingPerson && (
        <AddPerson
          isEditing={true}
          personData={editingPerson}
          onClose={handleCloseEdit}
          onUpdate={handlePersonUpdate}
          onEditClose={() => {
            if (viewingPerson) {
              handleView(viewingPerson);
            }
          }}
          availableTags={availableTags}
        />
      )}
      {viewingPerson && (
        <ViewPerson
          person={viewingPerson}
          onEdit={() => handleEdit(viewingPerson)}
          onClose={handleCloseView}
          onStarToggle={handleStarToggle}
          onDelete={handleDeletePerson}
        />
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}