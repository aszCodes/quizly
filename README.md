# Quizly

A self-hosted quiz application to conduct quizzes in classrooms. Works on local networks without requiring internet connectivity.

## Tech Stack

**Client:** EJS templates, Vanilla JavaScript, CSS

**Server:** Node.js, Express.js

**Database:** SQLite3 (better-sqlite3)

**Testing:** Jest, Supertest

**Logging:** Pino, Pino-HTTP

## Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file:

```env
NODE_ENV=development          # Options: development, production, test
HOST=localhost                # Server host
PORT=3000                     # Server port
```

**Note:** `PORT` and `HOST` are not required in test environment.

## Run Locally

Clone the project

```bash
git clone https://github.com/aszCodes/quizly.git
```

Go to the project directory

```bash
cd quizly
```

Install dependencies

```bash
npm install
```

Supply `.env` file

```env
NODE_ENV=development          # Options: development, production, test
HOST=localhost                # Server host
PORT=3000                     # Server port
```

Seed the database

```bash
npm run db:seed
```

Start the server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Running Tests

To run the test suite:

```bash
npm test
```

To run tests in watch mode:

```bash
npm run test:watch
```

To run tests with coverage:

```bash
npm run test:coverage
```

## API Documentation

API documentation is available via Swagger UI at:

http://localhost:3000/api-docs

## Color Reference

[Color pallate](https://colorhunt.co/palette/37353e44444e715a5ad3dad9) 🎨

| Color      | Hex     | Usage                     |
| ---------- | ------- | ------------------------- |
| Background | #f5f6fa | Page background           |
| Primary    | #273c75 | Primary buttons, headings |
| Secondary  | #0097e6 | Secondary actions         |
| Card BG    | #ffffff | Card backgrounds          |
| Error      | #c23616 | Error messages            |

## Database Schema

The application uses SQLite with the following main tables:

-   `students` - Student records
-   `quizzes` - Quiz definitions
-   `questions` - Quiz questions with multiple choice options
-   `attempts` - Student answer submissions
-   `quiz_sessions` - Active quiz sessions with tokens
-   `question_views` - Tracking of viewed questions
-   `student_whitelist` - Authorized students per section

## Roadmap

-   Migrate frontend to react
-   Admin dashboard for teachers
-   Export quiz results to CSV/Excel
-   Question types beyond multiple choice
-   Image support in questions

## License

[MIT](https://choosealicense.com/licenses/mit/)
