import React, { useState } from 'react';
import EditPersonModal from './EditPersonModal';

function PersonList({ people, onPersonUpdated }) {
  const [editingPerson, setEditingPerson] = useState(null);

  const handleEdit = (person) => {
    setEditingPerson(person);
  };

  const handleCloseModal = () => {
    setEditingPerson(null);
  };

  return (
    <div>
      <h2>People</h2>
      <ul>
        {people.map((person) => (
          <li key={person.id}>
            {person.name} - {person.city} - Tags: {person.tags.join(', ')}
            <button onClick={() => handleEdit(person)}>Edit</button>
          </li>
        ))}
      </ul>
      {editingPerson && (
        <EditPersonModal
          person={editingPerson}
          onClose={handleCloseModal}
          onUpdate={onPersonUpdated}
        />
      )}
    </div>
  );
}
export default PersonList;