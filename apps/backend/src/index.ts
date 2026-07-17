import express from 'express';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

// 1. Set up the native pg database connection pool
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:devpass@localhost:5432/civicpulse?schema=public';
const pool = new Pool({ connectionString });

// 2. Initialize the Prisma Pg Adapter
const adapter = new PrismaPg(pool);

// 3. Instantiate Prisma Client with the adapter (TypeScript will be 100% happy now!)
const prisma = new PrismaClient({ adapter });

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000;

// This middleware allows Express to parse JSON bodies in requests
app.use(express.json());

// 1. GET /health - To check if our API is running
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'civicPulse API is running' });
});

// 2. POST /reports - Create a new civic report
app.post('/reports', async (req, res) => {
  const { category, latitude, longitude, photoUrl, createdBy } = req.body;

  try {
    const newReport = await prisma.report.create({
      data: {
        category,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        photoUrl,
        createdBy,
      },
    });

    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Something went wrong on our end' });
  }
});

//Fallback for non-existent routes
app.use((req, res) => {
    res.status(404).json({error : 'Route not found'});
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});