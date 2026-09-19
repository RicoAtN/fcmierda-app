"use server";
import { sql } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(prevState: any, formData: FormData) {
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();

  if (!username || !password) {
    return { error: "Username and password are required" };
  }

  let isSuccessful = false;

  try {
    const users = await sql`
      SELECT id, user_name, password FROM admin_overview 
      WHERE LOWER(user_name) = LOWER(${username}) AND password = ${password}
    `;

    if (users.length > 0) {
      const canonicalName = users[0].user_name; // e.g. "Rico", "Victor", "Jordy", "Alon"
      // Setup 1-day cookie session
      const cookieStore = await cookies();
      cookieStore.set("admin_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24,
        path: "/",
      });
      cookieStore.set("admin_username", canonicalName, {
        httpOnly: false, // Allows both server and client to read
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