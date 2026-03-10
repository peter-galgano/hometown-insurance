import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.email || !data.full_name) {
      return new Response(JSON.stringify({ success: false, error: 'Name and email are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // TODO: Store in Neon database when DATABASE_URL is available
    // const { Pool } = await import('pg');
    // const pool = new Pool({ connectionString: import.meta.env.DATABASE_URL });
    // await pool.query('INSERT INTO leads ...', [...]);
    
    console.log('Lead submission:', JSON.stringify(data));
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Server error. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};