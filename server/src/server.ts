import dotenv from 'dotenv';
import app from './app.js';
import { connectDatabase } from './config/database.js';

dotenv.config();

const PORT = process.env.PORT ?? 5000;

async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`PrepAI API is running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start PrepAI API', error);
  process.exit(1);
});
