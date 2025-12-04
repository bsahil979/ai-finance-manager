import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI ?? "";
const dbName = process.env.MONGODB_DB || "ai-finance-manager";

if (!uri) {
  // Fail fast in dev if env var missing
  throw new Error("MONGODB_URI environment variable is not set");
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoClient() {
  if (!clientPromise) {
    clientPromise = MongoClient.connect(uri).then((connectedClient) => {
      client = connectedClient;
      return connectedClient;
    });
  }

  return clientPromise;
}

export async function getDb() {
  const mongoClient = await getMongoClient();
  return mongoClient.db(dbName);
}


