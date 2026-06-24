/**
 * Diagnostic: hits POST /api/users/login directly (bypassing the browser)
 * to see exactly what the server returns for the seeded user.
 *
 * Usage:
 *   cd apps/Axiom Seeds/server
 *   node check-login.js <email> <password>
 *
 * Example:
 *   node check-login.js amitfarm@gmail.com whateverPasswordYouSetAtSignup
 */

const BASE = process.env.API_URL || 'http://localhost:5001/api';

const identifier = process.argv[2];
const password   = process.argv[3];

if (!identifier || !password) {
  console.log('Usage: node check-login.js <email-or-mobile> <password>');
  process.exit(1);
}

(async () => {
  console.log(`POST ${BASE}/users/login`);
  console.log('Body:', { identifier, password: '*'.repeat(password.length) });
  console.log('---------------------------------------------');

  try {
    const res = await fetch(`${BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const text = await res.text();
    console.log('Status:', res.status, res.statusText);
    console.log('Headers:');
    for (const [k, v] of res.headers.entries()) console.log(`  ${k}: ${v}`);
    console.log('---------------------------------------------');
    console.log('Body:', text);

    try {
      const json = JSON.parse(text);
      console.log('---------------------------------------------');
      console.log('Parsed JSON:', json);
    } catch {
      console.log('(Response was not valid JSON)');
    }
  } catch (err) {
    console.error('Request failed:', err.message);
    console.error('Is the server running on port 5001?');
  }
})();
