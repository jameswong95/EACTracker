import React, { useState } from 'react';
import { RATES } from '../data/mock.js';

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

export default function Standards({ navigate }) {
  const [rateTab, setRateTab] = useState('rates');
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <div className="page-title">Standards</div>
          <div className="page-sub">Finance-owned rate card and WBS structure reference</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setHistoryOpen(!historyOpen)}>📋 History</button>
          <button className="btn btn-primary btn-sm">Publish FY27 draft</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[['rates', 'Blended rate card'], ['wbs', 'WBS structure']].map(([k, l]) => (
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

      {rateTab === 'rates' && <RateTab />}
      {rateTab === 'wbs'   && <WbsTab />}
    </div>
  );
}

function RateTab() {
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
  const [expanded, setExpanded] = useState(new Set([0]));
  function toggle(i) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <>
      <div className="card card-p mb-4">
        <h4 style={{ marginBottom: 8 }}>WBS hierarchy explained</h4>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
          Main WBS (e.g. <code className="mono">123456789/001-1</code>) holds project-level data from SAP — contract value and total budget.
          Sub-jobs sit one level below (<code className="mono">…/001-1-1, -1-2, …</code>) and are named per project.
          Columns split: <span style={{ background: 'rgba(80,136,208,.15)', padding: '1px 5px', borderRadius: 3 }}>blue = from SAP</span> vs <span style={{ fontStyle: 'italic', color: 'var(--warn-text)' }}>italic = calculated each month</span>.
        </div>
      </div>
      <div className="flex-col gap-3">
        {WBS_TREE.map((proj, pi) => (
          <div key={pi} className="card">
            <div className="flex items-center gap-3 p-4" style={{ cursor: 'pointer', borderBottom: expanded.has(pi) ? '1px solid var(--border)' : 'none' }}
              onClick={() => toggle(pi)}>
              <span style={{ fontSize: 14, color: 'var(--text-3)' }}>{expanded.has(pi) ? '▾' : '▸'}</span>
              <code className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{proj.main}</code>
              <span style={{ fontWeight: 600 }}>{proj.name}</span>
              <div className="grow" />
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>PM: {proj.pm}</span>
              <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(80,136,208,.12)', fontSize: 12, fontWeight: 700, color: 'var(--info-text)', fontVariantNumeric: 'tabular-nums' }}>
                ${(proj.contract / 1000).toFixed(0)}K contract
              </div>
            </div>
            {expanded.has(pi) && (
              <div style={{ padding: '0 16px 12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Sub-job WBS</th>
                      <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Name</th>
                      <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Budget (SAP)</th>
                      <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', fontStyle: 'italic', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Actual CTD</th>
                      <th style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)', fontStyle: 'italic', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>EAC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proj.subjobs.map((sj, si) => (
                      <tr key={si} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <code className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>{proj.main.split('/')[0]}{sj.wbs}</code>
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 500 }}>{sj.name}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          <span style={{ background: 'rgba(80,136,208,.12)', padding: '2px 6px', borderRadius: 3, fontSize: 12, fontWeight: 600 }}>
                            ${(sj.budget / 1000).toFixed(0)}K
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontStyle: 'italic', color: 'var(--text-3)', fontSize: 12 }}>—</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontStyle: 'italic', color: 'var(--text-3)', fontSize: 12 }}>—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
