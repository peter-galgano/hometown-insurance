import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    if (!data.email || !data.full_name) {
      return new Response(JSON.stringify({ success: false, error: 'Name and email are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sql = neon(import.meta.env.DATABASE_URL);

    await sql`INSERT INTO leads (
      full_name, email, phone, insurance_type, other_insurance,
      contact_method, callback_day, callback_time,
      hear_about, hear_other, promo_code, message,
      business_name, page, form_position
    ) VALUES (
      ${data.full_name}, ${data.email}, ${data.phone || ''},
      ${data.insurance_type || ''}, ${data.other_insurance || ''},
      ${data.contact_method || ''}, ${data.callback_day || ''}, ${data.callback_time || ''},
      ${data.hear_about || ''}, ${data.hear_other || ''}, ${data.promo_code || ''},
      ${data.message || ''}, ${data.business_name || ''},
      ${data.page || ''}, ${data.form_position || ''}
    )`;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Lead submission error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Server error. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
