import React from 'react';
import { SVGFilters, Anno, Status, Table, Sidebar } from './Shared.jsx';

export const PMDashboard = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters />
    <div className="row full" style={{ alignItems: 'stretch' }}>
      <Sidebar active="Dashboard" user="Sara" role="Project Manager" />
      <div className="col grow">
        <div className="row p-3 gap-3" style={{ borderBottom: '1.5px solid var(--ink)' }}>
          <span className="t-xs">Dashboard</span>
          <div className="grow" />
          <span className="t-xs t-mute">21 May 2026 · Wed</span>
        </div>
        <div className="p-4 col gap-3 grow">
          <div className="row gap-3">
            <div className="box p-3 grow">
              <div className="title h2">Good morning, Sara</div>
              <div className="t-sm t-mute mt-2">You manage 3 projects. May closes in 14 days.</div>
            </div>
            <div className="box p-3" style={{ flex: '0 0 130px' }}>
              <div className="t-xs tt-up">My projects</div>
              <div className="h1 title mt-2">3</div>
            </div>
            <div className="box p-3" style={{ flex: '0 0 130px' }}>
              <div className="t-xs tt-up">Portfolio EAC</div>
              <div className="h3 title mt-2">$2.1M</div>
            </div>
            <div className="box p-3 fill" style={{ flex: '0 0 150px' }}>
              <div className="t-xs tt-up">Open tasks</div>
              <div className="h1 title mt-2" style={{ color: 'var(--warn)' }}>4</div>
            </div>
          </div>
          <div className="row gap-3 grow">
            <div className="box p-3 col gap-2" style={{ flex: '1.4' }}>
              <div className="row">
                <span className="b">Tasks · this week</span>
                <div className="grow" />
                <span className="t-xs">sort: due ▾</span>
              </div>
              <div className="hr thin" />
              {[
                { due: 'Today', tone: 'bad', what: 'Acknowledge Apr variance · Network Mod. (+$32K)', cta: 'open period lock' },
                { due: '3 days', tone: 'warn', what: 'May recognition + monthly update due · EAC Refresh', cta: 'open recognition' },
                { due: '7 days', tone: 'warn', what: 'Confirm wave 2 headcount · Wave 3 Cabling', cta: 'open resources' },
                { due: '12 days', tone: 'info', what: 'Review re-baseline draft from director', cta: 'open thread' },
              ].map((t, i) => (
                <div key={i} className="row gap-3" style={{ padding: '6px 4px', borderBottom: '1px solid var(--paper-3)' }}>
                  <span className={`dot ${t.tone}`} />
                  <div className="col" style={{ gap: 0, flex: 1 }}>
                    <span className="t-sm b">{t.what}</span>
                    <span className="t-xs t-mute">due {t.due}</span>
                  </div>
                  <div className="btn sm ghost">{t.cta} →</div>
                </div>
              ))}
            </div>
            <div className="box p-3 col gap-2 grow">
              <div className="row">
                <span className="b">My projects</span>
                <div className="grow" />
                <span className="t-xs">click to open</span>
              </div>
              <div className="hr thin" />
              {[
                { name: 'EAC Refresh Programme', wbs: '/001-1', status: 'warn', eac: '$1.24M', var: '+3.3%', last: '12 May' },
                { name: 'Wave 3 Cabling', wbs: '/008-1', status: 'ok', eac: '$340K', var: '+0.4%', last: '11 May' },
                { name: 'DLP — Tower B', wbs: '/014-1', status: 'ok', eac: '$120K', var: 'on plan', last: '6 May' },
              ].map((p, i) => (
                <div key={i} className="box p-3 col gap-1" style={{ borderColor: 'var(--ink-3)' }}>
                  <div className="row">
                    <span className="b" style={{ fontSize: 13 }}>{p.name}</span>
                    <div className="grow" />
                    <Status status={p.status} />
                  </div>
                  <div className="row t-xs gap-3">
                    <span className="mono t-mute">{p.wbs}</span>
                    <span>EAC <b>{p.eac}</b></span>
                    <span style={{ color: p.var.startsWith('+') ? 'var(--warn)' : 'var(--ink-3)' }}>{p.var}</span>
                    <div className="grow" />
                    <span className="t-mute">updated {p.last}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="row gap-3">
            <div className="box p-3 grow col gap-1">
              <div className="t-xs tt-up">Quick link</div>
              <div className="b">Draft May update</div>
              <div className="t-xs t-mute">AI-assisted · 5 sub-jobs</div>
            </div>
            <div className="box p-3 grow col gap-1">
              <div className="t-xs tt-up">Quick link</div>
              <div className="b">Resource plan · all 3</div>
              <div className="t-xs t-mute">June kick-off coming</div>
            </div>
            <div className="box p-3 grow col gap-1">
              <div className="t-xs tt-up">SAP last sync</div>
              <div className="b">8 May · 142 lines</div>
              <div className="t-xs t-mute">Apr period · locked</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={420} y={250} w="200px">Tasks ordered by urgency, each links straight to the screen needed to clear it.</Anno>
    <Anno n="2" x={720} y={310} w="180px" side="l">Project cards = primary nav into a single project.</Anno>
  </div>
);

export const PMUpdatesList = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters />
    <div className="row full" style={{ alignItems: 'stretch' }}>
      <Sidebar active="Updates" user="Sara" role="Project Manager" />
      <div className="col grow">
        <div className="row p-3 gap-3" style={{ borderBottom: '1.5px solid var(--ink)' }}>
          <span className="t-xs">Updates /</span>
          <span className="b" style={{ fontSize: 13 }}>My monthly updates</span>
          <div className="grow" />
          <div className="btn sm primary">+ draft May update</div>
        </div>
        <div className="p-4 col gap-3 grow">
          <div className="row gap-3">
            <div className="box p-3 grow"><div className="t-xs tt-up">This month</div><div className="h3 b mt-2">May '26</div><div className="t-xs t-mute">due in 14 days</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Submitted YTD</div><div className="h3 b mt-2">4</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Avg PD response</div><div className="h3 b mt-2">2.3 days</div></div>
          </div>
          <div className="box p-3 col gap-2 grow">
            <div className="row">
              <span className="b">Submitted updates</span>
              <div className="grow" />
              <div className="row gap-2 t-xs">
                <span className="pill tiny solid">all</span>
                <span className="pill tiny">approved</span>
                <span className="pill tiny warn">flagged</span>
              </div>
            </div>
            <Table
              cols={['Period', 'Project', 'Submitted', 'PD review', 'EAC drift', 'Status']}
              colWidths=".7fr 2fr 1fr 1fr .9fr 1.1fr"
              rows={[
                ["May '26", 'EAC Refresh Programme', '— draft', '—', <span key="d1" style={{ color: 'var(--warn)' }}>+3.3%</span>, <span key="s1" className="pill tiny">draft</span>],
                ["Apr '26", 'EAC Refresh Programme', '5 May', 'K. Rajah · 7 May', <span key="d2" style={{ color: 'var(--warn)' }}>+2.8%</span>, <Status key="s2" status="ok">approved</Status>],
                ["Apr '26", 'Wave 3 Cabling', '5 May', 'K. Rajah · 6 May', 'on plan', <Status key="s3" status="ok">approved</Status>],
                ["Apr '26", 'DLP — Tower B', '4 May', 'K. Rajah · 5 May', 'on plan', <Status key="s4" status="ok">approved</Status>],
                ["Mar '26", 'EAC Refresh Programme', '4 Apr', 'K. Rajah · 8 Apr', <span key="d5" style={{ color: 'var(--warn)' }}>+1.8%</span>, <Status key="s5" status="warn">queried · resolved</Status>],
              ]}
            />
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={420} y={210} w="200px">Updates list is the audit trail PD reviewers also read. Same shape every month.</Anno>
  </div>
);

export const PDApprovals = () => (
  <div className="wf pov-only pov-pd">
    <SVGFilters />
    <div className="row full" style={{ alignItems: 'stretch' }}>
      <Sidebar active="Approvals" user="K. Rajah" role="Project Director" />
      <div className="col grow">
        <div className="row p-3 gap-3" style={{ borderBottom: '1.5px solid var(--ink)' }}>
          <span className="t-xs">Approvals /</span>
          <span className="b" style={{ fontSize: 13 }}>Queue</span>
          <span className="pill tiny warn">5 awaiting</span>
          <div className="grow" />
          <span className="t-xs t-mute">SLA: respond within 3 days</span>
        </div>
        <div className="row grow" style={{ alignItems: 'stretch' }}>
          <div className="col gap-2 p-3" style={{ flex: '0 0 280px', borderRight: '1.5px solid var(--ink-3)', background: 'var(--paper-2)' }}>
            <div className="t-xs tt-up">In queue</div>
            {[
              { type: 'Re-baseline', proj: 'EAC Refresh', pm: 'Sara Tan', age: '1 day', tone: 'warn', active: true },
              { type: 'Variance ack', proj: 'Network Mod.', pm: 'J. Lim', age: '1 day', tone: 'bad' },
              { type: 'Re-baseline', proj: 'Quality Lab v2', pm: 'M. Wee', age: '2 days', tone: 'warn' },
              { type: 'New project sign-off', proj: 'Branch Wi-Fi', pm: 'M. Wee', age: '2 days', tone: 'info' },
              { type: 'Variance ack', proj: 'Wave 3 Cabling', pm: 'K. Yeo', age: '3 days', tone: 'warn' },
            ].map((q, i) => (
              <div key={i} className="box p-3 col gap-1" style={{ background: q.active ? 'var(--paper)' : 'transparent', borderColor: q.active ? 'var(--ink)' : 'var(--ink-3)' }}>
                <div className="row">
                  <span className={`pill tiny ${q.tone}`}>{q.type}</span>
                  <div className="grow" />
                  <span className="t-xs t-mute">{q.age}</span>
                </div>
                <div className="b" style={{ fontSize: 12 }}>{q.proj}</div>
                <div className="t-xs t-mute">PM: {q.pm}</div>
              </div>
            ))}
          </div>
          <div className="col grow p-4 gap-3">
            <div className="row">
              <span className="pill warn">Re-baseline · EAC Refresh Programme</span>
              <div className="grow" />
              <span className="t-xs t-mute">requested by Sara Tan · 20 May</span>
            </div>
            <div className="title h3">PM is asking to re-baseline the recognition plan</div>
            <div className="row gap-3">
              <div className="box p-3 col gap-1 grow">
                <div className="t-xs tt-up">Original plan</div>
                <div className="h3 b">$1.20M over 3 yrs</div>
                <div className="t-xs t-mute">approved 12 Mar '26</div>
              </div>
              <div className="box p-3 col gap-1 grow">
                <div className="t-xs tt-up">Proposed</div>
                <div className="h3 b" style={{ color: 'var(--warn)' }}>$1.24M (+3.3%)</div>
                <div className="t-xs t-mute">2 sub-jobs uplifted</div>
              </div>
              <div className="box p-3 col gap-1 grow fill">
                <div className="t-xs tt-up">Cumulative recog. impact</div>
                <div className="h3 title">+$28K Y1 · +$12K Y2</div>
              </div>
            </div>
            <div className="box p-3 col gap-2">
              <span className="b">Sara's note</span>
              <div className="t-sm" style={{ fontStyle: 'italic', color: 'var(--ink-2)' }}>
                "Network swap completed early but vendor lead-time on quality test rig pushed hardware into May. EAC drift now $40K — recommend baseline reset so future recognition curve stays achievable."
              </div>
              <div className="hr dash" />
              <div className="t-xs tt-up">Evidence</div>
              <div className="row gap-2 t-xs">
                <span className="pill tiny">EAC v3.xlsx</span>
                <span className="pill tiny">vendor email · 18 May</span>
                <span className="pill tiny">May draft update</span>
              </div>
            </div>
            <div className="grow" />
            <div className="row gap-2">
              <div className="btn ghost">request changes</div>
              <div className="grow" />
              <div className="btn ghost">reject</div>
              <div className="btn primary">approve re-baseline</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={130} y={290} w="170px">Queue = master list. Click any item to expand on the right.</Anno>
    <Anno n="2" x={760} y={520} w="180px" side="l">Approve / reject / request-changes — all decisions hit the audit log automatically.</Anno>
  </div>
);

export const PDUpdatesFeed = () => (
  <div className="wf pov-only pov-pd">
    <SVGFilters />
    <div className="row full" style={{ alignItems: 'stretch' }}>
      <Sidebar active="Updates" user="K. Rajah" role="Project Director" />
      <div className="col grow">
        <div className="row p-3 gap-3" style={{ borderBottom: '1.5px solid var(--ink)' }}>
          <span className="t-xs">Updates /</span>
          <span className="b" style={{ fontSize: 13 }}>Recent monthly updates · team</span>
          <div className="grow" />
          <div className="row gap-2 t-xs">
            <span className="pill tiny solid">8 PMs</span>
            <span className="pill tiny">period: May '26 ▾</span>
          </div>
        </div>
        <div className="p-4 row gap-3 grow" style={{ alignItems: 'stretch' }}>
          <div className="box p-3 col gap-2" style={{ flex: '1.4' }}>
            <div className="row">
              <span className="b">Feed</span>
              <div className="grow" />
              <span className="t-xs">7 of 8 submitted</span>
            </div>
            <div className="hr thin" />
            {[
              { pm: 'Sara Tan', proj: 'EAC Refresh Programme', when: '20 May', drift: '+3.3%', tone: 'warn' },
              { pm: 'J. Lim', proj: 'Network Modernisation', when: '19 May', drift: '+6.8%', tone: 'bad' },
              { pm: 'M. Wee', proj: 'Quality Lab Build-out', when: '19 May', drift: '+1.9%', tone: 'warn' },
              { pm: 'M. Wee', proj: 'Branch Wi-Fi Refresh', when: '18 May', drift: 'on plan', tone: 'ok' },
              { pm: 'K. Yeo', proj: 'Wave 3 Cabling', when: '18 May', drift: '+0.4%', tone: 'ok' },
              { pm: 'R. Goh', proj: 'DLP — Tower B', when: '17 May', drift: 'on plan', tone: 'ok' },
              { pm: 'T. Ong', proj: 'Switch Fabric Renewal', when: '(pending)', drift: '—', tone: 'mute' },
            ].map((u, i) => (
              <div key={i} className="row gap-3" style={{ padding: '6px 4px', borderBottom: '1px solid var(--paper-3)' }}>
                <span className={`dot ${u.tone}`} />
                <div className="col" style={{ gap: 0, flex: 1 }}>
                  <span className="t-sm b">{u.proj}</span>
                  <span className="t-xs t-mute">{u.pm} · {u.when}</span>
                </div>
                <span className="t-xs" style={{ color: u.tone === 'bad' ? 'var(--bad)' : u.tone === 'warn' ? 'var(--warn)' : 'var(--ink-3)' }}>{u.drift}</span>
                <div className="btn sm ghost">read →</div>
              </div>
            ))}
          </div>
          <div className="box p-3 col gap-2 grow">
            <div className="row">
              <span className="b">Preview · Sara Tan · EAC Refresh · May '26</span>
              <div className="grow" />
              <div className="row gap-2">
                <div className="btn sm ghost">comment</div>
                <div className="btn sm primary">acknowledge</div>
              </div>
            </div>
            <div className="hr dash" />
            <div className="col gap-2 t-sm">
              <div><div className="t-xs tt-up">What changed</div><div>Wave 1 closed on plan. Quality test rig at 2 of 5 units delivered; vendor confirms remaining 3 by 20 May.</div></div>
              <div><div className="t-xs tt-up">Schedule</div><div>On plan overall. Wave 2 kickoff slips one week pending headcount confirmation.</div></div>
              <div><div className="t-xs tt-up">Cost / EAC</div><div>EAC $1.24M, +3.3% vs $1.20M budget. Mar server slippage absorbed $8K expedite. Recognition tracking $77K ahead — guardrail flagged.</div></div>
              <div><div className="t-xs tt-up">Risks</div><div>Vendor lead-time remains tight; dual-source contract in progress.</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={340} y={290} w="170px">Same shape, every PM, every month. PD scans 8 of these in 5 min.</Anno>
    <Anno n="2" x={760} y={290} w="180px" side="l">Click any item → preview on the right. Acknowledge / comment without leaving the page.</Anno>
  </div>
);
