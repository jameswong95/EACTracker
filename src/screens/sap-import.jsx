import React from 'react'
import { SVGFilters, Anno, Status, Table, Sidebar, Logo } from './shared'

const SapA = () => (
  <div className="wf pov-only pov-fin">
    <SVGFilters />
    <div className="row full" style={{ alignItems: 'stretch' }}>
      <Sidebar active="SAP Import" user="L. Cheng" role="Finance"/>
      <div className="col grow p-5 gap-4">
        <div className="row">
          <div className="title h2">SAP import — May '26</div>
          <span className="pill tiny solid">auto · no manual mapping</span>
          <div className="grow" />
          <span className="t-xs">Finance · L. Cheng</span>
        </div>

        <div className="box dash p-5 col gap-2" style={{ borderColor: 'var(--ink-2)', background: 'var(--paper-2)', textAlign: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: 32 }} className="hand">⤓</div>
          <div className="b">Drop monthly SAP template here</div>
          <div className="t-xs">sap-monthly-template.xlsx · same sheets every month</div>
          <div className="row gap-3 mt-3">
            <span className="pill tiny">sheets: Projects · WBS hierarchy · Contract · Budget · Actuals · Commits</span>
            <span className="pill tiny solid">last: 8 May (Apr period)</span>
          </div>
        </div>

        <div className="box p-3 col gap-2">
          <div className="row">
            <span className="b">What this upload will do</span>
            <div className="grow" />
            <span className="t-xs t-mute">preview · before commit</span>
          </div>
          <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
            <div className="box fill p-3 col gap-1" style={{ flex: '1 1 200px' }}>
              <div className="row gap-2"><span className="dot ok" /><span className="t-xs tt-up">create</span></div>
              <div className="h3 b">3 new projects</div>
              <div className="t-xs t-mute">+ WBS hierarchy, Contract value</div>
            </div>
            <div className="box fill p-3 col gap-1" style={{ flex: '1 1 200px' }}>
              <div className="row gap-2"><span className="dot info" /><span className="t-xs tt-up">update</span></div>
              <div className="h3 b">47 projects</div>
              <div className="t-xs t-mute">Contract value · Budget · WBS delta</div>
            </div>
            <div className="box fill p-3 col gap-1" style={{ flex: '1 1 200px' }}>
              <div className="row gap-2"><span className="dot warn" /><span className="t-xs tt-up">lock</span></div>
              <div className="h3 b">Apr '26 EAC</div>
              <div className="t-xs t-mute">past actuals · 50 projects</div>
            </div>
            <div className="box fill p-3 col gap-1" style={{ flex: '1 1 200px' }}>
              <div className="row gap-2"><span className="dot bad" /><span className="t-xs tt-up">flag</span></div>
              <div className="h3 b">2 exceptions</div>
              <div className="t-xs t-mute">missing PM · unknown WBS</div>
            </div>
          </div>
        </div>

        <div className="box p-3 col gap-2 grow">
          <div className="row">
            <span className="b">Recent imports</span>
            <div className="grow" />
            <span className="t-xs">12 months · one upload per month</span>
          </div>
          <Table
            cols={['Upload date', 'Period locked', 'By', 'Projects · created / updated', 'EAC locked', 'Exceptions', 'Status']}
            colWidths=".9fr .8fr 1fr 1.3fr .9fr .8fr 1fr"
            rows={[
              ['(pending)', "Apr '26", 'L. Cheng', '3 new · 47 upd', '50 prj', '2', <Status status="warn">preview</Status>],
              ['12 Apr 14:03', "Mar '26", 'L. Cheng', '1 new · 49 upd', '50 prj', '0', <Status status="ok">Locked</Status>],
              ['10 Mar 10:48', "Feb '26", 'L. Cheng', '0 new · 50 upd', '50 prj', '0', <Status status="ok">Locked</Status>],
              ['8 Feb 11:22', "Jan '26", 'M. Tan', '2 new · 48 upd', '50 prj', '1', <Status status="ok">Locked</Status>],
            ]}
          />
        </div>
      </div>
    </div>
    <Anno n="1" x={260} y={130} w="180px">Same template every month. No "mapping" — SAP itself is the truth.</Anno>
    <Anno n="2" x={510} y={310} w="200px" side="l">Preview the 4 things the upload will do before clicking commit.</Anno>
    <Anno n="3" x={620} y={530} w="180px" side="l">"Locked" = prior month's EAC is now frozen for that project.</Anno>
  </div>
)

const SapB = () => (
  <div className="wf pov-only pov-fin">
    <SVGFilters />
    <div className="row full" style={{ alignItems: 'stretch' }}>
      <Sidebar active="Period Lock" user="L. Cheng" role="Finance"/>
      <div className="col grow">
      <div className="p-4 col gap-3 grow">
        <div className="row">
          <div className="col">
            <div className="title h2">Period lock · April '26</div>
            <div className="t-xs t-mute">Same template uploaded → confirms past-month actuals against each project's EAC.</div>
          </div>
          <div className="grow" />
          <span className="pill warn">2 variances over $25K</span>
          <div className="btn sm ghost">cancel</div>
          <div className="btn sm primary">lock period</div>
        </div>

        <div className="row gap-3">
          <div className="box p-3 grow"><div className="t-xs tt-up">Projects in scope</div><div className="h3 b mt-2">50</div></div>
          <div className="box p-3 grow"><div className="t-xs tt-up">Apr actuals (SAP)</div><div className="h3 b mt-2">$3.84M</div></div>
          <div className="box p-3 grow"><div className="t-xs tt-up">PM's Apr EAC slice</div><div className="h3 b mt-2">$3.81M</div></div>
          <div className="box p-3 grow fill"><div className="t-xs tt-up">Δ vs forecast</div><div className="h3 title mt-2" style={{ color: 'var(--warn)' }}>+$28K</div><div className="t-xs t-mute">0.7% · within band</div></div>
        </div>

        <div className="row gap-3 grow" style={{ alignItems: 'stretch' }}>
          <div className="box p-3 col gap-2 grow">
            <div className="row">
              <span className="b">Per-project confirmation</span>
              <div className="grow" />
              <div className="row gap-2 t-xs">
                <span className="pill tiny">all 50</span>
                <span className="pill tiny solid">variance &gt; $10K</span>
                <span className="pill warn tiny">to acknowledge</span>
              </div>
            </div>
            <Table
              cols={['Project', 'WBS', 'Apr forecast', 'Apr actual', 'Δ', 'Confirm']}
              colWidths="1.8fr 1.1fr .9fr .9fr .9fr .9fr"
              rows={[
                ['EAC Refresh Programme', 'PR-2025-014', '$150K', '$148K', <span style={{ color: 'var(--ok)' }}>−$2K</span>, <span className="pill ok tiny">auto ✓</span>],
                ['Network Modernisation', 'PR-2026-022', '$220K', <span className="b">$252K</span>, <span style={{ color: 'var(--bad)' }} className="b">+$32K</span>, <span className="pill warn tiny">PM ack</span>],
                ['Quality Lab Build-out', 'PR-2025-031', '$78K', '$74K', <span style={{ color: 'var(--ok)' }}>−$4K</span>, <span className="pill ok tiny">auto ✓</span>],
                ['Wave 3 Cabling', 'PR-2026-018', '$45K', <span className="b">$71K</span>, <span style={{ color: 'var(--bad)' }} className="b">+$26K</span>, <span className="pill warn tiny">PM ack</span>],
                ['DLP — Tower B', 'PR-2025-007', '$12K', '$12K', '—', <span className="pill ok tiny">auto ✓</span>],
                ['…', '', '', '', '', ''],
              ].map((r) => r.map((c, ci) => {
                if (ci >= 2 && ci <= 4) return <span style={{ textAlign: 'right', width: '100%', fontVariantNumeric: 'tabular-nums', display: 'block' }}>{c}</span>
                return c
              }))}
            />
            <div className="hr dash mt-2" />
            <div className="row gap-3 t-xs">
              <span><b>46</b> auto-confirmed (Δ ≤ $10K)</span>
              <span style={{ color: 'var(--warn)' }}><b>4</b> require PM acknowledgement</span>
              <div className="grow" />
              <span className="t-mute">Once locked, PMs cannot edit Apr cells in EAC editor.</span>
            </div>
          </div>

          <div className="box p-3 col gap-3" style={{ flex: '0 0 250px' }}>
            <span className="b">Locking Apr '26 does…</span>
            <div className="col gap-2 t-sm">
              <div className="row gap-2"><span className="dot ok" /><span>Freezes Apr cells in every EAC editor — greyed, non-editable.</span></div>
              <div className="row gap-2"><span className="dot info" /><span>Updates recognised revenue for Apr against the input-method curve.</span></div>
              <div className="row gap-2"><span className="dot warn" /><span>Sends 4 PMs a "please acknowledge" task for variance &gt; $25K.</span></div>
            </div>
            <div className="hr dash" />
            <div className="t-xs tt-up">Override</div>
            <div className="t-sm">Past months can only be re-opened by Finance Director with a reason. All overrides hit the audit log.</div>
            <div className="grow" />
            <div className="t-xs t-mute">Next lock window opens <b>5 Jun</b> for May.</div>
          </div>
        </div>
      </div>
    </div>
    </div>
    <Anno n="1" x={350} y={140} w="220px">Monthly confirmation = the heartbeat. Same template, same shape, every period.</Anno>
    <Anno n="2" x={620} y={350} w="180px" side="l">Auto-confirm when variance is small. PM only acknowledges the noisy ones.</Anno>
  </div>
)

const SapC = () => {
  const SAPCell = ({ children }) => (
    <span style={{ background: 'rgba(58,94,140,.10)', padding: '1px 4px', borderRadius: 3, fontVariantNumeric: 'tabular-nums', width: '100%', textAlign: 'right', display: 'block' }}>{children}</span>
  )

  return (
    <div className="wf pov-only pov-fin">
    <SVGFilters />
    <div className="row full" style={{ alignItems:'stretch' }}>
      <Sidebar active="SAP Import" user="L. Cheng" role="Finance"/>
      <div className="col grow">
      <div className="row p-3 gap-3" style={{ borderBottom: '1.5px solid var(--ink)', background: 'var(--paper-2)' }}>
        <Logo size={12} />
        <span className="t-xs">/ SAP import /</span>
        <span className="b" style={{ fontSize: 13 }}>Auto-created from this upload</span>
        <span className="pill tiny solid">3 projects · 11 sub-jobs · $4.22M contract value</span>
        <div className="grow" />
        <div className="btn sm ghost">expand all</div>
        <div className="btn sm primary">assign PMs &amp; finalise</div>
      </div>

      <div className="p-4 col gap-3 grow" style={{ overflow: 'hidden' }}>
        <div className="row gap-3">
          <div className="box p-3 grow"><div className="t-xs tt-up">From SAP feed</div><div className="t-sm mt-2">Project header, hierarchical WBS, sub-job names, contract value and per-sub-job budget all arrive together.</div></div>
          <div className="box p-3 grow"><div className="t-xs tt-up">WBS notation</div><div className="t-sm mt-2"><span className="mono">123456789/001-1</span> is the main WBS; sub-jobs sit one level below as <span className="mono">…-1-1, -1-2, -1-3</span>.</div></div>
          <div className="box p-3 grow"><div className="t-xs tt-up">Default PM</div><div className="t-sm mt-2">From SAP "Responsible cost-centre" → person lookup. Editable on row.</div></div>
        </div>

        <div className="box p-3 col gap-3 grow" style={{ overflow: 'hidden' }}>
          {[
            {
              main: '123456789/001-1', name: 'Network Modernisation', contract: '$2,400', pm: 'J. Lim',
              wbs: [
                ['123456789/001-1-1', 'Project management', '$  180'],
                ['123456789/001-1-2', 'Main-con', '$1,520'],
                ['123456789/001-1-3', 'Materials & equipment', '$  580'],
                ['123456789/001-1-4', 'Misc', '$  120'],
              ]
            },
            {
              main: '234567890/002-1', name: 'Quality Lab Build-out v2', contract: '$1,200', pm: '(unassigned)',
              wbs: [
                ['234567890/002-1-1', 'Project management', '$ 180'],
                ['234567890/002-1-2', 'Main-con', '$ 720'],
                ['234567890/002-1-3', 'Misc', '$ 300'],
              ]
            },
            {
              main: '345678901/003-1', name: 'Branch Wi-Fi Refresh', contract: '$  620', pm: 'M. Wee',
              wbs: [
                ['345678901/003-1-1', 'Project management', '$  60'],
                ['345678901/003-1-2', 'Main-con', '$ 380'],
                ['345678901/003-1-3', 'Materials', '$ 120'],
                ['345678901/003-1-4', 'Misc', '$  60'],
              ]
            },
          ].map((p, pi) => (
            <div key={pi} className="box p-3 col gap-2" style={{ background: 'var(--paper)' }}>
              <div className="row gap-3">
                <span className="mono b" style={{ fontSize: 13 }}>{p.main}</span>
                <span className="b" style={{ fontSize: 13 }}>{p.name}</span>
                <div className="grow" />
                <span className="t-xs tt-up">contract value</span>
                <SAPCell>{p.contract}K</SAPCell>
                <span className="t-xs tt-up" style={{ marginLeft: 16 }}>PM</span>
                <span className={p.pm.startsWith('(') ? 'pill tiny warn' : 'pill tiny'}>{p.pm}</span>
              </div>
              <div className="hr dash" />
              <Table
                cols={[
                  'Sub-job WBS',
                  'Sub-job name',
                  <span>Budget <span className="t-xs t-mute">·SAP</span></span>,
                  <span>Actual CTD <span className="t-xs t-mute">·calc</span></span>,
                  <span>Committed CTD <span className="t-xs t-mute">·calc</span></span>,
                  <span>ETC <span className="t-xs t-mute">·calc</span></span>,
                  <span>EAC <span className="t-xs t-mute">·calc</span></span>,
                ]}
                colWidths="1.7fr 1.6fr .8fr .9fr 1fr .8fr .8fr"
                rows={p.wbs.map((r) => [
                  <span className="mono" style={{ fontSize: 11 }}>{r[0]}</span>,
                  r[1],
                  <SAPCell>{r[2]}</SAPCell>,
                  <span style={{ textAlign: 'right', width: '100%', display: 'block', color: 'var(--ink-3)', fontStyle: 'italic' }}>—</span>,
                  <span style={{ textAlign: 'right', width: '100%', display: 'block', color: 'var(--ink-3)', fontStyle: 'italic' }}>—</span>,
                  <span style={{ textAlign: 'right', width: '100%', display: 'block', color: 'var(--ink-3)', fontStyle: 'italic' }}>—</span>,
                  <span style={{ textAlign: 'right', width: '100%', display: 'block', color: 'var(--ink-3)', fontStyle: 'italic' }}>—</span>,
                ])}
              />
            </div>
          ))}
          <div className="hr dash" />
          <div className="row gap-3 t-xs">
            <span><SAPCell>blue</SAPCell> = from SAP this upload</span>
            <span><span style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>— italics</span> = calculated as cost lands month-by-month</span>
            <div className="grow" />
            <span className="t-mute">New projects start with zero actuals — fills in over upcoming periods.</span>
          </div>
        </div>
      </div>
    </div>
    </div>
    <Anno n="1" x={320} y={160} w="200px">Contract value + per-sub-job Budget = the only 2 cost columns SAP gives us. Everything else fills in monthly.</Anno>
    <Anno n="2" x={720} y={400} w="180px" side="l">Sub-jobs named by the PM (e.g. PM, Main-con, Misc) — variable per project.</Anno>
  </div>
  )
}

export { SapA, SapB, SapC }
