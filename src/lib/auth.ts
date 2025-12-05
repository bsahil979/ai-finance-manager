import { cookies } from "next/headers";
import { getDb } from "./db/mongo";
import { ObjectId } from "mongodb";

export interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return null;
    }

    const db = await getDb();
    const session = await db.collection("sessions").findOne({
      sessionId,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return null;
    }

    const user = await db.collection("users").findOne({
      _id: new ObjectId(session.userId),
    });

    if (!user) {
      return null;
    }

    return {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    } as User;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

