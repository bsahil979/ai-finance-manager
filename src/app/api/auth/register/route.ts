import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const db = await getDb();

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 },
      );
    }

    // Create user (in production, hash the password with bcrypt)
    const now = new Date();
    const result = await db.collection("users").insertOne({
      name,
      email,
      password, // TODO: Hash with bcrypt in production
      createdAt: now,
      updatedAt: now,
    });

    // Create session
    const sessionId = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await db.collection("sessions").insertOne({
      sessionId,
      userId: result.insertedId.toString(),
      expiresAt,
      createdAt: now,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.insertedId.toString(),
        name,
        email,
      },
    });

    // Set session cookie
    response.cookies.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    
    // Provide more specific error messages
    let errorMessage = "Registration failed";
    
    if (error instanceof Error) {
      // Check for MongoDB connection errors
      if (error.message.includes("MONGODB_URI") || error.message.includes("connection")) {
        errorMessage = "Database connection failed. Please check your MongoDB configuration.";
      } else if (error.message.includes("duplicate") || error.message.includes("E11000")) {
        errorMessage = "User with this email already exists";
      } else {
        errorMessage = error.message || "Registration failed. Please try again.";
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}



