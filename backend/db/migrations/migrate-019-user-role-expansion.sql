-- PFMS - migration 019: expand user roles for configurable permissions

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN (
    'Project Manager',
    'Project Director',
    'Finance',
    'Admin',
    'Leader',
    'System Engineer',
    'Technical Director',
    'Technical Manager',
    'Support'
  ));
