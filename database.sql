CREATE DATABASE where_in_the_world;

\c where_in_the_world

CREATE TABLE people (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  current_location JSONB,
  visited_locations JSONB[],
  profile_picture VARCHAR(255),
  is_starred BOOLEAN DEFAULT FALSE
);

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES people(id),
  type VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(255)
);

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES people(id),
  tag VARCHAR(255) NOT NULL
);