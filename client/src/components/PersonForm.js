import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import './PersonForm.css';

function PersonForm({ onPersonAdded, onSearch }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagOptions, setTagOptions] = useState([]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = () => {
    fetch('/api/tags')
      .then(response => response.json())
      .then(data => setTagOptions(data.map(tag => ({ value: tag, label: tag }))));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onPersonAdded({ name, city, tags: tags.map(tag => tag.value) });
    setName('');
    setCity('');
    setTags([]);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleTagChange = (selectedOptions) => {
    setTags(selectedOptions);
  };

  return (
    <nav className="navbar">
      <form onSubmit={handleSubmit} className="add-person-form">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
        <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" required />
        <Select
          isMulti
          options={tagOptions}
          value={tags}
          onChange={handleTagChange}
          placeholder="Select or create tags"
          className="react-select-container"
          classNamePrefix="react-select"
          createOptionPosition="first"
          formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
          onCreateOption={(inputValue) => {
            const newOption = { value: inputValue, label: inputValue };
            setTagOptions([...tagOptions, newOption]);
            setTags([...tags, newOption]);
          }}
        />
        <button type="submit">Add</button>
      </form>
      <form onSubmit={handleSearch} className="search-form">
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by city" />
        <button type="submit">Search</button>
      </form>
    </nav>
  );
}

export default PersonForm;