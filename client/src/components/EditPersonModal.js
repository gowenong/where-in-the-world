import React, { useState } from 'react';
import './EditPersonModal.css';

function EditPersonModal({ person, onClose, onUpdate }) {
  const [name, setName] = useState(person.name);
  const [city, setCity] = useState(person.city);
  const [tags, setTags] = useState(person.tags.join(', '));

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedPerson = {
      ...person,
      name,
      city,
      tags: tags.split(',').map(tag => tag.trim()),
    };
    fetch(`/api/people/${person.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPerson),
    })
      .then(response => response.json())
      .then(data => {
        onUpdate(data);
        onClose();
      });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Edit Person</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            required
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            required
          />
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma-separated)"
          />
          <div className="modal-buttons">
            <button type="submit">Update</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPersonModal;
