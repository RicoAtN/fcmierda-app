"use server";
import postgres from "postgres";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Connecting to your neon_database via environment variables
const sql = postgres(process.env.DATABASE_URL || "");

export async function login(prevState: any, formData: FormData) {
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();

  if (!username || !password) {
    return { error: "Username and password are required" };
  }

  let isSuccessful = false;

  try {
    const users = await sql`
      SELECT * FROM admin_overview 
      WHERE user_name = ${username} AND password = ${password}
    `;

    if (users.length > 0) {
      // Setup 1-day cookie session
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24,
        path: "/",
      });
      cookieStore.set("admin_username", username, {
        httpOnly: false, // Allows the client-side Menu component to read it
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24,
        path: "/",
      });
      isSuccessful = true;
    } else {
      return { error: "Invalid username or password" };
    }
  } catch (error) {
    console.error("Login error:", error);
    return { error: "An error occurred during login. Please try again." };
  }

  if (isSuccessful) {
    redirect("/cms");
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  cookieStore.delete("admin_username");
  redirect("/cms/login");
}