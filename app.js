const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve the React.js app from the Express.js backend
app.use(express.static(path.join(__dirname, 'client', 'build')));

// API routes go here
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

// Catch-all route for the React.js app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});