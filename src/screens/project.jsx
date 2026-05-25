import React from 'react'
import { SVGFilters, Anno, Status, Sidebar, LineChart, BarChart, Logo } from './shared'

const ProjectA = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Projects" user="Sara" role="PM"/>
      <div className="col grow">
        <div className="row p-3 gap-3" style={{borderBottom:'1.5px solid var(--ink)'}}>
          <span className="t-xs">Projects /</span>
          <span className="b" style={{fontSize:13}}>EAC Refresh Programme</span>
          <span className="t-xs">· WBS PR-2025-014</span>
          <Status status="ok"/>
          <div className="grow"/>
          <div className="btn sm primary">+ Monthly update</div>
          <div className="btn sm ghost">⋯</div>
        </div>

        <div className="p-4 col gap-3 grow">
          <div className="row gap-3">
            <div className="box p-3 grow"><div className="t-xs tt-up">Budget</div><div className="h1 title mt-2">$1.20M</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">EAC</div><div className="h1 title mt-2">$1.24M</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Variance</div><div className="h1 title mt-2" style={{color:'var(--warn)'}}>+3.3%</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">% Complete</div><div className="h1 title mt-2">64%</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Months left</div><div className="h1 title mt-2">7</div></div>
          </div>

          <div className="row gap-3">
            <div className="box p-3 grow"><div className="t-xs tt-up">Actual (SAP)</div><div className="h3 b mt-2">$540K</div><div className="t-xs">locked · last sync 8 May</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Committed</div><div className="h3 b mt-2">$180K</div><div className="t-xs">PO &amp; contracts</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Labour ETC</div><div className="h3 b mt-2">$390K</div><div className="t-xs">auto · 7mo forecast</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Other ETC</div><div className="h3 b mt-2">$130K</div><div className="t-xs">PM input</div></div>
            <div className="box p-3 grow fill"><div className="t-xs tt-up">= EAC</div><div className="h3 title mt-2">$1.24M</div><div className="t-xs">vs $1.20M budget</div></div>
          </div>

          <div className="row gap-3 grow">
            <div className="box p-3 col gap-2 grow">
              <div className="row"><span className="b">Update history</span><div className="grow"/><span className="t-xs">last 6 mo</span></div>
              <div className="hr thin"/>
              {[
                ['May', 'Q. test rig delivered 2/5. Vendor confirms remaining by 20 May.', 'ok'],
                ['Apr', 'Network swap completed. 4 days ahead of plan.', 'ok'],
                ['Mar', '2 servers delayed by vendor; mitigation: expedite cost SGD 8K.', 'warn'],
                ['Feb', 'Wave 1 closed on budget. Wave 2 kickoff next week.', 'ok'],
              ].map((u,i)=>(
                <div key={i} className="row gap-3" style={{alignItems:'flex-start',padding:'4px 0'}}>
                  <div className="title" style={{width:36,fontSize:14}}>{u[0]}</div>
                  <span className={`dot ${u[2]}`} style={{marginTop:5}}/>
                  <div className="t-sm grow">{u[1]}</div>
                </div>
              ))}
            </div>

            <div className="box p-3 col gap-2" style={{flex:'0 0 240px'}}>
              <div className="b">Cost trend</div>
              <LineChart width={200} height={90} points={[12,24,38,54,68,82,90]} label="EAC vs budget"/>
              <div className="t-xs t-mute">red dashes = budget line</div>
              <div className="hr dash"/>
              <div className="b">Resource plan</div>
              <div className="t-xs">12 roles · 4.5 FTE this month</div>
              <BarChart width={200} height={48} bars={Array.from({length:12}).map((_,i)=>({v:i<4?60:(i<6?75:85),c:i<4?'#6b655e':'#1a1815'}))}/>
              <div className="t-xs">past · forecast →</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={280} y={100} w="180px">5 KPI tiles — number-forward, no chart in the hero.</Anno>
    <Anno n="2" x={300} y={210} w="200px">EAC formula laid out left-to-right. PM sees the build-up of their number.</Anno>
    <Anno n="3" x={420} y={360} w="160px">Update history is the narrative spine of the project.</Anno>
  </div>
)

const ProjectB = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Projects" user="Sara" role="PM"/>
      <div className="col grow">
      <div className="p-4 col gap-3 grow">
        <div className="row">
          <div className="col gap-2">
            <div className="row gap-3"><div className="title h2">EAC Refresh Programme</div><Status status="ok"/></div>
            <div className="t-xs">PM: Sara Tan · Director: K. Rajah · WBS PR-2025-014 · started Jan '25</div>
          </div>
          <div className="grow"/>
          <div className="btn sm primary">+ Monthly update</div>
        </div>

        <div className="box p-4 col gap-3" style={{flex:'1.4'}}>
          <div className="row">
            <div>
              <div className="t-xs tt-up">Cost trend</div>
              <div className="row gap-4 mt-2" style={{alignItems:'baseline'}}>
                <div><span className="title h2">$1.24M</span> <span className="t-xs t-mute">EAC</span></div>
                <div><span className="b">$1.20M</span> <span className="t-xs t-mute">budget</span></div>
                <div style={{color:'var(--warn)'}} className="b">+3.3%</div>
              </div>
            </div>
            <div className="grow"/>
            <div className="row gap-2 t-xs">
              <span style={{display:'inline-flex',alignItems:'center',gap:4}}><i style={{width:14,height:2,background:'var(--ink)'}}/>actual+forecast</span>
              <span style={{display:'inline-flex',alignItems:'center',gap:4}}><i style={{width:14,height:0,borderTop:'1.5px dashed var(--bad)'}}/>budget</span>
            </div>
          </div>
          <LineChart width={680} height={140} points={[8,22,34,46,58,70,82,92,102,108,114,118]} budgetLine={true}/>
          <div className="row t-xs" style={{justifyContent:'space-between',paddingLeft:8,paddingRight:8}}>
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i)=>(
              <span key={i} style={{opacity: i>=5?0.5:1}}>{m}</span>
            ))}
          </div>
        </div>

        <div className="row gap-3">
          <div className="box p-3 col gap-2 grow">
            <span className="b">EAC Breakdown</span>
            <div className="row" style={{height:22,border:'1.5px solid var(--ink)',borderRadius:4,overflow:'hidden'}}>
              <div style={{flex:540,background:'var(--ink)'}}/>
              <div style={{flex:180,background:'var(--ink-3)'}}/>
              <div style={{flex:390,background:'var(--paper-3)'}}/>
              <div style={{flex:130,background:'var(--paper-2)'}}/>
            </div>
            <div className="row t-xs gap-3" style={{flexWrap:'wrap'}}>
              <span>■ Actual $540K</span>
              <span style={{color:'var(--ink-3)'}}>■ Committed $180K</span>
              <span>□ Labour ETC $390K</span>
              <span>□ Other ETC $130K</span>
            </div>
          </div>
          <div className="box p-3 col gap-1" style={{flex:'0 0 200px'}}>
            <span className="b">Latest update · May</span>
            <div className="t-sm">Test rig 2/5 delivered. Vendor confirms remainder by 20 May. % complete +6.</div>
            <div className="hr dash mt-2"/>
            <div className="row t-xs gap-2"><span className="dot warn"/>1 milestone slipping</div>
            <div className="row t-xs gap-2"><span className="dot info"/>SAP synced 8 May</div>
          </div>
        </div>
      </div>
    </div>
    </div>
    <Anno n="1" x={300} y={140} w="170px">Chart-forward: 12-month trend is the hero.</Anno>
    <Anno n="2" x={130} y={300} w="170px">Stacked bar = EAC formula made visual.</Anno>
  </div>
)

const ProjectC = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters/>
    <div className="col full">
      <div className="row p-3 gap-3" style={{borderBottom:'1.5px solid var(--ink)',background:'var(--paper-2)'}}>
        <Logo size={12}/>
        <span className="t-xs">/</span>
        <span className="t-xs">My Projects</span>
        <span className="t-xs">/</span>
        <span className="b" style={{fontSize:13}}>EAC Refresh Programme</span>
        <div className="grow"/>
        <div className="btn sm ghost">↗ open in EAC editor</div>
        <div className="btn sm primary">+ Update</div>
      </div>

      <div className="row grow" style={{alignItems:'stretch'}}>
        <div className="col p-4 gap-3" style={{flex:'0 0 240px',borderRight:'1.5px solid var(--ink-3)',background:'var(--paper-2)'}}>
          <div>
            <div className="t-xs tt-up">Status</div>
            <Status status="ok"/>
          </div>
          <div style={{display:'flex',justifyContent:'center',padding:8}}>
            <svg width="140" height="140" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#ebe6dc" strokeWidth="8"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1815" strokeWidth="8"
                strokeDasharray={`${64*2.64} 999`} transform="rotate(-90 50 50)" strokeLinecap="round"/>
              <text x="50" y="50" textAnchor="middle" fontFamily="Caveat" fontSize="24" fontWeight="700">64%</text>
              <text x="50" y="64" textAnchor="middle" fontFamily="Kalam" fontSize="6" fill="#6b655e">complete</text>
            </svg>
          </div>
          <div className="hr dash"/>
          <div className="row" style={{justifyContent:'space-between'}}>
            <div><div className="t-xs tt-up">EAC</div><div className="h3 b">$1.24M</div></div>
            <div><div className="t-xs tt-up">Budget</div><div className="h3 b">$1.20M</div></div>
          </div>
          <div className="row" style={{justifyContent:'space-between'}}>
            <div><div className="t-xs tt-up">Var</div><div className="h3 b" style={{color:'var(--warn)'}}>+3.3%</div></div>
            <div><div className="t-xs tt-up">Months</div><div className="h3 b">7 left</div></div>
          </div>
          <div className="hr dash"/>
          <div className="t-xs t-mute">Updated 5 May · next due 5 Jun</div>
        </div>

        <div className="col grow p-4 gap-3">
          <div className="row gap-2">
            {['Trend','Resource plan','Update history','Risks (2)'].map((t,i)=>(
              <div key={i} style={{
                padding:'4px 12px',borderRadius:6,fontSize:12,
                background:i===0?'var(--ink)':'transparent',
                color:i===0?'var(--paper)':'var(--ink-2)',
                border:i===0?'1.5px solid var(--ink)':'1.5px solid var(--ink-3)',
              }}>{t}</div>
            ))}
          </div>
          <div className="box p-3 col gap-2 grow">
            <div className="row">
              <span className="b">Cost &amp; commitment trend</span>
              <div className="grow"/>
              <span className="pill tiny">12m</span>
              <span className="pill tiny solid">YTD</span>
              <span className="pill tiny">all</span>
            </div>
            <LineChart width={460} height={130} points={[8,22,34,46,58,70,82,92,102,108,114,118]} budgetLine={true} label="EAC trending above budget"/>
            <div className="row gap-4 t-xs">
              <span>—— EAC</span>
              <span style={{color:'var(--bad)'}}>┄┄ Budget</span>
              <div className="grow"/>
              <span>Burn rate: 1.2x plan</span>
            </div>
          </div>
          <div className="row gap-3">
            <div className="box p-3 grow col gap-1">
              <div className="t-xs tt-up">Next milestone</div>
              <div className="b">Quality test rig — 20 May</div>
              <div className="t-xs"><span className="dot warn"/> 1 of 5 delivered · vendor delay</div>
            </div>
            <div className="box p-3 grow col gap-1">
              <div className="t-xs tt-up">Top risk</div>
              <div className="b">Vendor lead time slippage</div>
              <div className="t-xs">Action: expedite + dual-source</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={130} y={170} w="150px">Hybrid: dial dominates left, tabs run details right.</Anno>
    <Anno n="2" x={500} y={140} w="170px" side="l">Chart range toggle — 12m / YTD / all.</Anno>
  </div>
)

export { ProjectA, ProjectB, ProjectC }
