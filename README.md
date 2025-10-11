# quizly

An offline quiz app for teachers

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

```bash
touch .env # or manually create the file
```

Edit `.env` if you want to change the host or port:

```
HOST=localhost
PORT=3000
```

### 3. Start the Server

```bash
npm start
```

Or for development:

```bash
npm run dev
```

### 4. Database Creation

The database will be automatically created at `quizly.db` in your project root when you first start the server.

## Database Schema

### Quizzes Table

```sql
- id (INTEGER PRIMARY KEY)
- title (TEXT)
- description (TEXT)
- timeLimit (INTEGER)
- isActive (INTEGER)
- allowedAttempts (INTEGER)
- createdAt (TEXT)
```

### Questions Table

```sql
- id (INTEGER PRIMARY KEY)
- quizId (INTEGER) - Foreign key to quizzes
- questionText (TEXT)
- options (TEXT) - JSON array
- correctAnswerIndex (INTEGER)
- createdAt (TEXT)
```

### Attempts Table

```sql
- id (INTEGER PRIMARY KEY)
- quizId (INTEGER) - Foreign key to quizzes
- studentName (TEXT)
- answers (TEXT) - JSON array
- score (INTEGER)
- totalQuestions (INTEGER)
- completedAt (TEXT)
```
