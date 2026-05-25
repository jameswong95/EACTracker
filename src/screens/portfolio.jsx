import React from 'react'
import { SVGFilters, Anno, Status, Table, Sidebar, LineChart, BarChart, Logo } from './shared'

const portfolioRows = [
  ['EAC Refresh Programme',      'S. Tan',   '$1.20M', '$1.24M', '+3.3%', 'ok',   '5 May'],
  ['Network Modernisation',      'A. Kumar', '$900K',  '$880K',  '-2.2%', 'warn', '2 May'],
  ['Site Commissioning Ph.2',    'L. Wong',  '$1.95M', '$2.10M', '+7.7%', 'bad',  '28 Apr'],
  ['Asset Refresh — Office',     'J. Lim',   '$420K',  '$418K',  '-0.5%', 'ok',   '9 May'],
  ['Datacentre Migration',       'R. Patel', '$3.40M', '$3.45M', '+1.5%', 'ok',   '6 May'],
  ['Security Hardening Wave 3',  'M. Goh',   '$240K',  '$246K',  '+2.5%', 'warn', '1 May'],
  ['Wireless Refresh',           'A. Kumar', '$680K',  '$665K',  '-2.2%', 'ok',   '10 May'],
  ['CRM Rollout',                'S. Tan',   '$1.10M', '$1.13M', '+2.7%', 'ok',   '7 May'],
]

const PortfolioA = () => (
  <div className="wf pov-only pov-pd">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Portfolio" user="K. Rajah" role="PD"/>
      <div className="col grow p-5 gap-4">
        <div className="row">
          <div className="title h2">Portfolio</div>
          <div className="t-sm" style={{marginLeft:8}}>· All projects across your team</div>
          <div className="grow"/>
          <div className="btn sm ghost">⤓ Export Excel</div>
        </div>

        <div className="row gap-3 box p-3 fill" style={{flexWrap:'wrap'}}>
          <div className="t-xs tt-up">Filters:</div>
          <div className="input">Team: All ▾</div>
          <div className="input">PM: All ▾</div>
          <div className="input">Status: All ▾</div>
          <div className="input">Variance ⩾ 0% ▾</div>
          <div className="input">Last update: any ▾</div>
          <div className="grow"/>
          <div className="t-xs">8 of 24 shown</div>
        </div>

        <div className="row gap-3">
          <div className="box p-3 grow"><div className="t-xs tt-up">Portfolio Budget</div><div className="h2 title mt-2">$10.0M</div></div>
          <div className="box p-3 grow"><div className="t-xs tt-up">Portfolio EAC</div><div className="h2 title mt-2">$10.2M</div></div>
          <div className="box p-3 grow"><div className="t-xs tt-up">Variance</div><div className="h2 title mt-2" style={{color:'var(--warn)'}}>+2.0%</div></div>
          <div className="box p-3 grow"><div className="t-xs tt-up">Overdue Updates</div><div className="h2 title mt-2" style={{color:'var(--bad)'}}>3</div></div>
        </div>

        <div className="box p-3 grow">
          <Table
            cols={['Project','PM','Budget','EAC','Var %','Status','Last update','·']}
            colWidths=".2fr 1.7fr .7fr .7fr .7fr .5fr .9fr 1fr .1fr"
            rows={portfolioRows.map(r=>{
              const [n,pm,b,e,v,s,u]=r
              return ['',n,pm,b,e,v,<Status status={s}/>,u,'⋯']
            }).map((r,i)=>{r.__cls = i===2?'row-hi-bad':i===1||i===5?'row-hi':''; return r})}
          />
        </div>
      </div>
    </div>
    <Anno n="1" x={300} y={80} w="160px">Filter row pinned — most-used controls visible.</Anno>
    <Anno n="2" x={650} y={150} w="150px" side="l">Stats are aggregations of the filtered set.</Anno>
    <Anno n="3" x={200} y={400} w="180px">Row colour reinforces status pill — scannable.</Anno>
  </div>
)

const PortfolioB = () => (
  <div className="wf pov-only pov-pd">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Portfolio" user="K. Rajah" role="PD"/>
      <div className="col grow">
      <div className="p-5 col gap-4 grow">
        <div className="row">
          <div className="title h2">Portfolio overview</div>
          <div className="grow"/>
          <div className="row gap-2">
            <div className="btn sm">Cards</div>
            <div className="btn sm ghost">Table</div>
            <div className="btn sm ghost">⤓ Export</div>
          </div>
        </div>

        <div className="row gap-4">
          <div className="box p-4 col gap-2" style={{flex:'1.8'}}>
            <div className="row"><span className="b">Variance by project</span><div className="grow"/><span className="t-xs">8 projects</span></div>
            <BarChart width={420} height={90} bars={[
              {v:35,c:'#3b7a55'},{v:55,c:'#3b7a55'},{v:48,c:'#c98a2c'},{v:62,c:'#3b7a55'},
              {v:30,c:'#3b7a55'},{v:75,c:'#b8442e'},{v:50,c:'#c98a2c'},{v:42,c:'#3b7a55'},
            ]}/>
            <div className="row t-xs" style={{justifyContent:'space-between'}}>
              <span>EAC</span><span>Net</span><span>Site</span><span>Asset</span><span>DC</span><span>Sec</span><span>Wifi</span><span>CRM</span>
            </div>
          </div>
          <div className="box p-4 col gap-2" style={{flex:'1'}}>
            <div className="b">Status mix</div>
            <div className="row" style={{height:18,border:'1.5px solid var(--ink)',borderRadius:99,overflow:'hidden'}}>
              <div style={{flex:5,background:'var(--ok)'}}/>
              <div style={{flex:2,background:'var(--warn)'}}/>
              <div style={{flex:1,background:'var(--bad)'}}/>
            </div>
            <div className="row t-xs gap-3">
              <span><span className="dot ok"></span> 5 on track</span>
              <span><span className="dot warn"></span> 2 at risk</span>
              <span><span className="dot bad"></span> 1 delayed</span>
            </div>
            <div className="hr dash mt-2"/>
            <div className="t-xs"><b>3</b> overdue updates · &gt; 30 days</div>
            <div className="t-xs"><b>$8.2M</b> total budget at risk</div>
          </div>
        </div>

        <div className="row gap-3" style={{flexWrap:'wrap'}}>
          {portfolioRows.slice(0,4).map((r,i)=>{
            const [n,pm,b,e,v,s]=r
            return (
              <div key={i} className="box p-3 col gap-2" style={{flex:'1 1 calc(50% - 6px)',minWidth:220}}>
                <div className="row"><span className="b" style={{fontSize:13}}>{n}</span><div className="grow"/><Status status={s}/></div>
                <div className="row t-xs"><span className="t-mute">PM</span> <span>{pm}</span></div>
                <div className="row gap-3" style={{alignItems:'baseline'}}>
                  <div><div className="t-xs tt-up">EAC</div><div className="h3 b">{e}</div></div>
                  <div><div className="t-xs tt-up">Budget</div><div className="t-sm">{b}</div></div>
                  <div><div className="t-xs tt-up">Var</div><div className="t-sm" style={{color: v.startsWith('-')?'var(--ok)':'var(--warn)'}}>{v}</div></div>
                  <div className="grow"/>
                  <LineChart width={88} height={32} points={[40,52,55,60,68,72]} budgetLine={false}/>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
    </div>
    <Anno n="1" x={200} y={120} w="160px">Variance bar — instant outlier spot.</Anno>
    <Anno n="2" x={620} y={120} w="150px" side="l">Status mix doubles as legend.</Anno>
    <Anno n="3" x={240} y={350} w="160px">Sparkline per card — 6-month trend at a glance.</Anno>
  </div>
)

const PortfolioC = () => (
  <div className="wf pov-only pov-pd">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <div className="col" style={{flex:'0 0 44px',borderRight:'1.5px solid var(--ink)',background:'var(--paper-2)',padding:'10px 0',alignItems:'center',gap:14}}>
        <Logo size={10}/>
        {['◧','◇','◯','▤','✎','⤓','⚙'].map((s,i)=>(
          <div key={i} style={{
            width:28,height:28,borderRadius:6,
            display:'flex',alignItems:'center',justifyContent:'center',
            background: i===1?'var(--ink)':'transparent',
            color: i===1?'var(--paper)':'var(--ink-2)',
            border: i===1?'1.5px solid var(--ink)':'1.5px solid transparent',
            fontSize:14,
          }}>{s}</div>
        ))}
      </div>
      <div className="col grow">
        <div className="row p-3 gap-3" style={{borderBottom:'1.5px solid var(--ink)'}}>
          <span className="title h2">All Projects</span>
          <span className="pill tiny" style={{borderColor:'var(--ink-3)',color:'var(--ink-3)'}}>group: status ▾</span>
          <span className="pill tiny" style={{borderColor:'var(--ink-3)',color:'var(--ink-3)'}}>sort: variance ▾</span>
          <span className="pill tiny" style={{borderColor:'var(--ink-3)',color:'var(--ink-3)'}}>+ filter</span>
          <div className="grow"/>
          <div className="btn sm ghost">save view</div>
          <div className="btn sm ghost">⤓</div>
        </div>
        <div className="grow row" style={{alignItems:'stretch'}}>
          <div className="col grow p-3 gap-3" style={{overflow:'hidden'}}>
            <div className="col gap-2">
              <div className="row"><span className="dot bad"/><span className="b">Delayed (1)</span><div className="grow"/><span className="t-xs">avg var +7.7%</span></div>
              {portfolioRows.filter(r=>r[5]==='bad').map((r,i)=>(
                <div key={i} className="row gap-3" style={{padding:'4px 6px',background:'#fbe9e3',borderRadius:4}}>
                  <span className="b" style={{fontSize:12,flex:'1'}}>{r[0]}</span>
                  <span className="t-xs t-mute">{r[1]}</span>
                  <span className="t-xs">EAC {r[3]}</span>
                  <span className="t-xs" style={{color:'var(--bad)',fontWeight:700}}>{r[4]}</span>
                  <LineChart width={50} height={18} points={[20,30,40,55,70,90]} budgetLine={false}/>
                </div>
              ))}
            </div>
            <div className="col gap-2">
              <div className="row"><span className="dot warn"/><span className="b">At risk (2)</span><div className="grow"/><span className="t-xs">avg var +2.5%</span></div>
              {portfolioRows.filter(r=>r[5]==='warn').map((r,i)=>(
                <div key={i} className="row gap-3" style={{padding:'4px 6px',background:'#fdf5e3',borderRadius:4}}>
                  <span className="b" style={{fontSize:12,flex:'1'}}>{r[0]}</span>
                  <span className="t-xs t-mute">{r[1]}</span>
                  <span className="t-xs">EAC {r[3]}</span>
                  <span className="t-xs" style={{color:'var(--warn)'}}>{r[4]}</span>
                  <LineChart width={50} height={18} points={[30,40,45,52,55,58]} budgetLine={false}/>
                </div>
              ))}
            </div>
            <div className="col gap-2">
              <div className="row"><span className="dot ok"/><span className="b">On track (5)</span><div className="grow"/><span className="t-xs">avg var +0.7%</span></div>
              {portfolioRows.filter(r=>r[5]==='ok').slice(0,3).map((r,i)=>(
                <div key={i} className="row gap-3" style={{padding:'2px 6px'}}>
                  <span style={{fontSize:12,flex:'1'}}>{r[0]}</span>
                  <span className="t-xs t-mute">{r[1]}</span>
                  <span className="t-xs">{r[3]}</span>
                  <span className="t-xs" style={{color:'var(--ink-3)'}}>{r[4]}</span>
                </div>
              ))}
              <span className="t-xs t-mute" style={{paddingLeft:6}}>+ 2 more…</span>
            </div>
          </div>
          <div className="col p-4 gap-3" style={{flex:'0 0 220px',borderLeft:'1.5px solid var(--ink-3)',background:'var(--paper-2)'}}>
            <div className="b">Portfolio at a glance</div>
            <div className="t-xs tt-up">Total EAC</div>
            <div className="h2 title">$10.20M</div>
            <div className="t-xs">Budget $10.0M · <span style={{color:'var(--warn)'}}>+2.0%</span></div>
            <div className="hr dash"/>
            <div className="b t-sm">Trend</div>
            <LineChart width={180} height={60} points={[100,102,103,105,107,102]} budgetLine={true}/>
            <div className="hr dash"/>
            <div className="b t-sm">Compliance</div>
            <div className="status-bar" style={{height:7}}><i style={{width:'72%',background:'var(--warn)'}}/></div>
            <div className="t-xs">18 / 24 submitted on time · <span style={{color:'var(--bad)'}}>3 overdue</span></div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={70} y={120} w="130px">Icon-rail nav saves px in a list-heavy view.</Anno>
    <Anno n="2" x={400} y={140} w="170px">Grouped-by-status — risks bubble up first.</Anno>
    <Anno n="3" x={690} y={180} w="140px" side="l">Right rail is the "executive summary".</Anno>
  </div>
)

export { PortfolioA, PortfolioB, PortfolioC }
