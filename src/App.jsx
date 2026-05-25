import React from 'react'
import { DesignCanvas, DCSection, DCArtboard } from './canvas/DesignCanvas'
import { useTweaks, TweaksPanel, TweakSection, TweakToggle, TweakRadio } from './tweaks/TweaksPanel'
import { SVGFilters, Status, Logo, Arrow } from './screens/shared'
import { LoginA, LoginB, ShellSidebar } from './screens/login-shell'
import { PMDashboard, PMUpdatesList, PDApprovals, PDUpdatesFeed } from './screens/dashboards'
import { PortfolioA, PortfolioB, PortfolioC } from './screens/portfolio'
import { ProjectA, ProjectB, ProjectC } from './screens/project'
import { EacA, EacB, EacC } from './screens/eac-editor'
import { ResourceA, ResourceB, ResourceC } from './screens/resource'
import { SapA, SapB, SapC } from './screens/sap-import'
import { RevRecConcept, RevRecPlan, RevRecMonthly, RevRecRisk } from './screens/revrec'
import { StdRates, StdSubjobs, InvDeploy } from './screens/standards'
import { AiUpdate, WbsImport } from './screens/assists'
import { FlowPmMonthly, FlowFinanceImport, FlowPdReview } from './screens/flows'

const TWEAK_DEFAULTS = { annotations: true, pov: 'All' }

const W = 820, H = 520
const FW = 1280, FH = 540

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS)

  React.useEffect(() => {
    document.body.classList.toggle('no-anno', !t.annotations)
    document.body.classList.remove('pov-pm', 'pov-pd', 'pov-fin')
    if (t.pov === 'PM') document.body.classList.add('pov-pm')
    if (t.pov === 'PD') document.body.classList.add('pov-pd')
    if (t.pov === 'Fin') document.body.classList.add('pov-fin')
  }, [t])

  return (
    <>
      <DesignCanvas>
        <DCSection id="intro" title="PFMS Wireframes — Phase 1"
          subtitle="6 screens · 3 variations each · 3 end-to-end flows · sketched, b&w with hints of color">
          <DCArtboard id="intro-note" label="brief" width={520} height={360}>
            <div className="wf p-5 col gap-3">
              <SVGFilters/>
              <Logo size={20}/>
              <div className="title h1 mt-2">Project Financial Management System</div>
              <div className="t-sm">Phase 1 wireframes — based on PRD v1.1 (18 May 2026) + boss's walkthrough on input-method recognition.</div>
              <div className="hr dash"/>
              <div className="t-sm">
                <b>New since last review</b>
                <ul style={{margin:'6px 0 0 18px',padding:0,lineHeight:1.5}}>
                  <li>Revenue recognition — output→input shift · plan · monthly guardrail · PD risk view</li>
                  <li>Cost standards — blended rates · hierarchical WBS &amp; project sub-jobs · inventorise vs deploy</li>
                  <li>PM assists — local-LLM update drafter · Excel/WBS importer</li>
                </ul>
              </div>
              <div className="t-sm">
                <b>Variation axes</b>
                <ul style={{margin:'6px 0 0 18px',padding:0,lineHeight:1.5}}>
                  <li>A — sidebar · number-forward · table-heavy</li>
                  <li>B — sidebar · chart-forward · cards &amp; sparklines</li>
                  <li>C — sidebar · alt layout (master-detail, dial, grouping)</li>
                </ul>
              </div>
              <div className="grow"/>
              <div className="t-xs t-mute">low-fi · structure &amp; flow over polish · iterate freely</div>
            </div>
          </DCArtboard>

          <DCArtboard id="legend" label="legend" width={320} height={360}>
            <div className="wf p-5 col gap-3">
              <SVGFilters/>
              <div className="title h2">Visual vocabulary</div>
              <div className="row gap-3"><Status status="ok"/><span className="t-sm">on track</span></div>
              <div className="row gap-3"><Status status="warn"/><span className="t-sm">at risk · +0–5%</span></div>
              <div className="row gap-3"><Status status="bad"/><span className="t-sm">delayed · &gt;5%</span></div>
              <div className="row gap-3"><Status status="info">Completed</Status><span className="t-sm">closed</span></div>
              <div className="hr dash"/>
              <div className="row gap-2 t-sm"><span className="dot mute"/> grey · SAP locked / past</div>
              <div className="row gap-2 t-sm"><span style={{display:'inline-block',width:9,height:9,background:'rgba(58,94,140,.2)'}}/> blue tint · editable forecast</div>
              <div className="hr dash"/>
              <div className="row gap-2 t-sm"><div className="anno-mark" style={{position:'relative',top:0,left:0}}>1</div> annotation marker</div>
              <div className="t-xs t-mute">→ note explains adjacent UI</div>
            </div>
          </DCArtboard>

          <DCArtboard id="nav-system" label="navigation system" width={680} height={360}>
            <div className="wf p-5 col gap-3">
              <SVGFilters/>
              <div className="row">
                <div className="title h2">Sidebar nav · per role</div>
                <div className="grow"/>
                <span className="t-xs t-mute">canonical · same labels every screen</span>
              </div>
              <div className="row gap-3 grow" style={{alignItems:'stretch'}}>
                {[
                  {role:'PM',     who:'Sara · PM',         tone:'ok',
                    items:['Dashboard','Projects','Resources','Recognition','Updates']},
                  {role:'PD',     who:'K. Rajah · PD',     tone:'info',
                    items:['Portfolio','Projects','Recognition risk','Approvals','Updates']},
                  {role:'Finance',who:'L. Cheng · Finance', tone:'warn',
                    items:['SAP Import','Period Lock','Rate Card','Projects','Audit Log']},
                ].map(r=>(
                  <div key={r.role} className="box p-3 col gap-2 grow">
                    <div className="row">
                      <span className="pill tiny" style={{borderColor:`var(--${r.tone})`,color:`var(--${r.tone})`}}>{r.role}</span>
                      <span className="t-xs t-mute">{r.who}</span>
                    </div>
                    <div className="hr dash"/>
                    {r.items.map((it,i)=>(
                      <div key={i} className="row gap-2" style={{padding:'2px 0'}}>
                        <span className="nav-ic" style={{
                          width:11,height:11,
                          border:'1.5px solid var(--ink-2)',
                          borderRadius:i===0?'50%':3,
                          display:'inline-block',flex:'0 0 11px',
                        }}/>
                        <span className="t-sm">{it}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="t-xs t-mute">Each screen tags its role via the wrapper class (pov-pm / pov-pd / pov-fin). Sidebar picks the right nav + footer identity automatically.</div>
            </div>
          </DCArtboard>

          <DCArtboard id="sitemap" label="sitemap · how to reach every screen" width={900} height={520}>
            <div className="wf p-5 col gap-3">
              <SVGFilters/>
              <div className="row">
                <div className="title h2">Sitemap · how to reach every screen</div>
                <div className="grow"/>
                <span className="t-xs t-mute">grouped by role · top-down user journey</span>
              </div>
              <div className="row gap-3 grow" style={{alignItems:'stretch'}}>
                {[
                  {role:'PM · Sara', tone:'ok', steps:[
                    ['Login',                 'username + SSO'],
                    ['→ Dashboard',           'tasks + my projects (landing)'],
                    ['→ click a project',     'Project dashboard'],
                    ['  → WBS tab',           'Cost structure + sub-jobs'],
                    ['    → click a PO',      'Inventorise vs deploy'],
                    ['  → Resources tab',     'Headcount grid'],
                    ['  → "+ EAC"',           'EAC editor (time-phased)'],
                    ['Sidebar → Recognition', 'Plan + monthly per-sub-job entry'],
                    ['Sidebar → Updates',     'My updates list'],
                    ['  → "+ draft"',         'AI update drafter'],
                  ]},
                  {role:'PD · K. Rajah', tone:'info', steps:[
                    ['Login',                  'SSO'],
                    ['→ Portfolio',            'all projects (landing)'],
                    ['  → click a project',    'opens PM-style Project dashboard (read)'],
                    ['Sidebar → Recognition risk', 'Over-recognition portfolio view'],
                    ['Sidebar → Approvals',    'Re-baseline + variance queue'],
                    ['  → click queue item',   'detail + approve / reject'],
                    ['Sidebar → Updates',      'Team feed of PM updates'],
                    ['  → click a row',        'inline preview · acknowledge'],
                  ]},
                  {role:'Finance · L. Cheng', tone:'warn', steps:[
                    ['Login',                  'SSO'],
                    ['→ SAP Import',           'upload + impact preview (landing)'],
                    ['  → "commit"',           'Auto-created projects & WBS view'],
                    ['Sidebar → Period Lock',  'PM ack variances + lock month'],
                    ['Sidebar → Rate Card',    'Blended daily rate card (locked)'],
                    ['Sidebar → Audit Log',    'Re-baselines + overrides'],
                    ['Help → How recognition works', '(internal explainer)'],
                  ]},
                ].map(c=>(
                  <div key={c.role} className="box p-3 col gap-1 grow">
                    <div className="row">
                      <span className="pill tiny" style={{borderColor:`var(--${c.tone})`,color:`var(--${c.tone})`}}>{c.role}</span>
                    </div>
                    <div className="hr dash"/>
                    {c.steps.map(([step,what],i)=>(
                      <div key={i} className="row" style={{padding:'2px 0',alignItems:'baseline'}}>
                        <span className="t-sm b" style={{flex:'0 0 175px',fontFamily:'JetBrains Mono,monospace',fontSize:11,letterSpacing:'-0.02em'}}>{step}</span>
                        <span className="t-xs t-mute" style={{flex:1}}>{what}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="t-xs t-mute">Each section's subtitle in the canvas below also shows the path to that screen.</div>
            </div>
          </DCArtboard>
        </DCSection>

        <DCSection id="flows" title="End-to-end flows" subtitle="The journeys each role takes through the product">
          <DCArtboard id="flow-pm" label="PM · monthly update" width={FW} height={FH}><FlowPmMonthly/></DCArtboard>
          <DCArtboard id="flow-fin" label="Finance · SAP import" width={FW} height={FH}><FlowFinanceImport/></DCArtboard>
          <DCArtboard id="flow-pd" label="PD · review &amp; flag" width={FW} height={FH}><FlowPdReview/></DCArtboard>
        </DCSection>

        <DCSection id="login" title="Login & nav shell" subtitle="First impression + how the app's navigation feels">
          <DCArtboard id="login-a" label="A · brand split SSO" width={W} height={H}><LoginA/></DCArtboard>
          <DCArtboard id="login-b" label="B · minimal card" width={W} height={H}><LoginB/></DCArtboard>
          <DCArtboard id="shell-side" label="C · sidebar shell" width={W} height={H}><ShellSidebar/></DCArtboard>
        </DCSection>

        <DCSection id="portfolio" title="Portfolio dashboard · PD"
          subtitle="K. Rajah sees all projects sorted by risk  path: Login → Portfolio">
          <DCArtboard id="pf-a" label="A · sidebar + dense table" width={W} height={H}><PortfolioA/></DCArtboard>
          <DCArtboard id="pf-b" label="B · variance chart" width={W} height={H}><PortfolioB/></DCArtboard>
          <DCArtboard id="pf-c" label="C · grouped by status" width={W} height={H}><PortfolioC/></DCArtboard>
        </DCSection>

        <DCSection id="pd-approvals" title="Approvals · PD"
          subtitle="Re-baseline requests + over-threshold variances  path: Sidebar → Approvals">
          <DCArtboard id="pd-approvals-list" label="A · queue + detail" width={W} height={H}><PDApprovals/></DCArtboard>
        </DCSection>

        <DCSection id="pd-updates" title="Updates feed · PD"
          subtitle="PD reads all PM monthly updates in one place  path: Sidebar → Updates">
          <DCArtboard id="pd-updates-feed" label="A · team feed + preview" width={W} height={H}><PDUpdatesFeed/></DCArtboard>
        </DCSection>

        <DCSection id="recognition-pd" title="Over-recognition risk · PD"
          subtitle="Which projects are over-recognising vs. EAC  path: Sidebar → Recognition risk">
          <DCArtboard id="rr-risk" label="A · over-recognition risk view" width={W} height={H}><RevRecRisk/></DCArtboard>
        </DCSection>

        <DCSection id="pm-dashboard" title="Dashboard / inbox · PM"
          subtitle="Sara's landing page — what needs doing today  path: Login → Dashboard">
          <DCArtboard id="pm-dash" label="A · tasks + my projects" width={W} height={H}><PMDashboard/></DCArtboard>
        </DCSection>

        <DCSection id="project" title="Project dashboard · PM"
          subtitle="Single-project financial snapshot  path: Dashboard → click a project">
          <DCArtboard id="prj-a" label="A · sidebar + 5 KPI tiles" width={W} height={H}><ProjectA/></DCArtboard>
          <DCArtboard id="prj-b" label="B · chart hero" width={W} height={H}><ProjectB/></DCArtboard>
          <DCArtboard id="prj-c" label="C · % dial + tabbed detail" width={W} height={H}><ProjectC/></DCArtboard>
        </DCSection>

        <DCSection id="cost-structure" title="Project cost structure · PM"
          subtitle="WBS hierarchy, sub-jobs, and materials split  path: Project → WBS tab">
          <DCArtboard id="std-subjobs" label="A · WBS structure &amp; sub-jobs" width={W} height={H}><StdSubjobs/></DCArtboard>
          <DCArtboard id="std-inv" label="B · inventorise vs deploy · Project → WBS → a material PO row" width={W} height={H}><InvDeploy/></DCArtboard>
        </DCSection>

        <DCSection id="eac" title="EAC editor · PM"
          subtitle="PM enters ETC month by month; system builds the EAC  path: Project → '+ EAC'">
          <DCArtboard id="eac-a" label="A · time-phased table" width={W} height={H}><EacA/></DCArtboard>
          <DCArtboard id="eac-b" label="B · draggable cumulative chart" width={W} height={H}><EacB/></DCArtboard>
          <DCArtboard id="eac-c" label="C · component rail + sparkline" width={W} height={H}><EacC/></DCArtboard>
        </DCSection>

        <DCSection id="resource" title="Resource &amp; labour forecasting · PM"
          subtitle="Headcount plan by role — system computes labour cost  path: Project → Resources tab">
          <DCArtboard id="res-a" label="A · full grid · 12-month" width={W} height={H}><ResourceA/></DCArtboard>
          <DCArtboard id="res-b" label="B · stacked area + role rows" width={W} height={H}><ResourceB/></DCArtboard>
          <DCArtboard id="res-c" label="C · roles list + detail panel" width={W} height={H}><ResourceC/></DCArtboard>
        </DCSection>

        <DCSection id="recognition-pm" title="Revenue recognition · PM"
          subtitle="Input-method: (cost to date ÷ EAC) × contract value  path: Sidebar → Recognition">
          <DCArtboard id="rr-plan" label="A · initial recognition plan · Recognition → a project → Plan tab" width={W} height={H}><RevRecPlan/></DCArtboard>
          <DCArtboard id="rr-monthly" label="B · monthly recognition + guardrail · Recognition → a project → This month" width={W} height={H}><RevRecMonthly/></DCArtboard>
        </DCSection>

        <DCSection id="pm-updates" title="Updates · PM"
          subtitle="Monthly project health updates — the narrative record  path: Sidebar → Updates">
          <DCArtboard id="pm-updates-list" label="A · updates list" width={W} height={H}><PMUpdatesList/></DCArtboard>
          <DCArtboard id="ai-update" label="B · AI update drafter · Updates → '+ draft'" width={W} height={H}><AiUpdate/></DCArtboard>
        </DCSection>

        <DCSection id="sap" title="SAP import · Finance"
          subtitle="Monthly actual cost upload from SAP  path: Login → SAP Import">
          <DCArtboard id="sap-a" label="A · upload + preview impact" width={W} height={H}><SapA/></DCArtboard>
          <DCArtboard id="sap-b" label="B · period lock · Sidebar → Period Lock" width={W} height={H}><SapB/></DCArtboard>
          <DCArtboard id="sap-c" label="C · auto-created projects &amp; WBS · after upload → 'review created'" width={W} height={H}><SapC/></DCArtboard>
        </DCSection>

        <DCSection id="standards" title="Cost standards · Finance"
          subtitle="Finance-owned blended rates — locked to PMs, used for all forecasting  path: Sidebar → Rate Card">
          <DCArtboard id="std-rates" label="A · blended rate card (locked)" width={W} height={H}><StdRates/></DCArtboard>
        </DCSection>

        <DCSection id="recognition-internal" title="Recognition mechanism · Finance internal"
          subtitle="How input-method recognition is calculated behind the scenes — explainer, not in PM/PD UI  path: Help → How recognition works">
          <DCArtboard id="rr-concept" label="A · how recognition works" width={W} height={H}><RevRecConcept/></DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="View" />
        <TweakToggle label="Show annotations"
          value={t.annotations}
          onChange={(v) => setTweak('annotations', v)} />
        <TweakSection label="Role POV" />
        <TweakRadio label="Highlight"
          value={t.pov}
          options={['All','PM','PD','Fin']}
          onChange={(v) => setTweak('pov', v)} />
        <div style={{
          fontSize:11, color:'rgba(41,38,27,.55)', lineHeight:1.4, marginTop:4,
          fontFamily:'ui-sans-serif,system-ui'
        }}>
          POV fades screens not used by that role. Use the artboard's ⤢ button to focus one design. ←/→ navigates inside a section, ↑/↓ jumps between sections.
        </div>
      </TweaksPanel>
    </>
  )
}
