import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const db = await getDb();

    // Find user
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Check password (in production, use bcrypt.compare)
    if (user.password !== password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Create session
    const sessionId = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await db.collection("sessions").insertOne({
      sessionId,
      userId: user._id.toString(),
      expiresAt,
      createdAt: new Date(),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
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
    console.error("Login error:", error);
    
    // Provide more specific error messages
    let errorMessage = "Login failed";
    
    if (error instanceof Error) {
      // Check for MongoDB connection errors
      if (error.message.includes("MONGODB_URI") || error.message.includes("connection")) {
        errorMessage = "Database connection failed. Please check your MongoDB configuration.";
      } else {
        errorMessage = error.message || "Login failed. Please try again.";
      }
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}



