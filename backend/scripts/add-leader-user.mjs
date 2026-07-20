import { query } from '../src/db.js';

// Extend the CHECK constraint to include all supported application roles.
await query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
await query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('Project Manager','Project Director','Finance','Admin','Leader','System Engineer','Technical Director','Technical Manager','Support'))`);

const exists = await query("SELECT id FROM users WHERE username='j.chen'");
if (exists.rows.length) { console.log('already exists'); }
else {
  await query("INSERT INTO users (username, full_name, initials, role) VALUES ($1,$2,$3,$4)",
    ['j.chen', 'Jennifer Chen', 'JC', 'Leader']);
  console.log('Leader user inserted');
}
process.exit(0);
