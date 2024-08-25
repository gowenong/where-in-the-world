"use client";

import { useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { debounce } from 'lodash';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const defaultTags = ['Best Friend', 'Family', 'Colleague', 'Acquaintance'];

export default function AddPerson() {
  const [name, setName] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountry] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [visitedLocations, setVisitedLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [initials, setInitials] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [focusedCityIndex, setFocusedCityIndex] = useState(-1);

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

  const fetchCountries = async (search: string) => {
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries', {
        method: 'GET',
      });
      const data = await response.json();
      if (data.error === false && Array.isArray(data.data)) {
        const filteredCountries = data.data
          .map((country: { country: string }) => country.country)
          .filter((country: string) => country.toLowerCase().includes(search.toLowerCase()));
        setCountries(filteredCountries);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      setError('Failed to fetch countries. Please try again later.');
    }
  };

  const fetchCitiesForCountry = async (selectedCountry: string) => {
    setIsLoadingCities(true);
    setError(null);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: selectedCountry }),
      });
      const data = await response.json();
      if (data.error === false && Array.isArray(data.data)) {
        setCities(data.data);
      } else {
        throw new Error('Failed to fetch cities');
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setError('Failed to fetch cities. Please try again later.');
    } finally {
      setIsLoadingCities(false);
    }
  };

  useEffect(() => {
    fetchCountries('');
  }, []);

  const handleCountryChange = (selectedCountry: string) => {
    console.log('Country changed to:', selectedCountry); // Debug log
    setCountry(selectedCountry);
    setSelectedCity('');
    setCitySearch('');
    fetchCitiesForCountry(selectedCountry);
  };

  const handleAddLocation = () => {
    if (newLocation && !visitedLocations.includes(newLocation)) {
      setVisitedLocations([...visitedLocations, newLocation]);
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (location: string) => {
    setVisitedLocations(visitedLocations.filter(loc => loc !== location));
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag) && !defaultTags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Name is required');
      return;
    }
    // Here you would typically save the data to your backend
    console.log({ name, country, selectedCity, visitedLocations, tags, isStarred });
  };

  useEffect(() => {
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 0 || name.trim() === '') {
      setInitials('');
    } else if (nameParts.length === 1) {
      setInitials(nameParts[0].charAt(0).toUpperCase());
    } else {
      setInitials((nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase());
    }
  }, [name]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-green-500 hover:bg-green-600 text-white">Add Person</Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[400px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <Card className="w-full border-0 shadow-none">
          <CardHeader className="relative">
            <CardTitle className="flex items-center">
              Add Person
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
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
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter name" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
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
                {visitedLocations.map((location, index) => (
                  <span key={index} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm flex items-center">
                    {location}
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveLocation(location)} className="ml-1 h-4 w-4 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Select
                onValueChange={(value) => {
                  if (!tags.includes(value)) {
                    setTags([...tags, value]);
                  }
                }}
              >
                <SelectTrigger id="tags">
                  <SelectValue placeholder="Select or create tags" />
                </SelectTrigger>
                <SelectContent>
                  {defaultTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                  <div className="flex p-2">
                    <Input 
                      value={newTag} 
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Create new tag"
                      className="flex-grow"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button onClick={handleAddTag} size="sm" className="ml-2">Add</Button>
                  </div>
                </SelectContent>
              </Select>
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

            <Button onClick={handleSave} className="w-full">Save Person</Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}