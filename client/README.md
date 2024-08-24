# Where in the World

Find your friends, places to travel to, and live.

## Project Overview

This project is a full-stack application that allows users to add and view people's locations and associated tags. It uses React for the frontend and Express with PostgreSQL for the backend.

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/gowenong/where-in-the-world.git
   cd where-in-the-world
   ```

2. Install dependencies:
   ```
   npm install
   cd client && npm install
   ```

3. Set up the database:
   - Create a PostgreSQL database named `where_in_the_world`
   - Run the SQL commands in `database.sql` to set up the table

4. Set up environment variables:
   Create a `.env` file in the root directory and add:
   ```
   DATABASE_URL=your_postgresql_connection_string
   ```

## Running the Application

1. Start the server:
   ```
   npm start
   ```

2. In a separate terminal, start the client:
   ```
   npm run client
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## Features

- Add people with their name, city, and tags
- View a list of added people
- Map placeholder for future integration

## Technologies Used

- Frontend: React
- Backend: Express.js
- Database: PostgreSQL
- API: RESTful API

## Future Enhancements

- Implement map functionality with Mapbox
- Add search and filter capabilities
- Improve UI/UX design

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).