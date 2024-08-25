import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import CreatableSelect from 'react-select/creatable';
import './PersonForm.css';

function PersonForm({ person, onClose, onSubmit }) {
  const [name, setName] = useState(person ? person.name : '');
  const [profilePicture, setProfilePicture] = useState(person ? person.profilePicture : null);
  const [currentLocation, setCurrentLocation] = useState(person ? person.currentLocation : null);
  const [visitedLocations, setVisitedLocations] = useState(
    person ? person.visitedLocations.map(loc => ({ value: loc, label: loc })) : []
  );
  const [countryOptions, setCountryOptions] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [tags, setTags] = useState(person ? person.tags : []);
  const [tagOptions, setTagOptions] = useState([
    { value: 'Best Friend', label: 'Best Friend' },
    { value: 'Co-worker', label: 'Co-worker' },
    { value: 'Family', label: 'Family' },
  ]);
  const [isStarred, setIsStarred] = useState(person ? person.isStarred : false);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries');
      const data = await response.json();
      const options = data.data.map(country => ({
        value: country.country,
        label: country.country
      }));
      setCountryOptions(options);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setCountryOptions([{ value: 'Error', label: 'Failed to load countries' }]);
    }
  };

  const loadCities = async (inputValue) => {
    if (!selectedCountry) return [];
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country: selectedCountry.value }),
      });
      const data = await response.json();
      return data.data
        .filter(city => city.toLowerCase().includes(inputValue.toLowerCase()))
        .map(city => ({ value: city, label: city }));
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [{ value: 'Error', label: 'Failed to load cities' }];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('currentLocation', JSON.stringify(currentLocation));
    formData.append('visitedLocations', JSON.stringify(visitedLocations.map(loc => loc.value)));
    formData.append('tags', JSON.stringify(tags));
    formData.append('isStarred', isStarred);
    if (profilePicture instanceof File) {
      formData.append('profilePicture', profilePicture);
    }

    const url = person ? `/api/people/${person.id}` : '/api/people';
    const method = person ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      body: formData,
    });

    if (response.ok) {
      const updatedPerson = await response.json();
      onSubmit(updatedPerson);
    } else {
      console.error('Error saving person');
    }
  };

  const handleTagChange = (newValue) => {
    setTags(newValue);
  };

  const handleCreateTag = (inputValue) => {
    const newTag = { value: inputValue, label: inputValue };
    setTagOptions([...tagOptions, newTag]);
    setTags([...tags, newTag]);
  };

  const handleProfilePictureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handleVisitedLocationsChange = (newValue) => {
    setVisitedLocations(newValue);
  };

  const handleCreateVisitedLocation = (inputValue) => {
    const newLocation = { value: inputValue, label: inputValue };
    setVisitedLocations([...visitedLocations, newLocation]);
  };

  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '38px',
      height: '38px',
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: '38px',
      padding: '0 8px',
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '38px',
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      width: 'calc(100% - 2px)',
      margin: '2px 1px',
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '150px',
    }),
  };

  return (
    <div className="modal-backdrop">
      <div className="modal person-card">
        <button className="close-button" onClick={onClose}>&larr;</button>
        <form onSubmit={handleSubmit}>
          <div className="profile-picture-container">
            {profilePicture ? (
              <div className="profile-picture">
                <img
                  src={profilePicture instanceof File ? URL.createObjectURL(profilePicture) : profilePicture}
                  alt={name}
                />
              </div>
            ) : (
              <div className="profile-picture initials">{name ? getInitials(name) : ''}</div>
            )}
            <label htmlFor="profile-picture-input" className="profile-picture-label">
              Upload Picture
            </label>
            <input
              id="profile-picture-input"
              type="file"
              onChange={handleProfilePictureChange}
              accept="image/*"
              className="profile-picture-input"
            />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            required
            className="name-input"
          />
          <Select
            options={countryOptions}
            value={selectedCountry}
            onChange={setSelectedCountry}
            placeholder="Select Country"
            className="country-select"
            styles={selectStyles}
          />
          <AsyncSelect
            cacheOptions
            loadOptions={loadCities}
            value={currentLocation}
            onChange={setCurrentLocation}
            placeholder="Search for a city"
            noOptionsMessage={() => selectedCountry ? "Type to search for a city" : "Select a country first"}
            className="city-select"
            styles={selectStyles}
          />
          <CreatableSelect
            isMulti
            options={[]}
            value={visitedLocations}
            onChange={handleVisitedLocationsChange}
            onCreateOption={handleCreateVisitedLocation}
            placeholder="Type and press enter to add visited locations"
            className="visited-locations-select"
            noOptionsMessage={() => null}
            components={{
              DropdownIndicator: null,
              IndicatorSeparator: null
            }}
            styles={{
              ...selectStyles,
              control: (provided) => ({
                ...provided,
                minHeight: '38px',
                height: 'auto'
              })
            }}
          />
          <CreatableSelect
            isMulti
            options={tagOptions}
            value={tags}
            onChange={handleTagChange}
            onCreateOption={handleCreateTag}
            placeholder="Select or create tags"
            className="tag-select"
            styles={selectStyles}
          />
          <div className="star-checkbox">
            <input
              type="checkbox"
              id="star-person"
              checked={isStarred}
              onChange={(e) => setIsStarred(e.target.checked)}
            />
            <label htmlFor="star-person">Star this person</label>
          </div>
          <button type="submit" className="save-button">Save Person</button>
        </form>
      </div>
    </div>
  );
}

export default PersonForm;