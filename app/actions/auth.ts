"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

type ActionState = { error?: string; message?: string } | undefined;

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function signup(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;
  const username = (formData.get("username") as string).toLowerCase().trim();
  const displayName = (formData.get("display_name") as string).trim() || username;

  if (!email || !password || !username) {
    return { error: "All fields are required." };
  }
  if (username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
    return { error: "Username: 3+ chars, letters/numbers/underscores only." };
  }

  const { data: existing } = await adminClient()
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) return { error: "That username is already taken." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Sign up failed. Try again." };

  const { error: profileError } = await adminClient()
    .from("profiles")
    .insert({ id: data.user.id, username, display_name: displayName });

  if (profileError?.code === "23505") {
    return { error: "That username is already taken." };
  }
  if (profileError) {
    return { error: "Failed to create profile. Try again." };
  }

  if (data.session) {
    redirect("/feed");
  }

  return { message: "Check your email to confirm your account, then sign in." };
}

export async function login(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  redirect("/feed");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get("email") as string).trim();
  if (!email) return { error: "Email is required." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message };
  return { message: "Check your email for a password reset link." };
}
