import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // Parse the URL to get the secret code
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // You can pass a 'next' parameter in the URL to redirect them to a specific page, 
  // otherwise, default to the dashboard.
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a secure user session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Login successful! Send them to the dashboard.
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Auth Callback Error:", error.message);
    }
  }

  // If there's no code or it failed, send them back to the login page with an error
  return NextResponse.redirect(`${origin}/auth?error=Could not verify email`);
}