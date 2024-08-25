const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const app = express();
const port = process.env.PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'client', 'build')));

app.get('/api/people', async (req, res) => {
  try {
    const { location, name } = req.query;
    let query = `
      SELECT p.id, p.name, p.is_starred,
             json_agg(DISTINCT jsonb_build_object('type', l.type, 'name', l.name, 'country', l.country)) AS locations,
             array_agg(DISTINCT t.tag) AS tags
      FROM people p
      LEFT JOIN locations l ON p.id = l.person_id
      LEFT JOIN tags t ON p.id = t.person_id
    `;
    let conditions = [];
    let values = [];

    if (location) {
      conditions.push(`LOWER(l.name) = LOWER($${values.length + 1}) OR LOWER(l.country) = LOWER($${values.length + 1})`);
      values.push(location);
    }

    if (name) {
      conditions.push(`LOWER(p.name) LIKE LOWER($${values.length + 1})`);
      values.push(`%${name}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' OR ')}`;
    }

    query += ` GROUP BY p.id`;

    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/people', upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, currentLocation, visitedLocations, isStarred } = req.body;
    const profilePicture = req.file ? req.file.path : null;

    const result = await pool.query(
      'INSERT INTO people (name, current_location, visited_locations, profile_picture, is_starred) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, currentLocation, visitedLocations, profilePicture, isStarred]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/people/:id', upload.single('profilePicture'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, currentLocation, visitedLocations, isStarred } = req.body;
    const profilePicture = req.file ? req.file.path : null;

    const result = await pool.query(
      'UPDATE people SET name = $1, current_location = $2, visited_locations = $3, profile_picture = COALESCE($4, profile_picture), is_starred = $5 WHERE id = $6 RETURNING *',
      [name, currentLocation, visitedLocations, profilePicture, isStarred, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/people/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM people WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tags', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT DISTINCT tag FROM tags ORDER BY tag');
    res.json(rows.map(row => row.tag));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/locations', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT DISTINCT id, city, country FROM locations ORDER BY country, city');
    res.json(rows.map(row => ({
      value: row.id,
      label: `${row.city}, ${row.country}`,
      city: row.city,
      country: row.country
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});