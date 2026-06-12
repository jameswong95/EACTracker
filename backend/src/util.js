// Promise-based async route wrapper
export const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function requireFields(body, fields) {
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null || body[f] === '') {
      const e = new Error(`missing field: ${f}`);
      e.status = 400;
      throw e;
    }
  }
}

export async function logAudit(client, { entity_type, entity_id, action, field_name, old_value, new_value, user_id }) {
  await client.query(
    `INSERT INTO audit_log (entity_type, entity_id, action, field_name, old_value, new_value, user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [entity_type, String(entity_id), action, field_name || null,
     old_value == null ? null : String(old_value),
     new_value == null ? null : String(new_value),
     user_id || null]
  );
}
