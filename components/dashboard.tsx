"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import AddPerson from "@/components/AddPerson"
import PersonSearchResult from "@/components/PersonSearchResult"
import axios from 'axios';
import { X } from 'lucide-react';
import ViewPerson from '@/components/ViewPerson';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

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
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      console.error('Error searching people:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response data:', error.response.data);
        setSearchError(error.response.data.error || 'An error occurred while searching');
      } else {
        setSearchError('An unexpected error occurred');
      }
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEdit = async (person) => {
    try {
      const response = await axios.get(`/api/people/${person.id}`);
      if (response.data && response.data.success) {
        setEditingPerson(response.data.person);
      } else {
        console.error('Failed to fetch full person data');
      }
    } catch (error) {
      console.error('Error fetching person data:', error);
    }
  };

  const handleCloseEdit = () => {
    setEditingPerson(null);
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

  const handleView = async (person) => {
    try {
      const response = await axios.get(`/api/people/${person.id}`);
      if (response.data && response.data.success) {
        setViewingPerson(response.data.person);
        setShowDropdown(false);
      } else {
        console.error('Failed to fetch full person data');
      }
    } catch (error) {
      console.error('Error fetching person data:', error);
    }
  };

  const handleCloseView = () => {
    setViewingPerson(null);
  };

  const fetchFilteredPeople = async () => {
    console.log('Fetching filtered people. Filter type:', filterType, 'Selected tags:', selectedTags);
    try {
      let url = '/api/people/filter?';
      if (filterType === 'starred') {
        url += 'starred=true';
      } else if (filterType === 'tags' && selectedTags) {
        // Check if selectedTags is an array
        if (Array.isArray(selectedTags)) {
          url += `tags=${selectedTags.join(',')}`;
        } else {
          // If it's a single tag, use it directly
          url += `tags=${selectedTags}`;
        }
      } else {
        setFilteredPeople([]);
        return;
      }
      console.log('Fetching URL:', url);
      const response = await axios.get(url);
      if (response.data && response.data.success) {
        console.log('Filtered people:', response.data.people);
        setFilteredPeople(response.data.people);
      }
    } catch (error) {
      console.error('Error fetching filtered people:', error);
      setFilteredPeople([]);
    }
  };

  const fetchAvailableTags = async () => {
    try {
      const response = await axios.get('/api/tags');
      if (response.data && response.data.tags) {
        setAvailableTags(response.data.tags);
      }
    } catch (error) {
      console.error('Error fetching available tags:', error);
    }
  };

  useEffect(() => {
    fetchAvailableTags();
  }, []);

  useEffect(() => {
    console.log('Filter type or selected tags changed. Fetching filtered people.');
    fetchFilteredPeople();
  }, [filterType, selectedTags]);

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
            <AddPerson />
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
                    console.log('Selected tags changed:', value);
                    setSelectedTags(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tags" />
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
              {filterType === 'tags' && selectedTags.length === 0 ? (
                <p>Please select a tag to view people.</p>
              ) : filteredPeople.length > 0 ? (
                filteredPeople.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-2 rounded-md transition-colors duration-200 hover:bg-gray-200 cursor-pointer"
                    onClick={() => handleView(person)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-3">
                        <span className="text-sm font-semibold">
                          {person.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{person.name}</p>
                        <p className="text-sm text-gray-500">
                          {[person.city, person.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                    {person.isStarred && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 text-yellow-500"
                      >
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                    )}
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
        />
      )}
      {viewingPerson && (
        <ViewPerson
          person={viewingPerson}
          onEdit={() => {
            setEditingPerson(viewingPerson);
            setViewingPerson(null);
          }}
          onClose={handleCloseView}
        />
      )}
    </div>
  );
}