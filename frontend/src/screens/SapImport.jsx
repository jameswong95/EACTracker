import React, { useState, useRef } from 'react';
import { IMPORT_HISTORY } from '../data/mock.js';

const STEPS = ['Upload', 'Parse & map', 'Preview', 'Commit'];

export default function SapImport({ navigate }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState(false);
  const fileRef = useRef();

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    setTimeout(() => { setParsed(true); setStep(1); }, 1200);
    setTimeout(() => setStep(2), 2400);
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <div className="page-title">SAP Import</div>
          <div className="page-sub">Monthly cost data import · Finance only</div>
        </div>
        <div className="flex gap-2">
          <span style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>L. Cheng · Finance</span>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-2" style={{ opacity: i > step + 1 ? 0.4 : 1 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: i < step ? 'var(--ok)' : i === step ? 'var(--accent)' : 'var(--border)',
                color: i <= step ? 'white' : 'var(--text-3)',
              }}>
                {i < step ? (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1.5 5.5l3 3 5-5"/>
                  </svg>
                ) : i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: i === step ? 700 : 500, color: i === step ? 'var(--accent)' : i < step ? 'var(--ok-text)' : 'var(--text-3)' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < step ? 'var(--ok)' : 'var(--border)', maxWidth: 60 }} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex gap-5">
        <div className="grow flex-col gap-4">
          {/* Upload area */}
          {step <= 1 && (
            <div
              className={`dropzone${dragging ? ' active' : ''}`}
              onClick={() => fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])} />
              <div style={{ marginBottom: 12, color: 'var(--text-3)' }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6v20M12 18l8 10 8-10"/>
                  <path d="M6 34h28"/>
                </svg>
              </div>
              {file ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{file.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>{(file.size / 1024).toFixed(0)} KB · parsing…</div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Drop monthly SAP template here</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>or click to browse · .xlsx format</div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {['Projects', 'WBS hierarchy', 'Contract', 'Budget', 'Actuals', 'Commits'].map(s => (
                      <span key={s} className="badge badge-neutral">{s}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Parse results */}
          {step >= 1 && (
            <div className="card card-p">
              <div className="flex items-center justify-between mb-4">
                <h4>What this upload will do</h4>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>preview — before commit</span>
              </div>
              <div className="grid-4">
                {[
                  { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="8"/><path d="M10 6v8M6 10h8"/></svg>, label: 'Create', val: '3', sub: 'new projects + WBS', status: 'ok' },
                  { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4a8 8 0 1 1-2-1.4"/><path d="M14 1v4h4"/></svg>, label: 'Update', val: '47', sub: 'existing projects', status: 'info' },
                  { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="9" width="14" height="10" rx="1.5"/><path d="M7 9V6a3 3 0 0 1 6 0v3"/></svg>, label: 'Lock', val: "Apr '26", sub: '50 project EACs', status: 'warn' },
                  { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2L2 17h16L10 2Z"/><path d="M10 8v4M10 14.5v.5"/></svg>, label: 'Flag', val: '2', sub: 'exceptions to review', status: 'bad' },
                ].map((item, i) => (
                  <div key={i} className={`kpi-tile`} style={{ borderLeft: `3px solid var(--${item.status})` }}>
                    <div style={{ marginBottom: 6, color: `var(--${item.status})` }}>{item.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: `var(--${item.status}-text)`, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontWeight: 800, fontSize: 20 }}>{item.val}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exceptions */}
          {step >= 2 && (
            <div className="card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4>Exceptions · resolve before commit</h4>
                <span className="badge badge-warn">2 items</span>
              </div>
              {[
                { wbs: 'SE-NTW-7700', amount: '$8.4K', issue: 'WBS not found in project master', suggestions: ['Network Modernisation (97%)', 'Wireless Refresh (74%)'] },
                { wbs: 'QA-LAB-0210', amount: '$2.1K', issue: 'Missing PM assignment on project', suggestions: ['Assign PM before import'] },
              ].map((ex, i) => (
                <div key={i} style={{ padding: '14px 20px', borderBottom: i === 0 ? '1px solid var(--border)' : 'none', background: 'var(--warn-bg)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-warn">?</span>
                      <code className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{ex.wbs}</code>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{ex.amount}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm">Skip</button>
                      <button className="btn btn-ok btn-sm">Confirm →</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--warn-text)', marginBottom: 8 }}>{ex.issue}</div>
                  <div className="flex gap-2">
                    {ex.suggestions.map((s, si) => (
                      <button key={si} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>→ {s}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Commit button */}
          {step >= 2 && (
            <div className="flex gap-3 justify-end">
              <button className="btn btn-ghost" onClick={() => { setStep(0); setFile(null); setParsed(false); }}>Cancel</button>
              <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>
                {step === 3 ? '✓ Import committed' : 'Commit import →'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="alert alert-ok">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M2 9l5 5 9-9"/></svg>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Import committed successfully</div>
                <div style={{ fontSize: 12 }}>Apr '26 EAC locked for 50 projects · 47 updated · 3 created · logged: L.Cheng · {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: history */}
        <div style={{ flex: '0 0 300px' }}>
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h4>Import history</h4>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>One upload per month</div>
            </div>
            <div>
              {IMPORT_HISTORY.map((imp, i) => (
                <div key={i} style={{ padding: '12px 20px', borderBottom: i < IMPORT_HISTORY.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`dot dot-${imp.status}`} />
                  <div className="grow">
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{imp.period}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{imp.date} · {imp.by}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
                      {imp.created > 0 && `${imp.created} new · `}{imp.updated} updated · {imp.exceptions} exceptions
                    </div>
                  </div>
                  <span className={`badge badge-${imp.status}`} style={{ fontSize: 10 }}>
                    {imp.status === 'warn' ? 'Preview' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-p mt-4">
            <h4 style={{ marginBottom: 10 }}>Template sheets</h4>
            {['Projects', 'WBS hierarchy', 'Contract value', 'Budget (per WBS)', 'Actuals', 'Commitments'].map((s, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="var(--ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 5.5l3 3 5-5"/></svg>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{s}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-3)' }}>
              Same template every month. No mapping needed — SAP is the truth.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
