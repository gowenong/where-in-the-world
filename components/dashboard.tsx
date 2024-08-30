"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
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
import WorldMap from '@/components/WorldMap';
import ErrorBoundary from '@/components/ErrorBoundary';

type Person = {
  id: number;
  name: string;
  country: string;
  city: string;
  visitedLocations: { id: number; location: string }[];
  tags: { id: number; tag: string }[];
  isStarred: boolean;
  latitude: number;
  longitude: number;
};

export function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const [viewingPerson, setViewingPerson] = useState(null);
  const [filterType, setFilterType] = useState<'all' | 'starred' | string>('all');
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilteredLoading, setIsFilteredLoading] = useState(false);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [submittedMapSearchQuery, setSubmittedMapSearchQuery] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [newlyAddedPerson, setNewlyAddedPerson] = useState<Person | null>(null);

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

  const handleFilterChange = async (value: string) => {
    setFilterType(value);
    setIsFilteredLoading(true);
    try {
      let queryParams = new URLSearchParams();
      if (value === 'starred') {
        queryParams.append('starred', 'true');
      } else if (value !== 'all') {
        queryParams.append('tags', value);
      }

      const response = await axios.get(`/api/people/filter?${queryParams.toString()}`);
      if (response.data.success) {
        // Sort the filtered people alphabetically
        const sortedPeople = response.data.people.sort((a: Person, b: Person) => a.name.localeCompare(b.name));
        setFilteredPeople(sortedPeople);
      } else {
        throw new Error('Failed to fetch filtered people');
      }
      return response.data; // Return the response data
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to fetch filtered people');
      setToast({ message: errorMessage, type: 'error' });
      return { success: false, error: errorMessage }; // Return an error object
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

  const handlePersonUpdate = async (updatedPerson: Person) => {
    try {
      setIsFilteredLoading(true);
      const response = await axios.get('/api/people/filter');
      if (response.data.success) {
        const sortedPeople = response.data.people.sort((a: Person, b: Person) => 
          a.name.localeCompare(b.name)
        );
        setFilteredPeople(sortedPeople);
        setNewlyAddedPerson(updatedPerson);
        
        // Refresh available tags
        await fetchAvailableTags();
        
        // If the filter is set to a specific tag, and the new person has that tag, refresh the filter
        if (filterType !== 'all' && filterType !== 'starred' && updatedPerson.tags.some(tag => tag.tag === filterType)) {
          await handleFilterChange(filterType);
        }
      } else {
        throw new Error('Failed to fetch updated people data');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update people data');
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsFilteredLoading(false);
    }
  };

  const handleStarToggle = async (personId: number, isStarred: boolean) => {
    try {
      const response = await axios.put(`/api/people/${personId}`, { isStarred });
      if (response.data && response.data.success) {
        // Update filteredPeople state
        setFilteredPeople(prevPeople => {
          const updatedPeople = prevPeople.map(p =>
            p.id === personId ? { ...p, isStarred } : p
          );
          
          // Always sort the list alphabetically
          return updatedPeople.sort((a, b) => a.name.localeCompare(b.name));
        });

        // Update viewingPerson state if it's the same person
        if (viewingPerson && viewingPerson.id === personId) {
          setViewingPerson({ ...viewingPerson, isStarred });
        }

        // If we're viewing starred people and a person was unstarred, we need to remove them
        if (filterType === 'starred' && !isStarred) {
          setFilteredPeople(prevPeople => 
            prevPeople.filter(p => p.id !== personId).sort((a, b) => a.name.localeCompare(b.name))
          );
        }

        // If we're not viewing starred people and a person was starred, we don't need to add them
        // They will appear when the user switches to the 'starred' filter
      } else {
        throw new Error('Failed to update star status');
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update star status');
      console.error(errorMessage);
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

  const handleMapSearchSubmit = (query: string) => {
    setSubmittedMapSearchQuery(query);
  };

  useEffect(() => {
    const loadInitialData = async (retryCount = 0) => {
      try {
        setIsInitialLoading(true);
        const response = await axios.get('/api/people/filter');
        if (response.data.success) {
          // Sort the initial data alphabetically
          const sortedPeople = response.data.people.sort((a: Person, b: Person) => 
            a.name.localeCompare(b.name)
          );
          setFilteredPeople(sortedPeople);
        } else {
          throw new Error('Failed to fetch initial people data');
        }
      } catch (error) {
        const errorMessage = handleApiError(error, 'Failed to load initial data');
        setToast({ message: errorMessage, type: 'error' });
        if (retryCount < 3) {
          setTimeout(() => loadInitialData(retryCount + 1), 5000); // Retry after 5 seconds
        }
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-gray-800 text-white py-4">
          <div className="container mx-auto flex justify-center items-center">
            <h1 className="text-3xl font-bold">Where in the World</h1>
          </div>
        </header>
        <div className="container mx-auto py-6 px-4">
          <div className="grid grid-cols-4 gap-6">
            <div className="col-span-1">
              <div className="mb-6 relative" ref={searchRef}>
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
              <h2 className="text-xl font-bold mb-4">Filtered People</h2>
              <Select onValueChange={handleFilterChange} defaultValue="all">
                <SelectTrigger className="w-full mb-4">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="starred">Starred</SelectItem>
                  {availableTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-2">
                {isInitialLoading || isFilteredLoading ? (
                  <p>Loading...</p>
                ) : filteredPeople.length > 0 ? (
                  filteredPeople.map(person => (
                    <div 
                      key={person.id} 
                      className="flex items-center justify-between bg-white p-3 rounded-lg shadow cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleView(person)}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-[rgb(31,41,55)] text-white flex items-center justify-center mr-3">
                          <span className="text-xl font-semibold">{getInitials(person.name)}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{person.name}</p>
                          <p className="text-sm text-gray-500">{person.city}, {person.country}</p>
                        </div>
                      </div>
                      <Button
                        variant="starButton"
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
              <div className="flex justify-end mb-6">
                <AddPerson
                  isEditing={false}
                  personData={null}
                  onClose={handleAddPersonClose}
                  onUpdate={handlePersonUpdate}
                  availableTags={availableTags}
                />
              </div>
              <h2 className="text-xl font-bold mb-4">Map</h2>
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Search for a location..."
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleMapSearchSubmit(mapSearchQuery);
                    }
                  }}
                  className="w-full"
                />
              </div>
              <WorldMap 
                people={filteredPeople} 
                onPersonClick={(personOrGroup) => {
                  if ('people' in personOrGroup) {
                    handleView(personOrGroup.people[0]);
                  } else {
                    handleView(personOrGroup);
                  }
                }}
                searchQuery={submittedMapSearchQuery}
                onSearchSubmit={handleMapSearchSubmit}
                availableTags={availableTags}
                newlyAddedPerson={newlyAddedPerson}
              />
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
    </ErrorBoundary>
  );
}