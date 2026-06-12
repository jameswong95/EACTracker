import React, { useState } from 'react';
import { useProjects } from '../data/store.js';

const DRAFT_SECTIONS = [
  {
    heading: 'What changed',
    text: 'Wave 1 closed on plan. Quality test rig at 2 of 5 units delivered; vendor confirms the remaining 3 units by 20 May. Network swap completed 4 days ahead of schedule — no disruption to operations.',
    highlights: [],
  },
  {
    heading: 'Schedule',
    text: null,
    parts: [
      { text: 'On plan overall. ', highlight: null },
      { text: 'Wave 2 kickoff slips one week', highlight: 'amber' },
      { text: ' pending headcount confirmation from resourcing team.', highlight: null },
    ],
  },
  {
    heading: 'Cost / EAC',
    text: null,
    parts: [
      { text: 'EAC ', highlight: null },
      { text: '$1.24M, +3.3% vs $1.20M budget', highlight: 'red' },
      { text: '. Mar server slippage absorbed an $8K expedite charge. Recognition tracking $77K ahead of plan — guardrail flagged for Finance review.', highlight: null },
    ],
  },
  {
    heading: 'Risks',
    text: 'Vendor lead-time remains tight; dual-source contract in progress with target close end-May. Wave 2 headcount confirmation needed from resourcing by 15 May.',
    highlights: [],
  },
  {
    heading: 'Next month',
    text: 'Complete test rig deployment, confirm wave 2 resourcing, close dual-source vendor contract.',
    highlights: [],
  },
];

const DEFAULT_BULLETS = `- test rig: vendor delivered 2/5, rest by 20 May
- network swap done, 4 days early
- Mar slippage on 2 servers, cost $8K expedite
- wave 2 kickoff next week, need Sara to confirm headcount
- risk: vendor lead time still tight, dual-source in motion`;

export default function Assists({ navigate }) {
  const { projects } = useProjects();
  const p = projects[0] || { id: '', name: 'No project', pm: '—' };
  const [bullets, setBullets] = useState(DEFAULT_BULLETS);
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  function generate() {
    setGenerating(true);
    setDraft(null);
    setTimeout(() => {
      setGenerating(false);
      setDraft(DRAFT_SECTIONS);
    }, 1600);
  }

  function regenerate() {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setDraft(DRAFT_SECTIONS);
    }, 1200);
  }

  function handleCopy() {
    const text = DRAFT_SECTIONS.map(s => {
      const body = s.text || s.parts.map(p => p.text).join('');
      return `${s.heading}\n${body}`;
    }).join('\n\n');
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSubmit() {
    setSubmitted(true);
    setTimeout(() => navigate('project', p.id), 1800);
  }

  const wordCount = draft
    ? DRAFT_SECTIONS.reduce((acc, s) => {
        const body = s.text || (s.parts || []).map(pt => pt.text).join('');
        return acc + body.split(/\s+/).filter(Boolean).length;
      }, 0)
    : 0;

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <div className="page-title">AI Update Drafter</div>
          <div className="page-sub">Monthly update — May '26 · {p.name}</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm">Save draft</button>
          <button className="btn btn-primary btn-sm" disabled={!draft} onClick={handleSubmit}>
            {submitted ? '✓ Submitted' : 'Submit to PD'}
          </button>
        </div>
      </div>

      {submitted && (
        <div className="alert alert-ok mb-4">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M2 9l5 5 9-9"/></svg>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Update submitted to Programme Director</div>
            <div style={{ fontSize: 12 }}>May '26 · {p.name} · redirecting to project…</div>
          </div>
        </div>
      )}

      <div className="flex gap-5" style={{ alignItems: 'flex-start' }}>

        {/* Left sidebar */}
        <div style={{ flex: '0 0 240px' }} className="flex-col gap-3">
          <div className="card card-p">
            <div className="flex items-center gap-2 mb-3">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="1" width="13" height="13" rx="2"/>
                <path d="M1 5h13M5 5v8"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Update template</span>
              <div className="grow" />
              <span className="badge badge-accent" style={{ fontSize: 9 }}>on-device</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>
              Same shape every month. PD can compare like-for-like across all projects.
            </div>
            <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 10 }}>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.8, color: 'var(--text-2)' }}>
                <li>What changed this month</li>
                <li>Schedule — on plan? slips?</li>
                <li>Cost / EAC movement + why</li>
                <li>Risks &amp; mitigation</li>
                <li>Next month's focus</li>
              </ul>
            </div>
          </div>

          <div className="card card-p">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Guardrails</div>
            {[
              { ok: true,  label: '120–250 words total' },
              { ok: true,  label: 'Plain English · no acronyms' },
              { ok: true,  label: '$ amounts must match EAC' },
              { ok: false, label: 'Flag anything >$25K change' },
            ].map((g, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <span className={`dot dot-${g.ok ? 'ok' : 'warn'}`} />
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{g.label}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)', fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
              Drafts mirror PD's preferred update style from approved exemplars.
            </div>
          </div>

          <div className="card card-p" style={{ background: 'var(--accent-light)', border: '1px solid var(--border-2)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>What goes in</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
              EAC numbers · SAP costs · resource plan · last 3 updates · risk register · your bullet notes
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>
              Nothing leaves your laptop — local model, off the cloud.
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-col gap-4 grow">
          {/* Bullet input */}
          <div className="card card-p">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Your bullets</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Private — only you see these</div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={generate}
                disabled={generating || !bullets.trim()}
                style={{ minWidth: 140 }}
              >
                {generating ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Generating…
                  </span>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6.5 1l1.2 3.6H11L8.2 7l1.2 3.6L6.5 8.5 3.8 10.6 5 7 2.2 4.6h3.3L6.5 1Z"/>
                    </svg>
                    Generate draft
                  </>
                )}
              </button>
            </div>
            <textarea
              className="textarea"
              rows={5}
              value={bullets}
              onChange={e => setBullets(e.target.value)}
              placeholder="- write bullet points about what happened this month..."
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Draft output */}
          {(generating || draft) && (
            <div className="card">
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Draft for PD</div>
                {draft && (
                  <span style={{ fontSize: 12, color: wordCount >= 120 && wordCount <= 250 ? 'var(--ok)' : 'var(--warn)', fontWeight: 600 }}>
                    {wordCount} words · {wordCount >= 120 && wordCount <= 250 ? 'within template ✓' : 'outside 120–250 range'}
                  </span>
                )}
              </div>

              {generating && (
                <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, border: '3px solid var(--border-2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Reading EAC data, SAP actuals, risk register…</div>
                </div>
              )}

              {draft && !generating && (
                <>
                  <div style={{ padding: '20px 24px', background: 'var(--warn-bg)', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {draft.map((section, si) => (
                      <div key={si}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: 5 }}>
                          {section.heading}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>
                          {section.text && section.text}
                          {section.parts && section.parts.map((part, pi) => {
                            if (!part.highlight) return <span key={pi}>{part.text}</span>;
                            if (part.highlight === 'amber') return (
                              <span key={pi} style={{ background: '#FFF0CC', padding: '1px 3px', borderBottom: '1.5px dashed var(--warn)', borderRadius: 2 }}>{part.text}</span>
                            );
                            if (part.highlight === 'red') return (
                              <span key={pi} style={{ background: 'var(--bad-bg)', padding: '1px 3px', borderRadius: 2 }}>{part.text}</span>
                            );
                            return <span key={pi}>{part.text}</span>;
                          })}
                        </div>
                      </div>
                    ))}

                    <div style={{ paddingTop: 14, borderTop: '1px dashed var(--border)', display: 'flex', gap: 20, alignItems: 'center' }}>
                      <div className="flex gap-3" style={{ fontSize: 11 }}>
                        <span className="flex items-center gap-1">
                          <span style={{ background: '#FFF0CC', padding: '1px 5px', borderBottom: '1.5px dashed var(--warn)', borderRadius: 2, fontSize: 10 }}>amber</span>
                          <span style={{ color: 'var(--text-3)' }}>needs your review</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span style={{ background: 'var(--bad-bg)', padding: '1px 5px', borderRadius: 2, fontSize: 10 }}>red</span>
                          <span style={{ color: 'var(--text-3)' }}>pulled from SAP · verify</span>
                        </span>
                      </div>
                      <div className="grow" />
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>model: pfms-update-7B · run 1.4s</span>
                    </div>
                  </div>

                  <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className="btn btn-ghost btn-sm" onClick={regenerate}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 2a5 5 0 1 0 1 3"/>
                        <path d="M9 1v3h3"/>
                      </svg>
                      Regenerate
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={regenerate}>Tighter</button>
                    <button className="btn btn-ghost btn-sm" onClick={regenerate}>Add detail on risks</button>
                    <div className="grow" />
                    <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--ok)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1.5 6l3 3 6-6"/>
                          </svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="4" width="7" height="7" rx="1"/>
                            <path d="M8 4V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2"/>
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleSubmit}>
                      Accept &amp; submit →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Context pulled card */}
          <div className="card card-p" style={{ background: 'var(--surface-2)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Context pulled automatically</div>
            <div className="flex gap-3 flex-wrap">
              {[
                { label: 'EAC', val: '$1.24M', sub: '+3.3% vs budget', status: 'warn' },
                { label: 'Actual CTD', val: '$480K', sub: 'from SAP Apr lock', status: 'ok' },
                { label: 'Last update', val: 'Apr \'26', sub: 'submitted on time', status: 'ok' },
                { label: 'Open risks', val: '2', sub: '1 high, 1 medium', status: 'warn' },
                { label: '% complete', val: `${p.percentComplete}%`, sub: 'of planned schedule', status: 'info' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 110 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: `var(--${item.status})` }}>{item.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
   );
}
