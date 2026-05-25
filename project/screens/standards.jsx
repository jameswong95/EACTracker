/* standards.jsx — Cost standards
   - Finance-owned blended rate card (per E-grade)
   - WBS structure: main WBS holds project-specific sub-jobs (e.g. Project mgmt, Main-con, Misc)
   - Column model: Contract Value + Budget come from SAP; Actual CTD, Committed CTD, ETC, EAC, Budget Remaining are calculated
   - Inventorise vs deploy for partial material consumption
*/

/* ──────────────────────────────────────────────────────────────────
   A · Standard blended rates — Finance-owned, locked, read-only to PMs
   ────────────────────────────────────────────────────────────────── */
const StdRates = () => (
  <div className="wf pov-only pov-fin">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Rate Card" user="L. Cheng" role="Finance"/>
      <div className="col grow">
        <div className="row p-3 gap-3" style={{borderBottom:'1.5px solid var(--ink)'}}>
          <span className="t-xs">Standards /</span>
          <span className="b" style={{fontSize:13}}>Blended rate card · FY26</span>
          <span className="pill tiny solid">finance-owned · locked to PMs</span>
          <div className="grow"/>
          <div className="btn sm ghost">history</div>
          <div className="btn sm primary">publish FY27 draft</div>
        </div>

        <div className="p-4 col gap-3 grow">
          <div className="row gap-3">
            <div className="box p-3 grow fill">
              <div className="t-xs tt-up">Effective</div>
              <div className="h3 b mt-2">1 Apr 2026 → 31 Mar 2027</div>
              <div className="t-xs t-mute">refreshed annually · constant within the year</div>
            </div>
          </div>

          {/* Rate grid */}
          <div className="box p-3 col gap-2 grow">
            <div className="row">
              <span className="b">Daily rate by grade</span>
              <span className="t-xs t-mute" style={{marginLeft:8}}>· SGD · 22 working days / mo</span>
              <div className="grow"/>
              <span className="t-xs">read-only · raise a ticket to amend</span>
            </div>
            <Table
              cols={['Grade','Band','Daily rate','Monthly (22d)','vs FY25','In use by']}
              colWidths=".7fr 1.4fr .9fr .9fr .9fr 1fr"
              rows={[
                ['E1', 'Junior engineer / analyst',     '$ 220', '$ 4,840', <span style={{color:'var(--ok)'}}>+3.8%</span>, '142 plans'],
                ['E2', 'Engineer',                       '$ 285', '$ 6,270', <span style={{color:'var(--ok)'}}>+3.6%</span>, '198 plans'],
                ['E3', 'Senior engineer / tech lead',    '$ 360', '$ 7,920', <span style={{color:'var(--ok)'}}>+4.1%</span>, '156 plans'],
                ['E4', 'Principal / programme manager',  '$ 460', '$10,120', <span style={{color:'var(--ok)'}}>+4.0%</span>, '88 plans'],
                ['E5', 'Director / chief',               '$ 580', '$12,760', <span style={{color:'var(--ok)'}}>+3.5%</span>, '42 plans'],
                ['SC', 'Sub-contractor pass-through',    '— ',    '— ',      '—',                                            'use sub-con sub-job'],
              ].map((r,ri)=>r.map((c,ci)=>{
                if(ci===0) return <span className="b" style={{fontSize:13}}>{c}</span>;
                if(ci===2||ci===3) return <span style={{fontVariantNumeric:'tabular-nums',width:'100%',textAlign:'right',display:'block'}}>{c}</span>;
                return c;
              }))}
            />
          </div>

          <div className="row gap-3">
            <div className="box p-3 grow col gap-1">
              <div className="t-xs tt-up">PM sees</div>
              <div className="t-sm">Headcount only — never a dollar rate. The system multiplies behind the scenes.</div>
            </div>
            <div className="box p-3 grow col gap-1">
              <div className="t-xs tt-up">Tender alignment</div>
              <div className="t-sm">Same rate table feeds the tender tool — no fork between bid and execution.</div>
            </div>
            <div className="box p-3 grow col gap-1">
              <div className="t-xs tt-up">Change control</div>
              <div className="t-sm">Annual refresh only. Mid-year edits require Finance Director sign-off + retro freeze.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={420} y={130} w="200px">Single source of truth — same numbers fund tender, forecast and EAC.</Anno>
    <Anno n="2" x={300} y={400} w="180px">Locked icon next to each rate makes it obvious to PMs that this is not their lever.</Anno>
  </div>
);

/* ──────────────────────────────────────────────────────────────────
   B · WBS structure & sub-jobs
      Hierarchical: Main WBS (e.g. 123456789/001-1) → Sub-jobs (123456789/001-1-1 …).
      Sub-jobs are project-specific (e.g. Project Mgmt, Main-con, Misc).
      Columns split into SAP-sourced (Contract Value, Budget) and calculated.
   ────────────────────────────────────────────────────────────────── */
const StdSubjobs = () => {
  const SAPCol = ({children}) => (
    <span style={{background:'rgba(58,94,140,.10)',padding:'1px 4px',borderRadius:3,fontVariantNumeric:'tabular-nums'}}>{children}</span>
  );
  const CalcCol = ({children, tone}) => (
    <span style={{
      background:'rgba(201,138,44,.08)',padding:'1px 4px',borderRadius:3,fontStyle:'italic',
      color:tone==='bad'?'var(--bad)':tone==='warn'?'var(--warn)':'var(--ink)',
      fontVariantNumeric:'tabular-nums',
    }}>{children}</span>
  );

  return (
  <div className="wf pov-only pov-pm">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Recognition" user="Sara" role="PM"/>
      <div className="col grow">
      <div className="p-4 col gap-3 grow" style={{overflow:'hidden'}}>
        <div className="row">
          <div className="title h2">WBS structure · EAC Refresh Programme</div>
          <div className="grow"/>
          <span className="t-xs t-mute">main WBS holds project-specific sub-jobs · structure from SAP</span>
        </div>

        {/* Hierarchy header card */}
        <div className="box p-3 row gap-4" style={{alignItems:'center'}}>
          <div className="col" style={{gap:0}}>
            <div className="t-xs tt-up">Main WBS</div>
            <div className="mono b" style={{fontSize:14}}>123456789/001-1</div>
            <div className="t-xs t-mute">EAC Refresh Programme</div>
          </div>
          <span className="t-xs">contains →</span>
          <div className="row gap-2" style={{flexWrap:'wrap'}}>
            {['Project management','Main-con','Misc','+ add'].map((s,i)=>(
              <span key={i} className={`pill tiny ${i===3?'':'solid'}`} style={i===3?{borderStyle:'dashed',color:'var(--ink-3)',borderColor:'var(--ink-3)'}:{}}>{s}</span>
            ))}
          </div>
          <div className="grow"/>
          <div className="col" style={{gap:0,textAlign:'right'}}>
            <div className="t-xs tt-up">Contract value</div>
            <div className="h3 title">$1.20M</div>
          </div>
        </div>

        {/* Column legend */}
        <div className="row gap-3 t-xs" style={{alignItems:'center'}}>
          <span><SAPCol>blue tint</SAPCol> = pulled from SAP monthly template</span>
          <span><CalcCol>italic amber</CalcCol> = calculated over the months</span>
          <div className="grow"/>
          <span className="t-mute">$ thousands</span>
        </div>

        {/* Main hierarchical table */}
        <div className="box p-3 col gap-2 grow" style={{overflow:'hidden'}}>
          <Table
            cols={[
              'WBS / Sub-job',
              <span>Contract <span className="t-xs t-mute">·SAP</span></span>,
              <span>Budget <span className="t-xs t-mute">·SAP</span></span>,
              <span>Actual CTD <span className="t-xs t-mute">·calc</span></span>,
              <span>Committed CTD <span className="t-xs t-mute">·calc</span></span>,
              <span>ETC <span className="t-xs t-mute">·calc</span></span>,
              <span>EAC <span className="t-xs t-mute">·calc</span></span>,
              <span>Budget remaining <span className="t-xs t-mute">·calc</span></span>,
            ]}
            colWidths="2.4fr .9fr .9fr 1fr 1.1fr .9fr .9fr 1.1fr"
            rows={[
              // Parent total row
              ['123456789/001-1  ·  EAC Refresh Programme',
                <SAPCol>$1,200</SAPCol>, <SAPCol>$1,200</SAPCol>,
                <CalcCol>$540</CalcCol>, <CalcCol>$180</CalcCol>,
                <CalcCol>$520</CalcCol>, <CalcCol tone="warn">$1,240</CalcCol>,
                <CalcCol tone="warn">−$40</CalcCol>],
              ['  ↳ 123456789/001-1-1  ·  Project management',
                '—', <SAPCol>$180</SAPCol>,
                <CalcCol>$ 72</CalcCol>, <CalcCol>$ 12</CalcCol>,
                <CalcCol>$ 98</CalcCol>, <CalcCol>$182</CalcCol>,
                <CalcCol>−$2</CalcCol>],
              ['  ↳ 123456789/001-1-2  ·  Main-con',
                '—', <SAPCol>$820</SAPCol>,
                <CalcCol>$408</CalcCol>, <CalcCol>$148</CalcCol>,
                <CalcCol>$320</CalcCol>, <CalcCol tone="warn">$876</CalcCol>,
                <CalcCol tone="warn">−$56</CalcCol>],
              ['  ↳ 123456789/001-1-3  ·  Misc',
                '—', <SAPCol>$200</SAPCol>,
                <CalcCol>$ 60</CalcCol>, <CalcCol>$ 20</CalcCol>,
                <CalcCol>$102</CalcCol>, <CalcCol>$182</CalcCol>,
                <CalcCol>+$18</CalcCol>],
            ].map((r,ri)=>{
              const arr = r.map((c,ci)=>{
                if(ci===0) return <span style={{fontWeight:ri===0?700:500,fontSize:12,fontFamily:ri===0?undefined:'JetBrains Mono,monospace'}}>{c}</span>;
                return <span style={{width:'100%',textAlign:'right',display:'block'}}>{c}</span>;
              });
              arr.__rowStyle = ri===0?{background:'var(--paper-2)',fontWeight:700}:{};
              return arr;
            })}
          />
          <div className="hr dash mt-2"/>
          <div className="row gap-3 t-xs">
            <span><b>EAC</b> = Actual CTD + Committed CTD + ETC</span>
            <span><b>Budget remaining</b> = Budget − EAC</span>
            <div className="grow"/>
            <span className="t-mute">Parent row sums children · variance flagged in red when EAC &gt; Budget</span>
          </div>
        </div>

        {/* Bottom explainer */}
        <div className="row gap-3">
          <div className="box p-3 grow col gap-1">
            <div className="t-xs tt-up">Sub-job is per-project</div>
            <div className="t-sm">PM names sub-jobs to fit the work — &ldquo;Project management&rdquo;, &ldquo;Main-con&rdquo;, &ldquo;Misc&rdquo; here, anything else next project.</div>
          </div>
          <div className="box p-3 grow col gap-1">
            <div className="t-xs tt-up">From SAP</div>
            <div className="t-sm">Contract value (parent), budget (per sub-job). Refreshed on every monthly upload.</div>
          </div>
          <div className="box p-3 grow col gap-1">
            <div className="t-xs tt-up">Calculated here</div>
            <div className="t-sm">Actual CTD, Committed CTD, ETC, EAC, Budget remaining — recomputed each month from SAP + PM forecast.</div>
          </div>
        </div>
      </div>
    </div>
    </div>
    <Anno n="1" x={300} y={150} w="200px">Main WBS = 123456789/001-1. Sub-jobs sit one level below: ...-1-1, ...-1-2, ...-1-3.</Anno>
    <Anno n="2" x={620} y={290} w="190px" side="l">2 columns from SAP (blue) + 5 columns we calculate (italic) — same shape every project.</Anno>
  </div>
);};

/* ──────────────────────────────────────────────────────────────────
   C · Inventorise vs deploy — partial consumption of materials
   ────────────────────────────────────────────────────────────────── */
const InvDeploy = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Recognition" user="Sara" role="PM"/>
      <div className="col grow">
        <div className="row p-3 gap-3" style={{borderBottom:'1.5px solid var(--ink)'}}>
          <span className="t-xs">EAC / Materials /</span>
          <span className="b" style={{fontSize:13}}>PO #44219 — Optical cable 10,000 m</span>
          <div className="grow"/>
          <span className="pill tiny">GR posted · 8 May</span>
          <div className="btn sm ghost">cancel</div>
          <div className="btn sm primary">save split</div>
        </div>

        <div className="p-4 col gap-3 grow">
          <div className="row gap-3">
            <div className="box p-3 grow">
              <div className="t-xs tt-up">Ordered (PO)</div>
              <div className="h2 title mt-2">10,000 m</div>
              <div className="t-xs t-mute">@ $4.80/m · $48,000 · bulk discount applied</div>
            </div>
            <div className="box p-3 grow">
              <div className="t-xs tt-up">For this phase</div>
              <div className="h2 title mt-2">2,000 m</div>
              <div className="t-xs t-mute">deploy now · phase 2 wave 1</div>
            </div>
            <div className="box p-3 grow">
              <div className="t-xs tt-up">For later</div>
              <div className="h2 title mt-2">8,000 m</div>
              <div className="t-xs t-mute">inventorise · phase 3 (~Q1 ’27)</div>
            </div>
          </div>

          {/* Visual split slider */}
          <div className="box p-4 col gap-3">
            <div className="row">
              <span className="b">Cost split · how much hits EAC now?</span>
              <div className="grow"/>
              <span className="t-xs">drag the divider</span>
            </div>
            <div style={{position:'relative',height:60,border:'1.5px solid var(--ink)',borderRadius:4,overflow:'hidden',background:'var(--paper-2)'}}>
              <div style={{position:'absolute',left:0,top:0,bottom:0,width:'20%',background:'rgba(58,94,140,.25)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div className="col" style={{alignItems:'center',gap:0}}>
                  <span className="b">deploy now</span>
                  <span className="t-xs">2,000 m · $9.6K → EAC</span>
                </div>
              </div>
              <div style={{position:'absolute',left:'20%',top:0,bottom:0,right:0,background:'rgba(0,0,0,.05)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div className="col" style={{alignItems:'center',gap:0}}>
                  <span className="b">inventorise</span>
                  <span className="t-xs">8,000 m · $38.4K → balance sheet</span>
                </div>
              </div>
              {/* drag handle */}
              <div style={{position:'absolute',left:'calc(20% - 6px)',top:-4,bottom:-4,width:12,background:'var(--ink)',cursor:'ew-resize',borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{color:'var(--paper)',fontSize:10,letterSpacing:-1}}>∥</span>
              </div>
            </div>
            <div className="row gap-3 t-xs t-mute">
              <span>20% deploy · 80% inventory · reversible until period close.</span>
              <div className="grow"/>
              <span>auto-suggest from deployment plan: <b className="hand" style={{color:'var(--info)'}}>20 / 80 ✓</b></span>
            </div>
          </div>

          <div className="row gap-3 grow">
            {/* Future draw-down schedule */}
            <div className="box p-3 col gap-2 grow">
              <div className="row">
                <span className="b">Inventory draw-down schedule</span>
                <div className="grow"/>
                <span className="t-xs">recognised as deployed</span>
              </div>
              <Table
                cols={['Phase','When','Quantity','Cost to ETC','Status']}
                colWidths="1.4fr 1fr .9fr 1fr 1fr"
                rows={[
                  ['Wave 1 — datacentre A', 'May ’26',  '2,000 m', '$ 9,600',  <Status status="ok">posted</Status>],
                  ['Wave 2 — datacentre B', 'Sep ’26',  '3,000 m', '$14,400',  <Status status="info">planned</Status>],
                  ['Wave 3 — branch sites', 'Q1 ’27',   '4,500 m', '$21,600',  <Status status="info">planned</Status>],
                  ['Spare / contingency',   'on demand','  500 m', '$ 2,400',  <span className="pill tiny">reserve</span>],
                ].map(r=>r.map((c,ci)=>{
                  if(ci===2||ci===3) return <span style={{fontVariantNumeric:'tabular-nums',width:'100%',textAlign:'right',display:'block'}}>{c}</span>;
                  return c;
                }))}
              />
            </div>

            {/* Effect on EAC */}
            <div className="box p-3 col gap-2" style={{flex:'0 0 240px'}}>
              <span className="b">Effect on this EAC</span>
              <div className="row" style={{justifyContent:'space-between'}}>
                <span className="t-sm">Naive (all to EAC)</span>
                <span className="b strike">$48.0K</span>
              </div>
              <div className="row" style={{justifyContent:'space-between'}}>
                <span className="t-sm">With deploy split</span>
                <span className="b" style={{color:'var(--ok)'}}>$9.6K</span>
              </div>
              <div className="hr dash"/>
              <div className="t-sm">Difference of <b>$38.4K</b> stays on balance sheet — released to future EACs as deployed.</div>
              <div className="hr dash"/>
              <div className="t-xs t-mute">Stops bulk-discount POs from inflating early-phase EAC and triggering false over-recognition flags.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={500} y={240} w="200px">Boss's example: bought 10,000m, only 2,000 deployed. Splits the GR into deploy + inventory.</Anno>
    <Anno n="2" x={760} y={420} w="180px" side="l">Without this, bulk-discount POs would falsely trigger the recognition guardrail.</Anno>
  </div>
);

Object.assign(window, { StdRates, StdSubjobs, InvDeploy });
