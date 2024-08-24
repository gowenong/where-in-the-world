const express = require('express');
const path = require('path');
const { Pool } = require('pg');
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
    const { city } = req.query;
    let query = 'SELECT * FROM people';
    let values = [];

    if (city) {
      query += ' WHERE LOWER(city) = LOWER($1)';
      values.push(city);
    }

    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/people', async (req, res) => {
  const { name, city, tags } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO people (name, city, tags) VALUES ($1, $2, $3) RETURNING *',
      [name, city, tags]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/people/:id', async (req, res) => {
  const { id } = req.params;
  const { name, city, tags } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE people SET name = $1, city = $2, tags = $3 WHERE id = $4 RETURNING *',
      [name, city, tags, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tags', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT DISTINCT unnest(tags) as tag FROM people ORDER BY tag');
    res.json(rows.map(row => row.tag));
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