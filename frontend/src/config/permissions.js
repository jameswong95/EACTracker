export const APP_ROLES = [
  'Project Manager',
  'Project Director',
  'Finance',
  'Leader',
  'System Engineer',
  'Technical Director',
  'Technical Manager',
  'Support',
  'Admin',
];

export const PERMISSION_ROLES = APP_ROLES.filter(role => role !== 'Admin');

export const ROLE_DEFAULTS = Object.fromEntries(APP_ROLES.map(role => [role, 'portfolio']));

export const PERMISSION_ACTIONS = [
  { id: 'create', label: 'C' },
  { id: 'read', label: 'R' },
  { id: 'update', label: 'U' },
  { id: 'delete', label: 'D' },
];

export const APP_MODULES = [
  { id: 'dashboard', label: 'Dashboard', group: 'General' },
  { id: 'portfolio', label: 'Portfolio', group: 'General' },
  { id: 'tenders', label: 'Tender Register', group: 'Tender' },
  { id: 'tender', label: 'Tender Detail', group: 'Tender' },
  { id: 'project', label: 'Project Overview', group: 'Project' },
  { id: 'project-initiation', label: 'Project Initiation', group: 'Project' },
  { id: 'resource', label: 'Resource Plan', group: 'Project' },
  { id: 'material', label: 'Material', group: 'Project' },
  { id: 'sub-con', label: 'Sub-Con', group: 'Project' },
  { id: 'others', label: 'Other LOB and MISC', group: 'Project' },
  { id: 'revrec', label: 'Rev. Rec.', group: 'Project' },
  { id: 'sap-import', label: 'SAP Import', group: 'Finance' },
  { id: 'standards', label: 'Standards', group: 'Finance' },
  { id: 'assists', label: 'AI Assist', group: 'General' },
  { id: 'pd-approvals', label: 'PD Approvals', group: 'Governance' },
];

export const ROLE_ALLOWED_INIT = {
  'Project Manager': [
    'dashboard', 'portfolio', 'tenders', 'tender', 'project', 'project-initiation',
    'resource', 'material', 'sub-con', 'others', 'revrec', 'standards',
  ],
  'Project Director': [
    'dashboard', 'portfolio', 'tenders', 'tender', 'project', 'project-initiation',
    'resource', 'material', 'sub-con', 'others', 'revrec', 'standards', 'pd-approvals',
  ],
  Finance: [
    'portfolio', 'tenders', 'tender', 'project', 'project-initiation', 'resource',
    'material', 'sub-con', 'others', 'revrec', 'sap-import', 'standards', 'assists',
  ],
  Leader: [
    'dashboard', 'portfolio', 'tenders', 'tender', 'project', 'project-initiation',
    'resource', 'material', 'sub-con', 'others', 'revrec', 'sap-import', 'standards',
    'assists', 'pd-approvals',
  ],
  'System Engineer': [
    'portfolio', 'project', 'project-initiation', 'resource', 'standards',
  ],
  'Technical Director': [
    'dashboard', 'portfolio', 'tenders', 'tender', 'project', 'project-initiation',
    'resource', 'material', 'sub-con', 'others', 'revrec', 'standards', 'assists',
    'pd-approvals',
  ],
  'Technical Manager': [
    'portfolio', 'tenders', 'tender', 'project', 'project-initiation', 'resource',
    'material', 'sub-con', 'others', 'standards', 'assists',
  ],
  Support: [
    'dashboard', 'portfolio', 'project', 'resource', 'standards',
  ],
  Admin: [
    'dashboard', 'portfolio', 'tenders', 'tender', 'project', 'project-initiation',
    'resource', 'material', 'sub-con', 'others', 'revrec', 'sap-import', 'standards',
    'assists', 'pd-approvals', 'admin-users', 'admin-pool', 'admin-permissions',
    'admin-audit', 'admin-wipe',
  ],
};

export const ROLE_ORDER = {
  Admin: 0,
  Leader: 1,
  'Technical Director': 2,
  'Technical Manager': 3,
  Finance: 4,
  'Project Director': 5,
  'Project Manager': 6,
  'System Engineer': 7,
  Support: 8,
};

export const ROLE_BADGE = {
  Admin: { color: 'var(--bad-text)', bg: 'var(--bad-bg)' },
  Leader: { color: '#7030A0', bg: 'rgba(112,48,160,0.12)' },
  Finance: { color: 'var(--ok-text)', bg: 'var(--ok-bg)' },
  'Project Director': { color: 'var(--accent)', bg: 'var(--accent-light)' },
  'Technical Director': { color: 'var(--accent)', bg: 'var(--accent-light)' },
  'Technical Manager': { color: 'var(--info-text)', bg: 'var(--info-bg)' },
  'Project Manager': { color: 'var(--info-text)', bg: 'var(--info-bg)' },
  'System Engineer': { color: 'var(--text-2)', bg: 'var(--surface-3)' },
  Support: { color: 'var(--text-2)', bg: 'var(--surface-3)' },
};

export const DEFAULT_ROLE_BADGE = { color: 'var(--text-2)', bg: 'var(--surface-3)' };

export const FINANCIAL_PROJECT_ROLES = new Set([
  'Admin',
  'Project Manager',
  'Project Director',
  'Finance',
  'Leader',
  'Technical Director',
  'Technical Manager',
]);

const WRITE_DEFAULTS = {
  Admin: APP_MODULES.map(module => module.id),
  Leader: [
    'dashboard', 'portfolio', 'tenders', 'tender', 'project', 'project-initiation',
    'resource', 'material', 'sub-con', 'others', 'revrec', 'sap-import', 'standards',
    'assists', 'pd-approvals',
  ],
  Finance: [
    'portfolio', 'tenders', 'tender', 'project', 'project-initiation', 'resource',
    'material', 'sub-con', 'others', 'revrec', 'sap-import', 'standards', 'assists',
  ],
  'Project Director': ['pd-approvals', 'tenders', 'tender'],
  'Project Manager': [
    'tenders', 'tender', 'project', 'project-initiation', 'resource',
    'material', 'sub-con', 'others', 'revrec',
  ],
  'Technical Director': [
    'tenders', 'tender', 'project', 'project-initiation', 'resource',
    'material', 'sub-con', 'others', 'standards',
  ],
  'Technical Manager': [
    'project', 'project-initiation', 'resource', 'material', 'sub-con', 'others', 'standards',
  ],
  'System Engineer': ['resource'],
  Support: [],
};

export function canViewProjectFinancials(role) {
  return FINANCIAL_PROJECT_ROLES.has(role);
}

export function mergeRolePermissions(saved) {
  const moduleIds = new Set(APP_MODULES.map(module => module.id));
  const out = {};
  for (const role of APP_ROLES) {
    const defaults = ROLE_ALLOWED_INIT[role] || [];
    const custom = Array.isArray(saved?.[role]) ? saved[role] : defaults;
    out[role] = Array.from(new Set(custom)).filter(id => moduleIds.has(id) || id.startsWith('admin-'));
  }
  out.Admin = ROLE_ALLOWED_INIT.Admin;
  return out;
}

export function makeCrudForRole(role, readable = ROLE_ALLOWED_INIT[role] || []) {
  const readableSet = new Set(readable);
  const writeSet = new Set(WRITE_DEFAULTS[role] || []);
  const out = {};
  for (const module of APP_MODULES) {
    const read = readableSet.has(module.id);
    const write = read && writeSet.has(module.id);
    out[module.id] = {
      create: write,
      read,
      update: write,
      delete: write && role !== 'System Engineer',
    };
  }
  return out;
}

export function mergeRoleCrud(saved, allowedFallback) {
  const actionIds = PERMISSION_ACTIONS.map(action => action.id);
  const out = {};
  for (const role of APP_ROLES) {
    const defaults = makeCrudForRole(role, allowedFallback?.[role] || ROLE_ALLOWED_INIT[role] || []);
    out[role] = {};
    for (const module of APP_MODULES) {
      const savedModule = saved?.[role]?.[module.id];
      out[role][module.id] = {};
      for (const action of actionIds) {
        out[role][module.id][action] = typeof savedModule?.[action] === 'boolean'
          ? savedModule[action]
          : defaults[module.id][action];
      }
    }
  }
  out.Admin = makeCrudForRole('Admin', ROLE_ALLOWED_INIT.Admin);
  return out;
}

export function roleAllowedFromCrud(roleCrud) {
  const out = {};
  for (const role of APP_ROLES) {
    out[role] = APP_MODULES
      .filter(module => roleCrud?.[role]?.[module.id]?.read)
      .map(module => module.id);
  }
  out.Admin = ROLE_ALLOWED_INIT.Admin;
  return out;
}

export function canModuleAction(roleCrud, role, moduleId, action = 'read') {
  if (role === 'Admin') return true;
  return Boolean(roleCrud?.[role]?.[moduleId]?.[action]);
}
