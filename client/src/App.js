import React, { useState, useEffect } from 'react';
import './App.css';
import PersonForm from './components/PersonForm';
import PersonList from './components/PersonList';
import Map from './components/Map';

function App() {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = () => {
    fetch('/api/people')
      .then(response => response.json())
      .then(data => setPeople(data));
  };

  const handlePersonAdded = (newPerson) => {
    fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPerson),
    })
      .then(response => response.json())
      .then(data => setPeople([...people, data]));
  };

  const handleSearch = (query) => {
    fetch(`/api/people?city=${query}`)
      .then(response => response.json())
      .then(data => setPeople(data));
  };

  const handlePersonUpdated = (updatedPerson) => {
    setPeople(people.map(p => p.id === updatedPerson.id ? updatedPerson : p));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Where in the World</h1>
      </header>
      <PersonForm onPersonAdded={handlePersonAdded} onSearch={handleSearch} />
      <main className="App-main">
        <PersonList people={people} onPersonUpdated={handlePersonUpdated} />
        <Map people={people} />
      </main>
    </div>
  );
}

export default App;