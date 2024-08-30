"use client";

import React, { useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { debounce } from 'lodash';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import axios from 'axios';
import { Toast } from "@/components/ui/toast"

const defaultTags = ['Best Friend', 'Family', 'Colleague', 'Acquaintance'];
const MAX_NAME_LENGTH = 50;

type Person = {
  id: number;
  name: string;
  country: string;
  city: string;
  visitedLocations: { id: number; location: string }[];
  tags: { id: number; tag: string }[];
  isStarred: boolean;
};

interface AddPersonProps {
  isEditing: boolean;
  personData: {
    id?: number;
    name?: string;
    country?: string;
    city?: string;
    visitedLocations?: { id: number; location: string }[];
    tags?: { id: number; tag: string }[];
    isStarred?: boolean;
  } | null;
  onClose: () => void;
  onUpdate: (newPerson: Person) => void;
  onEditClose?: () => void;
  availableTags: string[];
  trigger?: React.ReactNode;
}

const AddPerson: React.FC<AddPersonProps> = ({ isEditing, personData, onClose, onUpdate, onEditClose, availableTags, trigger }) => {
  const [name, setName] = useState(personData?.name || '');
  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountry] = useState(personData?.country || '');
  const [citySearch, setCitySearch] = useState(personData?.city || '');
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState(personData?.city || '');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [visitedLocations, setVisitedLocations] = useState<{ id: number; location: string }[]>(
    personData?.visitedLocations || []
  );
  const [newLocation, setNewLocation] = useState('');
  const [tags, setTags] = useState<string[]>(personData?.tags?.map(tag => tag.tag) || []);
  const [newTag, setNewTag] = useState('');
  const [isStarred, setIsStarred] = useState(personData?.isStarred || false);
  const [initials, setInitials] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [focusedCityIndex, setFocusedCityIndex] = useState(-1);
  const [isDialogOpen, setIsDialogOpen] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [internalTags, setInternalTags] = useState<string[]>(availableTags);
  const [cityError, setCityError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setInternalTags(availableTags);
  }, [availableTags]);

  const debouncedFilterCities = useCallback(
    debounce((searchTerm: string) => {
      console.log('Filtering cities for:', searchTerm); // Debug log
      if (searchTerm && cities.length > 0) {
        const searchTerms = searchTerm.toLowerCase().split(' ');
        const filtered = cities.filter(city => 
          searchTerms.every(term => city.toLowerCase().includes(term))
        ).slice(0, 100); // Limit to 100 results for performance
        console.log('Filtered cities:', filtered.slice(0, 10)); // Debug log
        setFilteredCities(filtered);
      } else {
        setFilteredCities([]);
      }
    }, 300),
    [cities]
  );

  useEffect(() => {
    console.log('City search changed:', citySearch); // Debug log
    debouncedFilterCities(citySearch);
  }, [citySearch, debouncedFilterCities]);

  const handleCitySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Setting city search to:', value); // Debug log
    setCitySearch(value);
    setShowCityDropdown(true);
    setFocusedCityIndex(-1); // Reset focused index when search changes
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setCitySearch(city);
    setShowCityDropdown(false);
    setFocusedCityIndex(-1);
  };

  const handleCityKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showCityDropdown && filteredCities.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedCityIndex(prev => (prev < filteredCities.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedCityIndex(prev => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedCityIndex >= 0) {
            handleCitySelect(filteredCities[focusedCityIndex]);
          } else if (filteredCities.length > 0) {
            handleCitySelect(filteredCities[0]);
          }
          break;
      }
    }
  };

  const handleApiError = (error: any, customMessage: string) => {
    console.error(customMessage, error);
    let errorMessage = customMessage;
    if (axios.isAxiosError(error) && error.response) {
      errorMessage += `: ${error.response.data.error || 'An unexpected error occurred'}`;
    } else if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    setToast({ message: errorMessage, type: 'error' });
  };

  const fetchCountries = useCallback(async (search: string) => {
    try {
      setError(null);
      const response = await axios.get(`https://countriesnow.space/api/v0.1/countries/positions`, {
        timeout: 10000 // Set a timeout of 10 seconds
      });
      const countries = response.data.data.map((item: any) => item.name);
      const filteredCountries = countries.filter((country: string) =>
        country.toLowerCase().includes(search.toLowerCase())
      );
      setCountries(filteredCountries);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setError('Failed to fetch countries. Please try again later.');
      setCountries([]); // Set countries to an empty array to prevent undefined errors
    }
  }, []);

  const fetchCitiesForCountry = useCallback(async (country: string, search: string = '') => {
    if (!country) {
      setCities([]);
      return;
    }
    try {
      setError(null);
      setIsLoadingCities(true);
      const response = await axios.post(`https://countriesnow.space/api/v0.1/countries/cities`, {
        country: country
      });
      if (response.data && response.data.data) {
        setCities(response.data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch cities');
      setCities([]);
    } finally {
      setIsLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries('');
    if (isEditing && personData) {
      setName(personData.name);
      setCountry(personData.country || '');
      setCitySearch(personData.city || '');
      setSelectedCity(personData.city || '');
      setVisitedLocations(personData.visitedLocations);
      setTags(personData.tags.map(tag => tag.tag));
      setIsStarred(personData.isStarred);
      if (personData.country) {
        fetchCitiesForCountry(personData.country);
      }
    }
  }, [fetchCountries, isEditing, personData, fetchCitiesForCountry]);

  const handleCountryChange = (selectedCountry: string) => {
    console.log('Country changed to:', selectedCountry);
    setCountry(selectedCountry);
    setSelectedCity('');
    setCitySearch('');
    if (selectedCountry) {
      fetchCitiesForCountry(selectedCountry)
        .then(() => {
          console.log('Cities fetched successfully');
          console.log('Number of cities:', cities.length);
          console.log('First few cities:', cities.slice(0, 5));
        })
        .catch((error) => console.error('Error in fetchCitiesForCountry:', error));
    } else {
      setCities([]);
    }
  };

  const handleAddLocation = () => {
    if (newLocation && !visitedLocations.some(loc => loc.location === newLocation)) {
      setVisitedLocations([...visitedLocations, { id: Date.now(), location: newLocation }]);
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (locationId: number) => {
    setVisitedLocations(visitedLocations.filter(loc => loc.id !== locationId));
  };

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      if (!internalTags.includes(tag)) {
        setInternalTags([...internalTags, tag]);
        onUpdate(); // Call onUpdate to refresh tags in the Dashboard
      }
      setNewTag(''); // Clear the new tag input
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setCityError(null);

    if (!name.trim()) {
      setError('Name is required');
      setIsSubmitting(false);
      return;
    }

    if (country && !selectedCity) {
      setCityError('City is required when a country is selected');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = {
        name: name.trim(),
        country: country || null,
        city: selectedCity || null,
        visitedLocations: visitedLocations.map(loc => loc.location),
        tags,
        isStarred
      };

      const endpoint = isEditing ? `/api/people/${personData!.id}` : '/api/people';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await axios({
        method: method,
        url: endpoint,
        data: formData
      });

      if (response.data && response.data.success) {
        onUpdate(response.data.person);
        resetForm();
        setIsDialogOpen(false);
        onClose();
        setToast({ message: `Person ${isEditing ? 'updated' : 'added'} successfully`, type: 'success' });
      } else {
        throw new Error('Failed to save person');
      }
    } catch (error) {
      handleApiError(error, `Error ${isEditing ? 'updating' : 'adding'} person`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCountry('');
    setSelectedCity('');
    setCitySearch('');
    setVisitedLocations([]);
    setTags([]);
    setNewTag('');
    setIsStarred(false);
    setInitials('');
  };

  useEffect(() => {
    if (!isEditing && !personData) {
      resetForm();
    }
  }, [isDialogOpen, isEditing, personData]);

  useEffect(() => {
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length === 0 || name.trim() === '') {
      setInitials('');
    } else if (nameParts.length === 1) {
      setInitials(nameParts[0].charAt(0).toUpperCase());
    } else {
      setInitials((nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase());
    }
  }, [name]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => setIsDialogOpen(true)}>
            Add Person
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[400px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <Card className="w-full border-0 shadow-none">
          <CardHeader className="relative">
            <CardTitle className="flex items-center">
              {isEditing ? 'Edit Person' : 'Add Person'}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 hover:bg-transparent"
              onClick={() => setIsStarred(!isStarred)}
            >
              <Star className={`h-6 w-6 ${isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-3xl font-semibold">{initials}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
                maxLength={MAX_NAME_LENGTH}
                placeholder="Enter name"
                required
              />
              <p className="text-sm text-gray-500 text-right">
                {name.length}/{MAX_NAME_LENGTH}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              {countries.length > 0 ? (
                <Select value={country} onValueChange={handleCountryChange}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Enter country name"
                />
              )}
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <div className="relative">
                <Input
                  id="city"
                  value={citySearch}
                  onChange={handleCitySearchChange}
                  onKeyDown={handleCityKeyDown}
                  placeholder={isLoadingCities ? "Loading cities..." : "Search for a city"}
                  disabled={!country || isLoadingCities}
                />
                {cityError && <p className="text-red-500 text-sm mt-1">{cityError}</p>}
                {showCityDropdown && citySearch && filteredCities.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredCities.map((c, index) => (
                      <div
                        key={c}
                        className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                          index === focusedCityIndex ? 'bg-gray-200' : ''
                        }`}
                        onClick={() => handleCitySelect(c)}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visited-locations">Visited Locations</Label>
              <div className="flex space-x-2">
                <Input 
                  id="visited-locations"
                  value={newLocation} 
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Type and press enter to add"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                />
                <Button onClick={handleAddLocation} size="icon"><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 max-h-24 overflow-y-auto">
                {visitedLocations.map((location) => (
                  <span key={location.id} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm flex items-center">
                    {location.location}
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveLocation(location.id)} className="ml-1 h-4 w-4 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex space-x-2">
                <Select
                  onValueChange={handleAddTag}
                >
                  <SelectTrigger id="tags">
                    <SelectValue placeholder="Select tags" />
                  </SelectTrigger>
                  <SelectContent>
                    {internalTags.filter(tag => !tags.includes(tag)).map((tag) => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  value={newTag} 
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Create new tag"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(newTag);
                    }
                  }}
                />
                <Button onClick={() => handleAddTag(newTag)} size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 max-h-24 overflow-y-auto">
                {tags.map((tag, index) => (
                  <span key={index} className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-sm flex items-center">
                    {tag}
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveTag(tag)} className="ml-1 h-4 w-4 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                  </span>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-red-500 mb-4">{error}</div>
            )}

            <Button onClick={handleSave} className="w-full">{isEditing ? 'Update Person' : 'Save Person'}</Button>
          </CardContent>
        </Card>
      </DialogContent>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Dialog>
  );
};

export default AddPerson;