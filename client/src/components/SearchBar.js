import React, { useState } from 'react';
import './SearchBar.css';

function SearchBar({ onSearch, onPeopleSearch, onAddPerson }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [peopleSearchQuery, setPeopleSearchQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handlePeopleSearch = (e) => {
    e.preventDefault();
    onPeopleSearch(peopleSearchQuery);
  };

  return (
    <div className="search-bar-container">
      <div className="search-group">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Location"
          className="search-input"
        />
        <button onClick={handleSubmit} className="search-button">Search</button>
      </div>
      <div className="search-group">
        <input
          type="text"
          value={peopleSearchQuery}
          onChange={(e) => setPeopleSearchQuery(e.target.value)}
          placeholder="Search by People"
          className="search-input"
        />
        <button onClick={handlePeopleSearch} className="search-button">Search</button>
      </div>
      <button onClick={onAddPerson} className="add-person-button">Add Person</button>
    </div>
  );
}

export default SearchBar;