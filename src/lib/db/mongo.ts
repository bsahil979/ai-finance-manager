import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI ?? "";
const dbName = process.env.MONGODB_DB || "ai-finance-manager";

// Don't throw error at module load time - let it fail gracefully in API routes
// This allows the app to start even if env vars are missing (helpful for development)

let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoClient() {
  if (!clientPromise) {
    clientPromise = MongoClient.connect(uri);
  }

  return clientPromise;
}

export async function getDb() {
  if (!uri || uri.trim() === "") {
    throw new Error("MONGODB_URI environment variable is not set. Please configure your MongoDB connection string in the .env file.");
  }
  
  const mongoClient = await getMongoClient();
  return mongoClient.db(dbName);
}


