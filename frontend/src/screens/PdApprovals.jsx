import React, { useState } from 'react';

const QUEUE = [
  {
    id: 1, type: 'Re-baseline', tone: 'warn',
    project: 'EAC Refresh Programme', pm: 'Sara Tan', age: '1 day',
    summary: 'PM requesting a baseline reset on the recognition plan.',
    original: '$1.20M over 3 yrs — approved 12 Mar \'26',
    proposed: '$1.24M (+3.3%) — 2 sub-jobs uplifted',
    impact: '+$28K Y1 · +$12K Y2',
    note: 'Network swap completed early but vendor lead-time on quality test rig pushed hardware into May. EAC drift now $40K — recommend baseline reset so future recognition curve stays achievable.',
    evidence: ['EAC v3.xlsx', 'Vendor email · 18 May', 'May draft update'],
  },
  {
    id: 2, type: 'Variance ack', tone: 'bad',
    project: 'Network Modernisation', pm: 'A. Kumar', age: '1 day',
    summary: 'PM acknowledging a >5% cost variance requiring PD sign-off.',
    original: 'Budget $900K',
    proposed: 'EAC now $880K (-2.2%)',
    impact: 'Under budget — favourable variance',
    note: 'Scope reduction approved in Feb removed 2 distribution nodes. Saving is structural, not temporary. No schedule impact.',
    evidence: ['Scope change notice · 14 Feb', 'EAC update Apr \'26'],
  },
  {
    id: 3, type: 'Re-baseline', tone: 'warn',
    project: 'Quality Lab Build-out', pm: 'M. Wee', age: '2 days',
    summary: 'Baseline uplift following equipment price increase.',
    original: '$420K — approved Oct \'25',
    proposed: '$448K (+6.7%)',
    impact: '+$28K total',
    note: 'Specialist test equipment prices increased 8% following global supply constraint. Three quotes attached — all within 1% of each other.',
    evidence: ['Quotes x3 · May \'26', 'EAC revision summary'],
  },
  {
    id: 4, type: 'New project', tone: 'info',
    project: 'Branch Wi-Fi Refresh', pm: 'M. Wee', age: '2 days',
    summary: 'New project requiring PD sign-off to proceed.',
    original: 'No prior baseline',
    proposed: '$185K · 8 months',
    impact: 'New WBS required in SAP',
    note: 'Board-approved initiative from Q1 planning. All procurement to follow standard panel. Resourcing confirmed with IT ops.',
    evidence: ['Business case · Jan \'26', 'Resource confirmation'],
  },
  {
    id: 5, type: 'Variance ack', tone: 'warn',
    project: 'Wave 3 Cabling', pm: 'K. Yeo', age: '3 days',
    summary: 'Minor cost overrun on cabling materials.',
    original: 'Budget $340K',
    proposed: 'EAC $341.4K (+0.4%)',
    impact: '+$1.4K — within contingency',
    note: 'Material cost increase absorbed within contingency. No impact to schedule or quality outcomes.',
    evidence: ['Purchase orders · Apr \'26'],
  },
];

const TONE_LABEL = { warn: 'At risk', bad: 'Urgent', info: 'Info', ok: 'On track' };

export default function PdApprovals({ navigate }) {
  const [selected, setSelected] = useState(QUEUE[0].id);
  const [decisions, setDecisions] = useState({});

  const item = QUEUE.find(q => q.id === selected);
  const pending = QUEUE.filter(q => !decisions[q.id]);

  function decide(id, verdict) {
    setDecisions(prev => ({ ...prev, [id]: verdict }));
    const next = QUEUE.find(q => q.id !== id && !decisions[q.id] && q.id !== selected);
    if (next) setSelected(next.id);
  }

  return (
    <div className="screen" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div>
          <div className="page-title">Approvals</div>
          <div className="page-sub">Items awaiting your decision · K. Rajah, Project Director</div>
        </div>
        <div className="grow" />
        <span className="badge badge-warn">{pending.length} pending</span>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>SLA: respond within 3 days</span>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Queue list */}
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--surface-2)', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {QUEUE.map(q => {
            const verdict = decisions[q.id];
            return (
              <button
                key={q.id}
                onClick={() => setSelected(q.id)}
                style={{
                  width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                  borderRadius: 8, padding: '12px', transition: 'all .12s',
                  background: selected === q.id ? 'var(--surface)' : 'transparent',
                  boxShadow: selected === q.id ? 'var(--shadow-sm)' : 'none',
                  outline: selected === q.id ? `1px solid var(--border-2)` : '1px solid transparent',
                  opacity: verdict ? 0.5 : 1,
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className={`badge badge-${q.tone}`} style={{ fontSize: 10 }}>{q.type}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>{q.age}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3, lineHeight: 1.3 }}>{q.project}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>PM: {q.pm}</div>
                {verdict && (
                  <div style={{ marginTop: 6 }}>
                    <span className={`badge badge-${verdict === 'approved' ? 'ok' : verdict === 'rejected' ? 'bad' : 'info'}`} style={{ fontSize: 10 }}>
                      {verdict}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        {item && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className={`badge badge-${item.tone}`}>{item.type}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Requested by {item.pm} · {item.age} ago</span>
              </div>
              <h2 style={{ marginBottom: 4 }}>{item.project}</h2>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{item.summary}</div>
            </div>

            {/* Before / After */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="kpi-tile">
                <div className="kpi-label">Before</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 8, lineHeight: 1.4 }}>{item.original}</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-label">Proposed</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warn)', marginTop: 8, lineHeight: 1.4 }}>{item.proposed}</div>
              </div>
              <div className="kpi-tile">
                <div className="kpi-label">Financial impact</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 8, lineHeight: 1.4 }}>{item.impact}</div>
              </div>
            </div>

            {/* PM note */}
            <div className="card card-p">
              <h4 style={{ marginBottom: 10 }}>PM's note</h4>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, fontStyle: 'italic' }}>
                "{item.note}"
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 8 }}>Evidence attached</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {item.evidence.map((e, i) => (
                    <span key={i} className="tag" style={{ cursor: 'pointer' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <rect x="1" y="1" width="10" height="10" rx="1.5" />
                        <path d="M3 4h6M3 6h6M3 8h4" />
                      </svg>
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Decision */}
            {decisions[item.id] ? (
              <div className={`alert alert-${decisions[item.id] === 'approved' ? 'ok' : decisions[item.id] === 'rejected' ? 'bad' : 'info'}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 4L6 12l-3-3" />
                </svg>
                <span>You {decisions[item.id]} this request. Decision logged to audit trail.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => decide(item.id, 'changes requested')}>
                  Request changes
                </button>
                <div className="grow" />
                <button className="btn btn-danger" onClick={() => decide(item.id, 'rejected')}>
                  Reject
                </button>
                <button className="btn btn-primary" onClick={() => decide(item.id, 'approved')}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11.5 3.5L5 10.5l-2.5-2.5" />
                  </svg>
                  Approve
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
