import React from 'react';
import './PersonList.css';

function PersonList({ people, onEditPerson, onDeletePerson }) {
  const handleDelete = async (personId) => {
    const response = await fetch(`/api/people/${personId}`, { method: 'DELETE' });
    if (response.ok) {
      onDeletePerson(personId);
    } else {
      console.error('Error deleting person');
    }
  };

  return (
    <div className="person-list">
      <h2>Starred People</h2>
      <ul>
        {people.filter(person => person.isStarred).map((person) => (
          <li key={person.id} className="person-item">
            <img src={person.profilePicture} alt={person.name} className="profile-picture" />
            <div className="person-info">
              <h3>{person.name}</h3>
              <p>Lives in: {person.currentLocation.label}</p>
              <p>Visited: {person.visitedLocations.map(loc => loc.label).join(', ')}</p>
              <p>Tags: {person.tags.map(tag => tag.label).join(', ')}</p>
            </div>
            <div className="person-actions">
              <button onClick={() => onEditPerson(person)}>Edit</button>
              <button onClick={() => handleDelete(person.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PersonList;