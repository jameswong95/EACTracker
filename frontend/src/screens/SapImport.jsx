import React, { useState, useRef } from 'react';
import { api } from '../data/api.js';
import { useSapImports, fmt, MONTHS } from '../data/store.js';

const STEPS = ['Upload', 'Preview', 'Commit', 'Done'];

function StatusBadge({ status, children }) {
  return <span className={`badge badge-${status}`}>{children}</span>;
}

export default function SapImport({ navigate, session }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState(null);
  const today = new Date();
  const [periodYear, setPeriodYear]   = useState(today.getFullYear());
  const [periodMonth, setPeriodMonth] = useState(today.getMonth() + 1);
  const fileRef = useRef();
  const { history, reload: reloadHistory } = useSapImports();

  async function handleFile(f) {
    if (!f) return;
    setFile(f);
    setError(null);
    setPreview(null);
    // Auto-detect period from filename: YYYY-MM, YYYY_MM, YYYYMM, or _MMYYYY
    const name = f.name || '';
    let m = name.match(/(20\d{2})[-_.]?(0[1-9]|1[0-2])(?!\d)/);
    if (!m) m = name.match(/(?<!\d)(0[1-9]|1[0-2])[-_.](20\d{2})/);
    if (m) {
      const year  = Number(m[1].length === 4 ? m[1] : m[2]);
      const month = Number(m[1].length === 4 ? m[2] : m[1]);
      setPeriodYear(year);
      setPeriodMonth(month);
    }
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const result = await api.upload('/api/sap/preview', fd);
      setPreview(result);
      setStep(1);
    } catch (e) {
      setError(e.message || 'Failed to parse file');
    } finally {
      setParsing(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function handleCommit() {
    if (!file) return;
    setCommitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('period_year',  String(periodYear));
      fd.append('period_month', String(periodMonth));
      if (session?.id) fd.append('imported_by', String(session.id));
      const result = await api.upload('/api/sap/commit', fd);
      setCommitResult(result);
      setStep(3);
      reloadHistory();
    } catch (e) {
      setError(e.message || 'Failed to commit import');
    } finally {
      setCommitting(false);
    }
  }

  function reset() {
    setStep(0); setFile(null); setPreview(null); setCommitResult(null); setError(null);
  }

  const exceptionCount = preview?.projects?.filter(p => !p.totals || !p.name).length || 0;

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <div className="page-title">SAP Import</div>
          <div className="page-sub">Monthly ZPSR0021A cost report · Finance only</div>
        </div>
        <div className="flex gap-2">
          <span style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
            {session?.full_name || '—'} · {session?.role || ''}
          </span>
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

      {error && (
        <div className="alert alert-bad mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="flex gap-5">
        <div className="grow flex-col gap-4">
          {/* Upload */}
          {step === 0 && (
            <div
              className={`dropzone${dragging ? ' active' : ''}`}
              onClick={() => !parsing && fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{ cursor: parsing ? 'wait' : 'pointer' }}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])} />
              <div style={{ marginBottom: 12, color: 'var(--text-3)' }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6v20M12 18l8 10 8-10"/>
                  <path d="M6 34h28"/>
                </svg>
              </div>
              {parsing ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{file?.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>Parsing…</div>
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

          {/* Preview + commit */}
          {step >= 1 && preview && (
            <>
              <div className="card card-p">
                <div className="flex items-center justify-between mb-4">
                  <h4>Parsed file · {preview.filename}</h4>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>preview — before commit</span>
                </div>
                <div className="grid-4">
                  {[
                    { label: 'Projects',   val: preview.project_count, sub: 'in workbook', status: 'info' },
                    { label: 'Sub-jobs',   val: preview.sub_job_count, sub: 'WBS items',   status: 'info' },
                    { label: 'Exceptions', val: exceptionCount,        sub: 'missing totals/name', status: exceptionCount > 0 ? 'warn' : 'ok' },
                    { label: 'Period',     val: `${MONTHS[periodMonth-1]} '${String(periodYear).slice(-2)}`, sub: 'target period', status: 'ok' },
                  ].map((item, i) => (
                    <div key={i} className="kpi-tile" style={{ borderLeft: `3px solid var(--${item.status})` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: `var(--${item.status}-text)`, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontWeight: 800, fontSize: 20 }}>{item.val}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{item.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <h4>Projects in upload</h4>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>SAP no.</th>
                        <th>Name</th>
                        <th>Customer</th>
                        <th className="num">Sub-jobs</th>
                        <th className="num">Plan</th>
                        <th className="num">Actual</th>
                        <th className="num">Committed</th>
                        <th className="num">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.projects.map((p, i) => (
                        <tr key={i}>
                          <td><code className="mono" style={{ fontSize: 12 }}>{p.sap_project_no}</code></td>
                          <td style={{ fontWeight: 500 }}>{p.name || <em style={{ color: 'var(--warn)' }}>(no name)</em>}</td>
                          <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{p.customer || '—'}</td>
                          <td className="num">{p.sub_jobs?.length || 0}</td>
                          <td className="num">{p.totals ? fmt(p.totals.plan_cos) : '—'}</td>
                          <td className="num">{p.totals ? fmt(p.totals.tot_cost) : '—'}</td>
                          <td className="num">{p.totals ? fmt(p.totals.com_cst) : '—'}</td>
                          <td className="num">{p.totals ? fmt(-p.totals.rev) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {step === 1 && (
                <div className="card card-p">
                  <h4 style={{ marginBottom: 12 }}>Set target period</h4>
                  <div className="flex gap-3 items-center mb-4">
                    <label style={{ fontSize: 12, color: 'var(--text-2)' }}>
                      Month
                      <select className="input" value={periodMonth} onChange={e => setPeriodMonth(+e.target.value)}
                        style={{ marginLeft: 8, width: 120 }}>
                        {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                    </label>
                    <label style={{ fontSize: 12, color: 'var(--text-2)' }}>
                      Year
                      <input type="number" className="input" value={periodYear} onChange={e => setPeriodYear(+e.target.value)}
                        style={{ marginLeft: 8, width: 100 }} />
                    </label>
                    <div className="grow" />
                    <button className="btn btn-ghost" onClick={reset} disabled={committing}>Cancel</button>
                    <button className="btn btn-primary btn-lg" onClick={handleCommit} disabled={committing}>
                      {committing ? 'Committing…' : 'Commit import →'}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    This will create or update <strong>{preview.project_count}</strong> projects,
                    replace <strong>{preview.sub_job_count}</strong> sub-jobs, and lock
                    <strong> {MONTHS[periodMonth - 1]} {periodYear}</strong>.
                  </div>
                </div>
              )}
            </>
          )}

          {/* Done */}
          {step === 3 && commitResult && (
            <div className="alert alert-ok">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M2 9l5 5 9-9"/></svg>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Import committed successfully</div>
                <div style={{ fontSize: 12 }}>
                  Import #{commitResult.import_id} · {commitResult.created} created · {commitResult.updated} updated · {commitResult.exceptions} exceptions ·
                  {' '}{MONTHS[periodMonth - 1]} {periodYear} locked
                </div>
                <div style={{ marginTop: 10 }}>
                  <button className="btn btn-ghost btn-sm" onClick={reset}>Upload another</button>
                  <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}
                    onClick={() => navigate('portfolio')}>View portfolio →</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: history */}
        <div style={{ flex: '0 0 320px' }}>
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h4>Import history</h4>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Most recent first</div>
            </div>
            <div>
              {history.length === 0 ? (
                <div style={{ padding: 20, fontSize: 12, color: 'var(--text-3)' }}>No imports yet.</div>
              ) : history.map((imp, i) => (
                <div key={imp.id} style={{ padding: '12px 20px', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`dot dot-${imp.status}`} />
                  <div className="grow">
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{imp.period}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{imp.date} · {imp.by}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
                      {imp.created > 0 && `${imp.created} new · `}{imp.updated} updated{imp.exceptions > 0 ? ` · ${imp.exceptions} exceptions` : ''}
                    </div>
                  </div>
                  <StatusBadge status={imp.status}>{imp.status === 'warn' ? 'Warn' : imp.status === 'bad' ? 'Failed' : 'Done'}</StatusBadge>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-p mt-4">
            <h4 style={{ marginBottom: 10 }}>What gets imported</h4>
            {['Projects (upsert)', 'WBS sub-jobs (replace)', 'Contract value, budget', 'Actuals (LAB+FOH+MAT…)', 'Commitments', 'Revenue & progress billing', 'Period lock'].map((s, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="var(--ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 5.5l3 3 5-5"/></svg>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{s}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-3)' }}>
              SAP is the truth. Revenue signs are flipped at import (SAP credits → positive amounts).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
