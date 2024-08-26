# Where in the World

This is a [Next.js](https://nextjs.org/) project that allows users to add and manage people's locations around the world.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 14 or later)
- npm or yarn
- PostgreSQL (version 12 or later)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/where-in-the-world.git
   cd where-in-the-world
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up the database:
   - Create a new PostgreSQL database:
     ```sql
     CREATE DATABASE where_in_the_world;
     ```
   - Create a new user and grant privileges:
     ```sql
     CREATE USER your_username WITH ENCRYPTED PASSWORD 'your_password';
     GRANT ALL PRIVILEGES ON DATABASE where_in_the_world TO your_username;
     ```

4. Set up environment variables:
   - Create a `.env` file in the root directory:
     ```
     DATABASE_URL="postgresql://your_username:your_password@localhost:5432/where_in_the_world?schema=public"
     ```
   Replace `your_username` and `your_password` with the credentials you created.

5. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

6. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

7. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

8. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- Add people with their name, country, city, and profile picture (with initials)
- Search for cities by typing in the city input field
- Navigate through the city dropdown using arrow keys and select a city by pressing Enter
- Select a city from the dropdown by clicking on it
- The profile picture displays the initials of the person's name
- Save person data to a PostgreSQL database

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM

## Project Structure

- `app/`: Next.js app router files
- `components/`: React components
- `lib/`: Utility functions and database client
- `prisma/`: Prisma schema and migrations
- `public/`: Static files
- `styles/`: Global styles

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.