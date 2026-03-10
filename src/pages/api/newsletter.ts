import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    if (!email || !email.includes('@') || !email.includes('.')) {
      return new Response(JSON.stringify({ success: false, error: 'Please enter a valid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: Replace with Neon database insert once DATABASE_URL is available
    // For now, log the subscription (Vercel serverless function logs)
    console.log(`[Newsletter Signup] ${email} at ${new Date().toISOString()}`);

    // When DATABASE_URL is set, uncomment this:
    // const { Pool } = await import('pg');
    // const pool = new Pool({ connectionString: import.meta.env.DATABASE_URL });
    // await pool.query(
    //   'INSERT INTO newsletter_subscribers (email, subscribed_at) VALUES ($1, NOW()) ON CONFLICT (email) DO NOTHING',
    //   [email]
    // );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Newsletter Error]', err);
    return new Response(JSON.stringify({ success: false, error: 'Server error. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
