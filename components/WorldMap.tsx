import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';
import { WebMercatorViewport } from '@math.gl/web-mercator';
import CityInfoCard from '@/components/CityInfoCard';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

type Person = {
  id: number;
  name: string;
  country: string;
  city: string;
  visitedLocations: { location: string }[];
};

type GeocodedPerson = Person & {
  latitude: number;
  longitude: number;
};

type CityGroup = {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  people: GeocodedPerson[];
  visitors?: Person[];
};

type WorldMapProps = {
  people: Person[];
  onPersonClick: (person: Person) => void;
  searchQuery: string;
  onSearchSubmit: (query: string) => void;
  availableTags: string[];
  newlyAddedPerson: Person | null;
};

const CityMarker: React.FC<{ group: CityGroup; onClick: () => void }> = ({ group, onClick }) => {
  const totalPeople = group.people.length + (group.visitors?.length || 0);
  return (
    <div
      className={`w-8 h-8 ${group.people.length > 0 ? 'bg-blue-500' : 'bg-green-500'} rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={onClick}
    >
      {totalPeople}
    </div>
  );
};

const WorldMap: React.FC<WorldMapProps> = ({ people, onPersonClick, searchQuery, onSearchSubmit, availableTags, newlyAddedPerson }) => {
  const [viewState, setViewState] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 1.5
  });
  const [geocodedPeople, setGeocodedPeople] = useState<GeocodedPerson[]>([]);
  const [cityGroups, setCityGroups] = useState<CityGroup[]>([]);
  const [popupInfo, setPopupInfo] = useState<GeocodedPerson | CityGroup | null>(null);
  const [isGlobeView, setIsGlobeView] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<[number, number] | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityGroup | null>(null);
  const [showCityInfo, setShowCityInfo] = useState(false);
  const [searchedCity, setSearchedCity] = useState<CityGroup | null>(null);
  const [selectedCityKey, setSelectedCityKey] = useState<string | null>(null);

  const normalizeLocationName = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const findVisitors = (city: string, country: string, residents: Person[]) => {
    const normalizedCity = normalizeLocationName(city);
    return people.filter(p => 
      p.visitedLocations.some(vl => normalizeLocationName(vl.location).includes(normalizedCity)) && 
      !residents.some(r => r.id === p.id)
    );
  };

  const geocodePeople = useCallback(async () => {
    const geocoded = await Promise.all(
      people.map(async (person) => {
        if (!person.city || !person.country) return null;
        try {
          const response = await axios.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
              person.city + ', ' + person.country
            )}.json?access_token=${MAPBOX_TOKEN}`
          );
          const [longitude, latitude] = response.data.features[0].center;
          return { ...person, latitude, longitude };
        } catch (error) {
          console.error('Geocoding error:', error);
          return null;
        }
      })
    );
    const validGeocoded = geocoded.filter((p): p is GeocodedPerson => p !== null);
    setGeocodedPeople(validGeocoded);

    // Group people by city, including visitors
    const groups = validGeocoded.reduce((acc, person) => {
      const key = `${person.city},${person.country}`;
      if (!acc[key]) {
        acc[key] = {
          city: person.city,
          country: person.country,
          latitude: person.latitude,
          longitude: person.longitude,
          people: [],
          visitors: []
        };
      }
      acc[key].people.push(person);
      return acc;
    }, {} as Record<string, CityGroup>);

    // Add visitors to each city group
    people.forEach(person => {
      person.visitedLocations.forEach(vl => {
        const normalizedVisitedLocation = normalizeLocationName(vl.location);
        Object.keys(groups).forEach(key => {
          const group = groups[key];
          if (normalizeLocationName(group.city).includes(normalizedVisitedLocation) && 
              !group.people.some(r => r.id === person.id) &&
              !group.visitors.some(v => v.id === person.id)) {
            group.visitors.push(person);
          }
        });
      });
    });

    // Add cities that have been visited but have no residents
    people.forEach(person => {
      person.visitedLocations.forEach(vl => {
        const normalizedVisitedLocation = normalizeLocationName(vl.location);
        if (!Object.values(groups).some(group => normalizeLocationName(group.city).includes(normalizedVisitedLocation))) {
          const key = vl.location;
          if (!groups[key]) {
            groups[key] = {
              city: vl.location,
              country: '',
              latitude: 0,
              longitude: 0,
              people: [],
              visitors: [person]
            };
          } else if (!groups[key].visitors.some(v => v.id === person.id)) {
            groups[key].visitors.push(person);
          }
        }
      });
    });

    // Geocode cities that only have visitors
    for (const key in groups) {
      if (groups[key].latitude === 0 && groups[key].longitude === 0) {
        try {
          const response = await axios.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(groups[key].city)}.json?access_token=${MAPBOX_TOKEN}`
          );
          const [longitude, latitude] = response.data.features[0].center;
          groups[key].latitude = latitude;
          groups[key].longitude = longitude;
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }
    }

    setCityGroups(Object.values(groups));
  }, [people]);

  useEffect(() => {
    geocodePeople();
  }, [geocodePeople]);

  useEffect(() => {
    if (geocodedPeople.length > 0) {
      const bounds = geocodedPeople.reduce(
        (bounds, person) => {
          return {
            minLng: Math.min(bounds.minLng, person.longitude),
            minLat: Math.min(bounds.minLat, person.latitude),
            maxLng: Math.max(bounds.maxLng, person.longitude),
            maxLat: Math.max(bounds.maxLat, person.latitude),
          };
        },
        {
          minLng: 180,
          minLat: 90,
          maxLng: -180,
          maxLat: -90,
        }
      );

      setViewState({
        latitude: (bounds.minLat + bounds.maxLat) / 2,
        longitude: (bounds.minLng + bounds.maxLng) / 2,
        zoom: 1.5,
      });
    }
  }, [geocodedPeople]);

  const toggleMapView = () => {
    setIsGlobeView(!isGlobeView);
  };

  const searchLocation = useCallback(async (query: string) => {
    if (!query) return;
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}`
      );
      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const [longitude, latitude] = feature.center;
        setSearchedLocation([longitude, latitude]);

        // Determine the appropriate zoom level based on the place type
        let zoom = 10; // Default zoom for cities
        if (feature.place_type.includes('country')) {
          zoom = 4; // Zoom out for countries
        } else if (feature.place_type.includes('region')) {
          zoom = 6; // Intermediate zoom for regions/states
        }

        // If the place has a bounding box, use it to set the view
        if (feature.bbox) {
          const [minLng, minLat, maxLng, maxLat] = feature.bbox;
          const viewport = new WebMercatorViewport({
            width: 800, // Approximate map width
            height: 600 // Approximate map height
          });
          const { longitude, latitude, zoom } = viewport.fitBounds(
            [[minLng, minLat], [maxLng, maxLat]],
            { padding: 40 }
          );
          setViewState({ longitude, latitude, zoom });
        } else {
          setViewState(prev => ({
            ...prev,
            longitude,
            latitude,
            zoom,
          }));
        }

        // Find the city group that matches the searched location
        const normalizedSearchQuery = normalizeLocationName(query);
        const matchingCityGroup = cityGroups.find(group => 
          normalizeLocationName(group.city).includes(normalizedSearchQuery) ||
          normalizeLocationName(group.country).includes(normalizedSearchQuery)
        );

        if (matchingCityGroup) {
          setSearchedCity(matchingCityGroup);
        } else {
          // If no exact match, create a new city group for visitors
          const visitors = people.filter(p => 
            p.visitedLocations.some(vl => normalizeLocationName(vl.location).includes(normalizedSearchQuery))
          );
          if (visitors.length > 0) {
            const newCityGroup: CityGroup = {
              city: feature.text,
              country: feature.context.find((ctx: any) => ctx.id.startsWith('country.'))?.text || '',
              latitude,
              longitude,
              people: [],
              visitors
            };
            setSearchedCity(newCityGroup);
          } else {
            setSearchedCity(null);
          }
        }
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  }, [cityGroups, people]);

  useEffect(() => {
    if (searchQuery) {
      searchLocation(searchQuery);
    }
  }, [searchQuery, searchLocation]);

  const LocationInfo: React.FC<{ info: CityGroup | GeocodedPerson }> = ({ info }) => {
    const isCity = 'people' in info;
    const location = isCity ? info.city : `${info.city}${info.country ? ', ' + info.country : ''}`;
    const residents = isCity ? info.people : [info];
    const visitors = people.filter(p => 
      p.visitedLocations.some(vl => vl.location === location) && 
      !residents.some(r => r.id === p.id)
    );

    return (
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-md max-w-sm">
        <h3 className="font-bold text-lg mb-2">{location}</h3>
        <h4 className="font-semibold mb-1">People that live here ({residents.length}):</h4>
        <ul className="mb-2">
          {residents.map(p => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
        <h4 className="font-semibold mb-1">People who have visited ({visitors.length}):</h4>
        <ul>
          {visitors.map(p => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </div>
    );
  };

  useEffect(() => {
    if (newlyAddedPerson) {
      geocodePeople();
      // Update the cityGroups state
      setCityGroups(prevGroups => {
        const updatedGroups = [...prevGroups];
        const groupIndex = updatedGroups.findIndex(g => g.city === newlyAddedPerson.city && g.country === newlyAddedPerson.country);
        if (groupIndex !== -1) {
          const existingPerson = updatedGroups[groupIndex].people.find(p => p.id === newlyAddedPerson.id);
          if (existingPerson) {
            Object.assign(existingPerson, newlyAddedPerson);
          } else {
            updatedGroups[groupIndex].people.push(newlyAddedPerson as GeocodedPerson);
          }
        } else {
          // If the city doesn't exist, create a new group
          updatedGroups.push({
            city: newlyAddedPerson.city,
            country: newlyAddedPerson.country,
            latitude: newlyAddedPerson.latitude || 0,
            longitude: newlyAddedPerson.longitude || 0,
            people: [newlyAddedPerson as GeocodedPerson]
          });
        }
        return updatedGroups;
      });
    }
  }, [newlyAddedPerson]);

  const handleUpdateResidents = useCallback((updatedResidents: Person[]) => {
    if (selectedCity) {
      setCityGroups(prevGroups => {
        return prevGroups.map(group => {
          if (group.city === selectedCity.city && group.country === selectedCity.country) {
            const updatedGroup = { ...group, people: updatedResidents as GeocodedPerson[] };
            setSelectedCity(updatedGroup);
            return updatedGroup;
          }
          return group;
        });
      });
    }
  }, [selectedCity]);

  const handleUpdateVisitors = useCallback((updatedVisitors: Person[]) => {
    if (selectedCity) {
      setCityGroups(prevGroups => {
        return prevGroups.map(group => {
          if (group.city === selectedCity.city && group.country === selectedCity.country) {
            const updatedGroup = { ...group, visitors: updatedVisitors };
            setSelectedCity(updatedGroup);
            return updatedGroup;
          }
          return group;
        });
      });
    }
  }, [selectedCity]);

  const handlePersonUpdate = useCallback((updatedPerson: Person) => {
    setCityGroups(prevGroups => {
      const updatedGroups = prevGroups.map(group => {
        const updatedPeople = group.people.map(p => p.id === updatedPerson.id ? updatedPerson as GeocodedPerson : p);
        const updatedVisitors = group.visitors?.map(v => v.id === updatedPerson.id ? updatedPerson : v) || [];
        
        return {
          ...group,
          people: updatedPeople,
          visitors: updatedVisitors
        };
      });

      // If the person moved to a new city that doesn't exist in the groups, create a new group
      if (!updatedGroups.some(group => group.city === updatedPerson.city && group.country === updatedPerson.country)) {
        updatedGroups.push({
          city: updatedPerson.city,
          country: updatedPerson.country,
          latitude: (updatedPerson as GeocodedPerson).latitude || 0,
          longitude: (updatedPerson as GeocodedPerson).longitude || 0,
          people: [updatedPerson as GeocodedPerson],
          visitors: []
        });
      }

      // Update selectedCity if it's affected by the change
      if (selectedCity && (selectedCity.city === updatedPerson.city && selectedCity.country === updatedPerson.country)) {
        const updatedSelectedCity = updatedGroups.find(g => g.city === selectedCity.city && g.country === selectedCity.country);
        if (updatedSelectedCity) {
          setSelectedCity(updatedSelectedCity);
        }
      }

      return updatedGroups;
    });

    // Trigger a re-geocoding of people
    geocodePeople();
  }, [selectedCity, geocodePeople]);

  const handleCityMarkerClick = useCallback((group: CityGroup) => {
    const key = `${group.city},${group.country}`;
    setSelectedCity(group);
    setSelectedCityKey(key);
    setShowCityInfo(true);
    setSearchedCity(null);
  }, []);

  useEffect(() => {
    if (selectedCity) {
      const updatedCity = cityGroups.find(group => group.city === selectedCity.city && group.country === selectedCity.country);
      if (updatedCity) {
        setSelectedCity(updatedCity);
      }
    }
  }, [cityGroups, selectedCity]);

  useEffect(() => {
    geocodePeople();
  }, [people, geocodePeople]);

  const memoizedCityInfoCard = useMemo(() => {
    if (showCityInfo && selectedCity) {
      const key = `${selectedCity.city},${selectedCity.country}`;
      return (
        <CityInfoCard
          key={`${key}-${selectedCity.people.length}-${selectedCity.visitors?.length || 0}`}
          city={selectedCity.city}
          country={selectedCity.country}
          residents={selectedCity.people}
          visitors={selectedCity.visitors || []}
          onPersonClick={onPersonClick}
          onClose={() => setShowCityInfo(false)}
          onUpdate={geocodePeople}
          onUpdateResidents={handleUpdateResidents}
          onUpdateVisitors={handleUpdateVisitors}
          availableTags={availableTags}
          newlyAddedPerson={newlyAddedPerson}
          onPersonUpdate={handlePersonUpdate}
        />
      );
    }
    return null;
  }, [showCityInfo, selectedCity, selectedCityKey, onPersonClick, geocodePeople, handleUpdateResidents, handleUpdateVisitors, availableTags, newlyAddedPerson, handlePersonUpdate]);

  return (
    <div className="relative">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{width: '100%', height: 500}}
        mapStyle={isGlobeView ? "mapbox://styles/mapbox/streets-v12" : "mapbox://styles/ogong500/cm0ga1n88011d01rbahb6gcve"}
        mapboxAccessToken={MAPBOX_TOKEN}
        projection={isGlobeView ? "globe" : "mercator"}
      >
        <NavigationControl position="top-right" />
        {cityGroups.map(group => (
          <Marker
            key={`${group.city},${group.country}`}
            latitude={group.latitude}
            longitude={group.longitude}
            anchor="center"
          >
            <CityMarker group={group} onClick={() => handleCityMarkerClick(group)} />
          </Marker>
        ))}
      </Map>
      <button
        onClick={toggleMapView}
        className="absolute top-4 left-4 bg-white px-3 py-2 rounded shadow-md text-sm font-medium hover:bg-gray-100 transition-colors"
      >
        {isGlobeView ? "Switch to Flat Map" : "Switch to Globe View"}
      </button>
      {memoizedCityInfoCard}
      {searchedCity && (
        <CityInfoCard
          city={searchedCity.city}
          country={searchedCity.country}
          residents={searchedCity.people}
          visitors={searchedCity.visitors || findVisitors(searchedCity.city, searchedCity.country, searchedCity.people)}
          onPersonClick={onPersonClick}
          onClose={() => setSearchedCity(null)}
          onUpdate={geocodePeople}
          onUpdateResidents={handleUpdateResidents}
          onUpdateVisitors={handleUpdateVisitors}
          availableTags={availableTags}
          newlyAddedPerson={newlyAddedPerson}
          onPersonUpdate={handlePersonUpdate}
        />
      )}
    </div>
  );
};

export default WorldMap;