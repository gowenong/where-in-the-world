import React, { useState, useEffect } from 'react';
import './App.css';
import PersonForm from './components/PersonForm';
import PersonList from './components/PersonList';
import SearchBar from './components/SearchBar';
import Map from './components/Map'; // Import the Map component

function App() {
  const [people, setPeople] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async (query = '') => {
    try {
      const response = await fetch(`/api/people${query ? `?location=${query}` : ''}`);
      const data = await response.json();
      setPeople(data);
    } catch (error) {
      console.error('Error fetching people:', error);
    }
  };

  const fetchPeopleByName = async (query = '') => {
    try {
      const response = await fetch(`/api/people${query ? `?name=${query}` : ''}`);
      const data = await response.json();
      setPeople(data);
    } catch (error) {
      console.error('Error fetching people by name:', error);
    }
  };

  const handlePersonChange = (updatedPerson, isNew = false) => {
    setPeople(prevPeople => 
      isNew 
        ? [...prevPeople, {...updatedPerson, isStarred: updatedPerson.isStarred}]
        : prevPeople.map(p => p.id === updatedPerson.id ? {...updatedPerson, isStarred: updatedPerson.isStarred} : p)
    );
    closeModal();
  };

  const handlePersonDeleted = (deletedPersonId) => {
    setPeople(prevPeople => prevPeople.filter(p => p.id !== deletedPersonId));
  };

  const openModal = (person = null) => {
    setEditingPerson(person);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPerson(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Where in the World</h1>
      </header>
      <nav className="App-nav">
        <SearchBar 
          onSearch={fetchPeople} 
          onPeopleSearch={fetchPeopleByName}
          onAddPerson={() => openModal()} 
        />
      </nav>
      <div className="App-content">
        <PersonList
          people={people.filter(person => person.isStarred)}
          onEditPerson={openModal}
          onDeletePerson={handlePersonDeleted}
        />
        <Map people={people} />
      </div>
      {isModalOpen && (
        <div className="modal-backdrop">
          <PersonForm
            person={editingPerson}
            onClose={closeModal}
            onSubmit={(person) => handlePersonChange(person, !editingPerson)}
          />
        </div>
      )}
    </div>
  );
}

export default App;