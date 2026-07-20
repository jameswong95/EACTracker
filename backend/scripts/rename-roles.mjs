import { query } from '../src/db.js';

// 1. Drop old constraint
await query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);

// 2. Rename existing role values
await query(`UPDATE users SET role = 'Project Manager'  WHERE role = 'PM'`);
await query(`UPDATE users SET role = 'Project Director' WHERE role = 'PD'`);

// 3. Add new constraint with full names
await query(`ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('Project Manager','Project Director','Finance','Admin','Leader','System Engineer','Technical Director','Technical Manager','Support'))`);

const { rows } = await query(`SELECT role, count(*) FROM users GROUP BY role ORDER BY role`);
console.log('Role counts after migration:');
rows.forEach(r => console.log(`  ${r.role}: ${r.count}`));
process.exit(0);
