import React from 'react';
import { SVGFilters, Arrow } from './Shared.jsx';

const MiniHeader = ({ title, sub }) => (
  <div className="col" style={{ gap: 2 }}>
    <div className="b" style={{ fontSize: 11, lineHeight: 1.1 }}>{title}</div>
    {sub && <div className="t-xs" style={{ fontSize: 9, color: 'var(--ink-3)' }}>{sub}</div>}
    <div className="hr thin" style={{ margin: '2px 0' }} />
  </div>
);

const MiniRow = ({ children, hi }) => (
  <div className="row gap-2" style={{
    fontSize: 9, padding: '2px 4px', borderRadius: 3,
    background: hi === 'warn' ? '#fdf5e3' : hi === 'bad' ? '#fbe9e3' : hi === 'ok' ? '#e7f0eb' : 'transparent',
    border: hi === 'hi' ? '1.5px dashed var(--info)' : 'none',
  }}>{children}</div>
);

const MiniBtn = ({ primary, children }) => (
  <span style={{
    display: 'inline-block',
    padding: '1px 6px',
    fontSize: 8,
    borderRadius: 4,
    border: '1px solid var(--ink)',
    background: primary ? 'var(--ink)' : 'transparent',
    color: primary ? 'var(--paper)' : 'var(--ink)',
    fontFamily: 'Kalam',
  }}>{children}</span>
);

const MiniFrame = ({ n, cap, children, w }) => (
  <div className="frame" style={{ flex: `1 1 ${w || 140}px`, minWidth: w || 140, fontFamily: 'Kalam' }}>
    <div className="frame-cap">{cap}</div>
    <div className="frame-num">{n}</div>
    {children}
  </div>
);

export const FlowPmMonthly = () => (
  <div className="wf flow">
    <SVGFilters />
    <div className="p-5 col gap-4 full">
      <div className="row">
        <div className="title h2">Flow · PM monthly update — &lt; 10 min</div>
        <div className="grow" />
        <span className="pill tiny">persona: PM</span>
        <span className="pill tiny">trigger: first Mon of month</span>
        <span className="pill tiny solid">success: confirmed update</span>
      </div>

      <div className="row gap-3" style={{ alignItems: 'stretch', padding: '24px 0 14px' }}>
        <MiniFrame n="1" cap="Open dashboard">
          <MiniHeader title="Sara · Dashboard" sub="May '26" />
          <MiniRow><span className="dot ok" />EAC Refresh · 5 May</MiniRow>
          <MiniRow hi="warn"><span className="dot warn" />Network Mod · UPDATE DUE</MiniRow>
          <MiniRow><span className="dot ok" />Asset Refresh · 9 May</MiniRow>
          <div className="grow" />
          <div className="row gap-2"><MiniBtn>filter</MiniBtn><MiniBtn primary>+ update</MiniBtn></div>
        </MiniFrame>

        <Arrow length={40} label="click '+ update'" />

        <MiniFrame n="2" cap="Form · facts only">
          <MiniHeader title="Update — Network Mod" sub="step 1 · facts" />
          <MiniRow>Phase: <span className="b">Execution ▾</span></MiniRow>
          <MiniRow>Milestone: <span className="b">Wave 2 cutover ▾</span></MiniRow>
          <MiniRow>Status: <MiniBtn primary>At Risk</MiniBtn> <MiniBtn>OK</MiniBtn></MiniRow>
          <MiniRow>% complete: <span className="b">62</span></MiniRow>
          <MiniRow>Issue: <span className="b">Vendor delay ▾</span></MiniRow>
          <div className="t-xs" style={{ fontSize: 8, color: 'var(--ink-3)' }}>+ optional context — 500ch</div>
          <div className="grow" />
          <MiniBtn primary>generate ✨</MiniBtn>
        </MiniFrame>

        <Arrow length={40} label="click generate" />

        <MiniFrame n="3" cap="AI streams output">
          <MiniHeader title="AI draft" sub="streaming…" />
          <div style={{ border: '1.5px dashed var(--info)', borderRadius: 4, padding: 5, fontSize: 9, lineHeight: 1.3, background: 'rgba(58,94,140,.05)' }}>
            "Wave 2 cutover is at risk due to a vendor lead-time slip on switch hardware. 2 of 5 units have arrived; remainder expected by 20 May. Project is 62% complete; revised milestone date 25 May.<span style={{ background: '#1a1815', color: '#fdfcf8', padding: '0 2px', marginLeft: 2 }}>▍</span>"
          </div>
          <div className="row gap-2 mt-2">
            <MiniBtn>↻ regenerate</MiniBtn>
            <MiniBtn>edit</MiniBtn>
          </div>
          <div className="t-xs" style={{ fontSize: 8, color: 'var(--ink-3)' }}>regenerations: 1 / 3 tracked</div>
        </MiniFrame>

        <Arrow length={40} label="confirm" />

        <MiniFrame n="4" cap="Review &amp; confirm">
          <MiniHeader title="Confirm update" sub="May '26 · official record" />
          <div style={{ fontSize: 9, lineHeight: 1.3, padding: 4, background: 'var(--paper-2)', borderRadius: 3 }}>
            "Wave 2 cutover is at risk…  expected by 20 May. Revised milestone 25 May."
          </div>
          <MiniRow>Status: <span className="pill warn tiny">At Risk</span></MiniRow>
          <MiniRow>Locked once confirmed</MiniRow>
          <div className="grow" />
          <div className="row gap-2"><MiniBtn>back</MiniBtn><MiniBtn primary>confirm ✓</MiniBtn></div>
        </MiniFrame>

        <Arrow length={40} label="✓ saved" />

        <MiniFrame n="5" cap="Done · 8m elapsed">
          <MiniHeader title="Dashboard updated" sub="" />
          <MiniRow hi="ok"><span className="dot ok" />EAC Refresh · 5 May</MiniRow>
          <MiniRow hi="ok"><span className="dot warn" />Network Mod · just now</MiniRow>
          <MiniRow><span className="dot ok" />Asset Refresh · 9 May</MiniRow>
          <div className="grow" />
          <div className="t-xs" style={{ fontSize: 9, color: 'var(--ink-3)' }}>monthly compliance: 100%</div>
          <div className="t-xs" style={{ fontSize: 9, color: 'var(--ok)' }}>✓ visible to PD &amp; Dept Leader</div>
        </MiniFrame>
      </div>

      <div className="row gap-3 mt-2">
        <div className="note" style={{ position: 'static', transform: 'none', maxWidth: 240 }}>
          PM only inputs <b>dropdowns + 500ch optional context</b>.
          AI does all writing.
        </div>
        <div className="note r" style={{ position: 'static', transform: 'none', maxWidth: 240 }}>
          Streaming output (word-by-word) signals quality + lets PM read while it's typing.
        </div>
        <div className="note" style={{ position: 'static', transform: 'none', maxWidth: 240 }}>
          Confirm locks the update. Regenerations are tracked but not punished.
        </div>
        <div className="grow" />
        <div className="t-xs" style={{ alignSelf: 'flex-end' }}>target: &lt; 10 min · success metric §9</div>
      </div>
    </div>
  </div>
);

export const FlowFinanceImport = () => (
  <div className="wf flow">
    <SVGFilters />
    <div className="p-5 col gap-4 full">
      <div className="row">
        <div className="title h2">Flow · Finance SAP import — monthly batch</div>
        <div className="grow" />
        <span className="pill tiny">persona: Finance</span>
        <span className="pill tiny">trigger: SAP close, end of month</span>
        <span className="pill tiny solid">success: 0 unmapped &amp; batch locked</span>
      </div>

      <div className="row gap-3" style={{ alignItems: 'stretch', padding: '24px 0 14px' }}>
        <MiniFrame n="1" cap="Export from SAP">
          <MiniHeader title="SAP system" sub="(out of app)" />
          <div style={{ fontSize: 24, textAlign: 'center', padding: 6 }}>📊</div>
          <div className="t-xs" style={{ fontSize: 9 }}>Cost report → Excel</div>
          <MiniRow>142 rows · 3 sheets</MiniRow>
          <div className="grow" />
          <div className="t-xs" style={{ fontSize: 9, color: 'var(--ink-3)' }}>Phase 2: real-time API</div>
        </MiniFrame>

        <Arrow length={40} label="drop file" />

        <MiniFrame n="2" cap="Upload">
          <MiniHeader title="SAP import" sub="Finance only" />
          <div className="box dash p-3" style={{ textAlign: 'center', fontSize: 9, borderColor: 'var(--ink-3)' }}>
            <div style={{ fontSize: 18 }}>⤓</div>
            <div>drop here</div>
            <div className="t-xs" style={{ fontSize: 8 }}>or browse</div>
          </div>
          <MiniRow>sap_apr26.xlsx · 142 KB</MiniRow>
          <div className="grow" />
          <MiniBtn primary>parse →</MiniBtn>
        </MiniFrame>

        <Arrow length={40} label="auto-parse" />

        <MiniFrame n="3" cap="Auto-map by WBS">
          <MiniHeader title="Parse complete" sub="138 / 142 mapped" />
          <div className="row gap-1 t-xs" style={{ fontSize: 9 }}>
            <span className="pill ok tiny" style={{ fontSize: 8 }}>138 ✓</span>
            <span className="pill warn tiny" style={{ fontSize: 8 }}>4 ⚠</span>
            <span className="pill tiny" style={{ fontSize: 8, color: 'var(--ink-3)', borderColor: 'var(--ink-3)' }}>3 dup</span>
          </div>
          <div className="status-bar mt-2"><i style={{ width: '97%' }} /></div>
          <div className="grow" />
          <div className="t-xs" style={{ fontSize: 9 }}>WBS lookup matched on saved memory.</div>
        </MiniFrame>

        <Arrow length={40} label="review queue" />

        <MiniFrame n="4" cap="Resolve unmapped">
          <MiniHeader title="4 to map" sub="suggestions ↓" />
          <MiniRow hi="warn">SE-NTW-7700 · $8.4K</MiniRow>
          <div style={{ border: '1.5px dashed var(--info)', borderRadius: 3, padding: 3, fontSize: 9, background: 'rgba(58,94,140,.05)' }}>
            → Network Modernisation <span className="b">97%</span><br />
            → Wireless Refresh 74%<br />
            <span style={{ color: 'var(--ink-3)' }}>☐ remember</span>
          </div>
          <div className="grow" />
          <div className="row gap-1"><MiniBtn>skip</MiniBtn><MiniBtn primary>confirm</MiniBtn></div>
        </MiniFrame>

        <Arrow length={40} label="finalise" />

        <MiniFrame n="5" cap="Locked &amp; logged">
          <MiniHeader title="Apr '26 imported" sub="142 / 142 ✓" />
          <MiniRow hi="ok">✓ EAC actuals refreshed for 7 projects</MiniRow>
          <MiniRow>WBS table: +1 saved mapping</MiniRow>
          <div className="hr thin" />
          <div className="t-xs" style={{ fontSize: 9, color: 'var(--ink-3)' }}>logged: L.Cheng · 8 May 09:12</div>
          <div className="grow" />
          <div className="t-xs" style={{ fontSize: 9, color: 'var(--ok)' }}>PMs see updated actuals immediately</div>
        </MiniFrame>
      </div>

      <div className="row gap-3 mt-2">
        <div className="note" style={{ position: 'static', transform: 'none', maxWidth: 240 }}>
          Finance never sees project financial data — only the import surface.
        </div>
        <div className="note r" style={{ position: 'static', transform: 'none', maxWidth: 240 }}>
          Mapping memory: every confirmed mapping is reused — queue shrinks over time.
        </div>
        <div className="note" style={{ position: 'static', transform: 'none', maxWidth: 240 }}>
          Duplicate detection: same WBS + period + amount in same batch is silently skipped.
        </div>
        <div className="grow" />
      </div>
    </div>
  </div>
);

export const FlowPdReview = () => (
  <div className="wf flow">
    <SVGFilters />
    <div className="p-5 col gap-4 full">
      <div className="row">
        <div className="title h2">Flow · PD review — spot risk, drill, flag</div>
        <div className="grow" />
        <span className="pill tiny">persona: Project Director</span>
        <span className="pill tiny">trigger: weekly review</span>
        <span className="pill tiny solid">success: PM notified &amp; mitigation logged</span>
      </div>

      <div className="row gap-3" style={{ alignItems: 'stretch', padding: '24px 0 14px' }}>
        <MiniFrame n="1" cap="Portfolio · team">
          <MiniHeader title="K. Rajah · Team view" sub="8 projects" />
          <MiniRow hi="bad"><span className="dot bad" />Site Comm Ph2 · +7.7%</MiniRow>
          <MiniRow hi="warn"><span className="dot warn" />Network Mod · +2.2%</MiniRow>
          <MiniRow><span className="dot ok" />EAC Refresh · +1.2%</MiniRow>
          <MiniRow><span className="dot ok" />Asset Refresh · -0.5%</MiniRow>
          <div className="grow" />
          <div className="t-xs" style={{ fontSize: 9, color: 'var(--bad)' }}>1 delayed · 2 at risk</div>
        </MiniFrame>

        <Arrow length={40} label="click red row" />

        <MiniFrame n="2" cap="Open project">
          <MiniHeader title="Site Comm Ph2" sub="L. Wong · WBS 044" />
          <div className="row gap-2 t-xs"><span className="b" style={{ fontSize: 9 }}>EAC $2.1M</span><span style={{ fontSize: 9 }}>budget $1.95M</span><span style={{ fontSize: 9, color: 'var(--bad)' }}>+7.7%</span></div>
          <div className="status-bar mt-2"><i style={{ width: '108%', background: 'var(--bad)' }} /></div>
          <MiniRow>last update: 28 Apr · <span style={{ color: 'var(--bad)' }}>overdue</span></MiniRow>
          <div className="grow" />
          <div className="row gap-1"><MiniBtn>history</MiniBtn><MiniBtn primary>flag PM</MiniBtn></div>
        </MiniFrame>

        <Arrow length={40} label="see history" />

        <MiniFrame n="3" cap="Read trend">
          <MiniHeader title="Update history" sub="last 4 months" />
          <div className="t-xs" style={{ fontSize: 9 }}>
            <div><span className="b">Apr</span> · "vendor expedite 8K…"</div>
            <div><span className="b">Mar</span> · "2 servers delayed…"</div>
            <div><span className="b">Feb</span> · "scope addition…"</div>
            <div><span className="b">Jan</span> · "kickoff complete"</div>
          </div>
          <div className="hr dash" />
          <div className="t-xs" style={{ fontSize: 9, color: 'var(--bad)' }}>⚠ pattern: 3 amber months in a row</div>
        </MiniFrame>

        <Arrow length={40} label="flag PM" />

        <MiniFrame n="4" cap="Send flag + Q">
          <MiniHeader title="Comment for L. Wong" sub="visible on project" />
          <div style={{ fontSize: 9, padding: 4, background: 'var(--paper-2)', borderRadius: 3 }}>
            "EAC trending +7.7%. Can you walk me through the mitigation plan in our 1:1 Thu?"
          </div>
          <MiniRow>☐ require response by: <span className="b">22 May</span></MiniRow>
          <div className="grow" />
          <div className="row gap-1"><MiniBtn>cancel</MiniBtn><MiniBtn primary>send</MiniBtn></div>
        </MiniFrame>

        <Arrow length={40} label="PM gets ping" />

        <MiniFrame n="5" cap="Compliance view">
          <MiniHeader title="Team compliance" sub="May '26" />
          <MiniRow>L. Wong · <span className="pill warn tiny">flagged · 0d</span></MiniRow>
          <MiniRow>S. Tan · ✓ updated</MiniRow>
          <MiniRow>A. Kumar · ✓ updated</MiniRow>
          <MiniRow>R. Patel · ✓ updated</MiniRow>
          <div className="grow" />
          <div className="t-xs" style={{ fontSize: 9, color: 'var(--ok)' }}>92% on-time rate (target 90%)</div>
        </MiniFrame>
      </div>

      <div className="row gap-3 mt-2">
        <div className="note" style={{ position: 'static', transform: 'none', maxWidth: 240 }}>
          PD scans by exception — red &amp; amber rows surface first.
        </div>
        <div className="note r" style={{ position: 'static', transform: 'none', maxWidth: 240 }}>
          Trend annotations ("3 amber months") are <b>Phase 2 intelligence</b> hints.
        </div>
        <div className="note" style={{ position: 'static', transform: 'none', maxWidth: 240 }}>
          Flagging is a comment — not an enforcement action. Coaching, not policing.
        </div>
        <div className="grow" />
      </div>
    </div>
  </div>
);
