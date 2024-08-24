CREATE DATABASE where_in_the_world;

\c where_in_the_world

CREATE TABLE people (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  tags TEXT[] NOT NULL
);
