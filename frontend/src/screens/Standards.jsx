import React, { useState, useEffect } from 'react';
import { useRates, useProjects, fmt } from '../data/store.js';
import { api } from '../data/api.js';

const WBS_TREE = [
  {
    main: '123456789/001-1', name: 'EAC Refresh Programme', contract: 1200000, pm: 'Sara Tan',
    subjobs: [
      { wbs: '/001-1-1', name: 'Project management', budget: 180000 },
      { wbs: '/001-1-2', name: 'Main-con',            budget: 820000 },
      { wbs: '/001-1-3', name: 'Misc',                budget: 200000 },
    ],
  },
  {
    main: '234567890/002-1', name: 'Network Modernisation', contract: 900000, pm: 'A. Kumar',
    subjobs: [
      { wbs: '/002-1-1', name: 'Project management', budget: 180000 },
      { wbs: '/002-1-2', name: 'Main-con',            budget: 520000 },
      { wbs: '/002-1-3', name: 'Materials',           budget: 200000 },
    ],
  },
];

// Sentinel kept only as a fallback placeholder; live data is fetched at render time.
void WBS_TREE;

export default function Standards({ navigate, role }) {
  const isFinance = role === 'Finance' || role === 'Admin';
  const tabs = [
    ...(isFinance ? [['rates', 'Blended rate card'], ['wbs', 'WBS structure'], ['purchases', 'Purchases']] : []),
    ['catalog', 'Sub-job catalog'],
  ];
  const [rateTab, setRateTab] = useState(isFinance ? 'rates' : 'catalog');
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <div className="page-title">Standards</div>
          <div className="page-sub">
            {isFinance
              ? 'Finance-owned rate card and WBS structure reference'
              : 'Sub-job catalog reference'}
          </div>
        </div>
        {isFinance && (
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setHistoryOpen(!historyOpen)}>📋 History</button>
            <button className="btn btn-primary btn-sm">Publish FY27 draft</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setRateTab(k)}
            style={{
              padding: '10px 18px 8px', fontSize: 13, fontWeight: rateTab === k ? 600 : 500,
              color: rateTab === k ? 'var(--accent)' : 'var(--text-3)',
              border: 'none', background: 'transparent', cursor: 'pointer',
              borderBottom: rateTab === k ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, transition: 'all .15s',
            }}>{l}</button>
        ))}
      </div>

      {rateTab === 'rates'     && isFinance && <RateTab />}
      {rateTab === 'wbs'       && isFinance && <WbsTab />}
      {rateTab === 'purchases' && isFinance && <PurchasesTab />}
      {rateTab === 'catalog'   && <CatalogTab />}
    </div>
  );
}

function RateTab() {
  const RATES = useRates();
  return (
    <>
      {/* Header card */}
      <div className="card card-p mb-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 6 }}>Effective period</div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>1 Apr 2026 → 31 Mar 2027</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Refreshed annually · constant within the year</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24, marginLeft: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.8 }}>
              <div><strong>PM sees:</strong> Headcount only — rates applied automatically</div>
              <div><strong>Tender:</strong> Same rates feed the tender tool — no fork</div>
              <div><strong>Amendments:</strong> Finance Director sign-off required + retro freeze</div>
            </div>
          </div>
          <div className="grow" />
          <span className="badge badge-accent" style={{ alignSelf: 'flex-start' }}>Finance-owned · locked to PMs</span>
        </div>
      </div>

      {/* Rate grid */}
      <div className="card mb-5">
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h4>Daily rate by grade · SGD · FY26</h4>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>22 working days / month</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Grade</th>
                <th>Band / Role</th>
                <th style={{ textAlign: 'right' }}>Daily rate</th>
                <th style={{ textAlign: 'right' }}>Monthly (22d)</th>
                <th style={{ textAlign: 'right' }}>vs FY25</th>
                <th>In use by</th>
              </tr>
            </thead>
            <tbody>
              {RATES.map((r, i) => (
                <tr key={i}>
                  <td><span className="badge badge-accent" style={{ fontWeight: 800 }}>{r.grade}</span></td>
                  <td style={{ fontWeight: 500 }}>{r.title}</td>
                  <td className="num text-right" style={{ fontWeight: 700 }}>SGD {r.daily.toLocaleString()}</td>
                  <td className="num text-right" style={{ color: 'var(--text-2)' }}>SGD {r.monthly.toLocaleString()}</td>
                  <td className="num text-right">
                    <span style={{ color: 'var(--ok)', fontWeight: 600 }}>+{(3.5 + i * 0.2).toFixed(1)}%</span>
                  </td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{[142, 198, 156, 88, 42][i]} plans</td>
                </tr>
              ))}
              <tr style={{ background: 'var(--surface-2)' }}>
                <td><span className="badge badge-neutral" style={{ fontWeight: 800 }}>SC</span></td>
                <td style={{ color: 'var(--text-2)' }}>Sub-contractor pass-through</td>
                <td className="text-right" style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>—</td>
                <td className="text-right" style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>—</td>
                <td className="text-right" style={{ color: 'var(--text-3)' }}>—</td>
                <td style={{ fontSize: 12, color: 'var(--text-3)' }}>Use sub-con sub-job</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid-3">
        {[
          { title: 'PM visibility',    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="11" cy="11" rx="9" ry="6"/><circle cx="11" cy="11" r="2.5"/></svg>, body: 'Project Managers see headcount numbers only — never dollar rates. The system multiplies behind the scenes using the locked rate card.' },
          { title: 'Tender alignment', icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="14" height="18" rx="2"/><path d="M8 7h6M8 11h6M8 15h4"/></svg>, body: 'Identical rate table feeds the tender estimation tool, ensuring no fork between bid price and execution budget.' },
          { title: 'Change control',   icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="12" height="9" rx="1.5"/><path d="M8 11V7.5a3 3 0 0 1 6 0V11"/></svg>, body: 'Annual refresh only. Mid-year rate changes require Finance Director approval and trigger a retrospective EAC freeze across all open projects.' },
        ].map((c, i) => (
          <div key={i} className="card card-p">
            <div style={{ fontSize: 24, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{c.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{c.body}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function WbsTab() {
  const { projects, loading } = useProjects();
  const [expanded, setExpanded]   = useState(new Set());
  const [subjobs, setSubjobs]     = useState({}); // { [projectId]: rows | 'loading' | 'error' }

  function toggle(id) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    if (!subjobs[id]) loadSubjobs(id);
  }

  async function loadSubjobs(id) {
    setSubjobs(prev => ({ ...prev, [id]: 'loading' }));
    try {
      const rows = await api.get(`/api/sub-jobs?project_id=${encodeURIComponent(id)}`);
      setSubjobs(prev => ({ ...prev, [id]: rows }));
    } catch {
      setSubjobs(prev => ({ ...prev, [id]: 'error' }));
    }
  }

  return (
    <>
      <div className="card card-p mb-4">
        <h4 style={{ marginBottom: 8 }}>WBS hierarchy explained</h4>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
          Main WBS holds project-level data from SAP — contract value and total budget.
          Sub-jobs sit one level below and are named per project.
          Columns split: <span style={{ background: 'rgba(80,136,208,.15)', padding: '1px 5px', borderRadius: 3 }}>blue = from SAP</span> vs <span style={{ fontStyle: 'italic', color: 'var(--warn-text)' }}>italic = calculated each month</span>.
        </div>
      </div>

      {loading && <div style={{ padding: 24, color: 'var(--text-3)' }}>Loading projects…</div>}
      {!loading && projects.length === 0 && (
        <div className="card card-p" style={{ color: 'var(--text-3)' }}>
          No projects yet. Once SAP import runs, the WBS tree will appear here.
        </div>
      )}

      <div className="flex-col gap-3">
        {projects.map(proj => {
          const open = expanded.has(proj.id);
          const rows = subjobs[proj.id];
          return (
            <div key={proj.id} className="card">
              <div
                className="flex items-center gap-3 p-4"
                style={{ cursor: 'pointer', borderBottom: open ? '1px solid var(--border)' : 'none' }}
                onClick={() => toggle(proj.id)}
              >
                <span style={{ fontSize: 14, color: 'var(--text-3)' }}>{open ? '▾' : '▸'}</span>
                <code className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{proj.wbs}</code>
                <span style={{ fontWeight: 600 }}>{proj.name}</span>
                <div className="grow" />
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>PM: {proj.pm}</span>
                <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(80,136,208,.12)', fontSize: 12, fontWeight: 700, color: 'var(--info-text)', fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(proj.contractValue || proj.budget)} contract
                </div>
              </div>
              {open && (
                <div style={{ padding: '0 16px 12px' }}>
                  {rows === 'loading' && (
                    <div style={{ padding: 16, color: 'var(--text-3)', fontSize: 12 }}>Loading sub-jobs…</div>
                  )}
                  {rows === 'error' && (
                    <div style={{ padding: 16, color: 'var(--bad)', fontSize: 12 }}>Could not load sub-jobs.</div>
                  )}
                  {Array.isArray(rows) && rows.length === 0 && (
                    <div style={{ padding: 16, color: 'var(--text-3)', fontSize: 12 }}>No sub-jobs imported for this project yet.</div>
                  )}
                  {Array.isArray(rows) && rows.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Sub-job WBS</th>
                          <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Name</th>
                          <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Budget (SAP)</th>
                          <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Actual CTD</th>
                          <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', fontStyle: 'italic', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>EAC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(sj => {
                          const budget = Number(sj.plan_cos) || 0;
                          const actual = Number(sj.tot_cost) || 0;
                          const committed = Number(sj.com_cst) || 0;
                          const etc = Number(sj.etc_total) || 0;
                          const eac = Number(sj.eac_total) || (actual + committed + etc);
                          return (
                            <tr key={sj.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px 10px' }}>
                                <code className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>{sj.wbs_code}</code>
                              </td>
                              <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 500 }}>{sj.name}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                <span style={{ background: 'rgba(80,136,208,.12)', padding: '2px 6px', borderRadius: 3, fontSize: 12, fontWeight: 600 }}>
                                  {fmt(budget)}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
                                {fmt(actual)}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontStyle: 'italic', fontSize: 12, fontVariantNumeric: 'tabular-nums', color: eac > budget ? 'var(--warn-text)' : 'var(--text-2)' }}>
                                {fmt(eac)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// -- Sub-job catalog ------------------------------------------------------
// Standard categories distilled from SAP project cost reports.
// PMs use this as the reference when creating sub-jobs in SAP so that
// portfolio-level rollups (by category) become meaningful.

const SUBJOB_CATALOG = {
  A: {
    title: 'Tier A - Core delivery categories',
    sub:   'Used on virtually every project. Pick the ones that apply.',
    items: [
      { code: 'PRELIM',  name: 'Preliminary',                       desc: 'Site setup, mobilisation, project preliminaries.' },
      { code: 'PM',      name: 'Project Management',                desc: 'PM time, project coordination, governance.' },
      { code: 'ENG',     name: 'PM & Engineering',                  desc: 'Combined PM + engineering effort (use when not split).' },
      { code: 'SD',      name: 'System Design',                     desc: 'System-level design effort.' },
      { code: 'ID',      name: 'Installation Design',               desc: 'Installation drawings and design.' },
      { code: 'MFG',     name: 'Manufacturing / Hardware',          desc: 'Equipment manufacturing, hardware procurement.' },
      { code: 'SW',      name: 'Software / Licences',               desc: 'Software development, licences, services.' },
      { code: 'INST',    name: 'Installation & Cabling',            desc: 'On-site installation and cabling work.' },
      { code: 'SUB',     name: 'Sub-contractor',                    desc: 'Sub-contracted scope (pass-through cost).' },
      { code: 'SUP',     name: 'Site Supervision',                  desc: 'On-site supervisory effort.' },
      { code: 'STC',     name: 'Site Testing & Commissioning',      desc: 'Field testing, commissioning, handover.' },
      { code: 'DRF',     name: 'Drafting Support',                  desc: 'Drafting, CAD, documentation support.' },
      { code: 'PLN',     name: 'Planning Support (IWR / Primavera)',desc: 'Planning, scheduling, Primavera support.' },
      { code: 'MAT',     name: 'Materials',                         desc: 'Bulk materials separate from equipment.' },
      { code: 'LAB',     name: 'Labour',                            desc: 'Direct labour not captured elsewhere.' },
    ],
  },
  B: {
    title: 'Tier B - Compliance & assurance (project-dependent)',
    sub:   'Add only when the contract requires them.',
    items: [
      { code: 'EMC',     name: 'EMC & Type Test',                   desc: 'EMC testing, type approval.' },
      { code: 'RAM',     name: 'System Assurance (RAM)',            desc: 'Reliability/availability/maintainability.' },
      { code: 'SAFE',    name: 'Safety',                            desc: 'Safety case, safety assurance.' },
      { code: 'ITSEC',   name: 'IT Network Security',               desc: 'Cyber/network security scope.' },
      { code: 'CIVDEF',  name: 'Civil Defence Provision',           desc: 'CD compliance items.' },
      { code: 'FAT',     name: 'FAT / Staging',                     desc: 'Factory acceptance, staging environment.' },
      { code: 'TRAIN',   name: 'Training (STC / ITTC)',             desc: 'End-user / operator training.' },
    ],
  },
  C: {
    title: 'Tier C - Lifecycle & exception buckets',
    sub:   'Always create these even if zero - they isolate exception costs and warranty/VO from the main scope.',
    items: [
      { code: 'R',   name: 'Rework',                  suffix: '-R',     desc: 'Rework cost - tracked separately for margin analysis.' },
      { code: 'CC',  name: 'Customer Complaints',     suffix: '-C',     desc: 'Handling of customer complaints.' },
      { code: 'ENT', name: 'Entertainment Expenses',  suffix: '-E',     desc: 'Entertainment expenses (audit-tracked).' },
      { code: 'AST', name: 'Project Assets',          suffix: '-A',     desc: 'Capitalised project assets.' },
      { code: 'VO',  name: 'Variation Orders (parent)', suffix: '-VO', desc: 'VO scope. Cost children sit under this (e.g. -VO-1).' },
      { code: 'W',   name: 'DLP / Warranty',          suffix: '-W',     desc: 'Defect Liability Period / warranty months.' },
      { code: 'WA',  name: 'Warranty - Accepted',     suffix: '-W-A',   desc: 'Warranty cost accepted/agreed.' },
      { code: 'WN',  name: 'Non-warranty Cost',       suffix: '-WN',    desc: 'Costs outside warranty cover.' },
      { code: 'WAC', name: 'Accepted Warranty Costs', suffix: '-WA',    desc: 'Warranty costs accepted for reimbursement.' },
      { code: 'ERR', name: 'Error in Creation',       suffix: '-ERR',   desc: 'Housekeeping bucket for SAP entry errors.' },
    ],
  },
};

const TIER_COLOR = {
  A: { bg: 'rgba(80,136,208,.12)',  text: 'var(--info-text)' },
  B: { bg: 'rgba(160,120,200,.15)', text: 'var(--accent)' },
  C: { bg: 'rgba(200,140,80,.14)',  text: 'var(--warn-text)' },
};

function CatalogTab() {
  return (
    <>
      <div className="card card-p mb-4">
        <h4 style={{ marginBottom: 8 }}>Standard sub-job catalog</h4>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
          Use these category names when creating sub-jobs in SAP so portfolio
          rollups stay consistent. SAP remains the source of truth for the WBS
          code and cost numbers - this list is a reference to keep naming
          standardised across projects.
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 10, lineHeight: 1.6 }}>
          SAP format: <code className="mono">{'<wbs>-<seq>'}</code> for Tier A/B
          items (e.g. <code className="mono">214687801/035-6</code> = Project Management).
          Tier C items use a suffix (e.g. <code className="mono">...-W</code> for warranty).
        </div>
      </div>

      <div className="flex-col gap-4">
        {Object.entries(SUBJOB_CATALOG).map(([tier, group]) => (
          <div key={tier} className="card">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                background: TIER_COLOR[tier].bg, color: TIER_COLOR[tier].text,
              }}>
                Tier {tier}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{group.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{group.sub}</div>
              </div>
              <div className="grow" />
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{group.items.length} categories</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>Code</th>
                    <th>Category</th>
                    {tier === 'C' && <th style={{ width: 110 }}>SAP suffix</th>}
                    <th>Description / when to use</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map(item => (
                    <tr key={item.code}>
                      <td>
                        <code className="mono" style={{ fontSize: 11, fontWeight: 600, color: TIER_COLOR[tier].text }}>
                          {item.code}
                        </code>
                      </td>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      {tier === 'C' && (
                        <td>
                          <code className="mono" style={{ fontSize: 11, color: 'var(--text-2)' }}>
                            {item.suffix}
                          </code>
                        </td>
                      )}
                      <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{item.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="card card-p mt-4">
        <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text-2)' }}>Tip:</strong> If a project needs a category
          you cannot find here, flag it to Finance so the catalog can be extended.
          Creating ad-hoc names in SAP breaks portfolio reporting.
        </div>
      </div>
    </>
  );
}

// ── Purchases tab (Finance read-only cross-project view) ──────────────────

const PURCHASE_CATEGORIES = {
  hardware:    { label: 'Hardware',     color: '#5088d0' },
  software:    { label: 'Software',     color: '#6f42c1' },
  licence:     { label: 'Licence',      color: '#28a745' },
  subcontract: { label: 'Sub-contract', color: '#e8961f' },
  other:       { label: 'Other',        color: '#909090' },
};

function PurchasesTab() {
  const [rows, setRows]   = useState(null);
  const [err, setErr]     = useState(null);
  const [q, setQ]         = useState('');
  const [catFilter, setCatFilter]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  useEffect(() => {
    api.get('/api/sub-jobs/planned-items/all')
      .then(setRows)
      .catch(e => { setErr(e); setRows([]); });
  }, []);

  if (err && (!rows || rows.length === 0)) {
    return <div className="card card-p" style={{ color: 'var(--bad)' }}>Failed to load: {err.message}</div>;
  }
  if (rows === null) {
    return <div style={{ padding: 24, color: 'var(--text-3)' }}>Loading purchases…</div>;
  }

  const projects = Array.from(new Set(rows.map(r => r.project_id))).sort();

  const filtered = rows.filter(r => {
    if (catFilter && r.category !== catFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (projectFilter && r.project_id !== projectFilter) return false;
    if (q) {
      const hay = `${r.description} ${r.vendor || ''} ${r.project_name} ${r.sub_job_name} ${r.wbs_code}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const totals = filtered.reduce((acc, r) => {
    const c = r.category;
    acc[c] = (acc[c] || 0) + Number(r.amount || 0);
    acc._total += Number(r.amount || 0);
    return acc;
  }, { _total: 0 });

  return (
    <>
      <div className="card card-p mb-4">
        <h4 style={{ marginBottom: 8 }}>Planned purchases across all projects</h4>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
          Cross-project view of every item PMs have planned at sub-job level.
          Use this to consolidate licence renewals or hardware buys before they
          turn into SAP commitments. Read-only — items are entered by PMs on their project pages.
        </div>
      </div>

      {/* Category totals */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {Object.entries(PURCHASE_CATEGORIES).map(([k, info]) => (
          <div key={k} className="card" style={{ padding: '10px 14px', minWidth: 140 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: info.color, marginBottom: 4 }}>
              {info.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {fmt(totals[k] || 0)}
            </div>
          </div>
        ))}
        <div className="card" style={{ padding: '10px 14px', minWidth: 140, background: 'var(--accent-light)', borderColor: 'var(--accent)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--accent)', marginBottom: 4 }}>
            Total
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--accent)' }}>
            {fmt(totals._total)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-p mb-3" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search description, vendor, project, WBS..."
          style={{ flex: 1, minWidth: 220, padding: '7px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 13, fontFamily: 'inherit' }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 13, fontFamily: 'inherit' }}>
          <option value="">All categories</option>
          {Object.entries(PURCHASE_CATEGORIES).map(([k, info]) => <option key={k} value={k}>{info.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 13, fontFamily: 'inherit' }}>
          <option value="">All statuses</option>
          <option value="planned">Planned</option>
          <option value="committed">Committed</option>
          <option value="received">Received</option>
        </select>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 13, fontFamily: 'inherit' }}>
          <option value="">All projects</option>
          {projects.map(pid => <option key={pid} value={pid}>{pid}</option>)}
        </select>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{filtered.length} of {rows.length}</span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            {rows.length === 0
              ? 'No planned items have been recorded yet. PMs can add them from the sub-job breakdown on each project page.'
              : 'No items match the filters.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Project</th>
                <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Sub-job</th>
                <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Category</th>
                <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Description</th>
                <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Vendor</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Amount</th>
                <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Status</th>
                <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>Added by</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => {
                const cat = PURCHASE_CATEGORIES[it.category] || { label: it.category, color: '#909090' };
                return (
                  <tr key={it.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{it.project_name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{it.project_id}</div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <code className="mono" style={{ fontSize: 10, color: 'var(--accent)' }}>{it.wbs_code}</code>
                      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{it.sub_job_name}</div>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                        background: cat.color + '22', color: cat.color,
                      }}>{cat.label}</span>
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{it.description}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-3)' }}>{it.vendor || '—'}</td>
                    <td className="num text-right" style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {fmt(Number(it.amount))}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-2)', textTransform: 'capitalize' }}>{it.status}</td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-3)' }}>{it.created_by_name || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
