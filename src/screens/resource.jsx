import React from 'react'
import { SVGFilters, Anno, Sidebar, Table, Logo } from './shared'

const monthsR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const ResourceA = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Resources" user="Sara" role="PM"/>
      <div className="col grow">
        <div className="row p-3 gap-3" style={{borderBottom:'1.5px solid var(--ink)'}}>
          <span className="t-xs">Resources /</span>
          <span className="b" style={{fontSize:13}}>EAC Refresh Programme</span>
          <div className="grow"/>
          <span className="t-xs">SG calendar · 21 wd/mo avg</span>
          <div className="btn sm ghost">+ role</div>
          <div className="btn sm ghost">copy ▶</div>
          <div className="btn sm primary">save</div>
        </div>

        <div className="p-4 col gap-3 grow" style={{overflow:'hidden'}}>
          <div className="row gap-3">
            <div className="box p-3 grow"><div className="t-xs tt-up">Roles</div><div className="h3 b mt-2">7</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Peak FTE</div><div className="h3 b mt-2">4.5</div><div className="t-xs">Jul '26</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Labour CTC</div><div className="h3 b mt-2">$390K</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Avg cost / mo</div><div className="h3 b mt-2">$55K</div></div>
          </div>

          <div className="box p-3 col gap-2 grow" style={{overflow:'hidden'}}>
            <div className="row">
              <span className="b">Headcount plan · people per month</span>
              <span className="t-xs t-mute" style={{marginLeft:8}}>(no rates · system calculates labour cost)</span>
              <div className="grow"/>
              <span className="t-xs">FTE supports decimals · e.g. 0.5</span>
            </div>
            <Table
              cols={['Role',...monthsR,'Total FTE-mo']}
              colWidths={`1.4fr ${monthsR.map(()=>'.55fr').join(' ')} .8fr`}
              rows={[
                ['Project Manager', 1,1,1,1,1,1,1,1,1,1,1,1, '12'],
                ['Tech Lead',       1,1,1,1,1,1,1,1,1,1,1,0.5,'11.5'],
                ['Senior Engineer', '–','–',1,1,2,2,2,2,2,1,1,'–','14'],
                ['Engineer',        '–','–','–',1,2,2,2,1,1,1,'–','–','10'],
                ['Network Engineer','–','–','–','–',1,1,1,0.5,'–','–','–','–','3.5'],
                ['QA',              '–','–','–','–','–',1,1,1,1,'–','–','–','4'],
                ['Admin / PMO',     0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,'6'],
              ].map((r,ri)=>{
                const cells = r.map((c,ci)=>{
                  if(ci===0) return <span style={{fontWeight:500,fontSize:12}}>{c}</span>
                  if(ci===13) return <span className="b" style={{textAlign:'right',width:'100%'}}>{c}</span>
                  const past = ci<=4
                  return (
                    <span style={{
                      width:'100%',textAlign:'center',
                      color:past?'var(--ink-3)':'var(--ink)',
                      background: !past && c!=='–'?'rgba(58,94,140,.06)':'transparent',
                      borderRadius:2, padding:'0 2px',
                      fontVariantNumeric:'tabular-nums',
                    }}>{c}</span>
                  )
                })
                cells.__rowStyle = {alignItems:'center'}
                return cells
              })}
            />
            <div className="hr dash mt-2"/>
            <div className="row gap-3 t-xs">
              <span><span className="dot mute"></span> past · locked</span>
              <span><span style={{display:'inline-block',width:9,height:9,background:'rgba(58,94,140,.2)',marginRight:4}}></span>editable</span>
              <div className="grow"/>
              <span><b>FTE-mo total: 61</b> · <b>$390K</b> labour CTC auto-calculated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={200} y={170} w="170px">PM never sees dollar rates — system multiplies for them.</Anno>
    <Anno n="2" x={550} y={300} w="170px" side="l">FTE decimals supported (0.5 = half-time).</Anno>
    <Anno n="3" x={550} y={400} w="180px" side="l">Copy-forward button duplicates a month forward.</Anno>
  </div>
)

const ResourceB = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Resources" user="Sara" role="PM"/>
      <div className="col grow">
      <div className="p-4 col gap-3 grow">
        <div className="row">
          <div className="title h2">Resource forecast</div>
          <span className="t-sm" style={{marginLeft:8}}>EAC Refresh Programme</span>
          <div className="grow"/>
          <div className="btn sm ghost">copy May → Aug</div>
          <div className="btn sm primary">+ role</div>
        </div>

        <div className="box p-3 col gap-2">
          <div className="row">
            <span className="b">FTE by role — over time</span>
            <div className="grow"/>
            <div className="row gap-3 t-xs">
              <span><i style={{width:10,height:10,background:'#1a1815',display:'inline-block',marginRight:4}}/>PM</span>
              <span><i style={{width:10,height:10,background:'#3a352f',display:'inline-block',marginRight:4}}/>Lead</span>
              <span><i style={{width:10,height:10,background:'#6b655e',display:'inline-block',marginRight:4}}/>Eng</span>
              <span><i style={{width:10,height:10,background:'#a39e96',display:'inline-block',marginRight:4}}/>QA</span>
            </div>
          </div>
          <svg width="700" height="140" style={{display:'block'}}>
            <line x1="30" y1="120" x2="690" y2="120" stroke="#1a1815"/>
            <line x1="30" y1="10" x2="30" y2="120" stroke="#1a1815"/>
            <rect x="30" y="10" width="220" height="110" fill="rgba(0,0,0,.04)"/>
            <text x="135" y="22" textAnchor="middle" fontFamily="Caveat" fontSize="14" fill="#6b655e">past · locked</text>
            {(()=>{
              const layers = [
                {h:[0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5], c:'#a39e96'},
                {h:[1,1,1,1,1,1,1,1,1,1,1,1], c:'#6b655e'},
                {h:[0,0,1,2,2.5,2.5,2.5,2,1.5,1,0,0], c:'#3a352f'},
                {h:[0,0,0,0,.5,1,1,1,1,0,0,0], c:'#1a1815'},
              ]
              let prev = monthsR.map(()=>0)
              const out=[]
              layers.forEach((L,li)=>{
                const top = L.h.map((v,i)=>prev[i]+v)
                const x = i => 30+(i)*55
                const y = v => 120 - v*18
                const path = `M${x(0)} ${y(prev[0])} ` +
                  L.h.map((_,i)=>`L${x(i)} ${y(top[i])}`).join(' ') +
                  ` L${x(11)} ${y(prev[11])} ` +
                  L.h.map((_,i)=>`L${x(11-i)} ${y(prev[11-i])}`).join(' ') + ' Z'
                out.push(<path key={li} d={path} fill={L.c} opacity="0.95"/>)
                prev = top
              })
              return out
            })()}
            {monthsR.map((m,i)=>(
              <text key={i} x={30+i*55} y={134} textAnchor="middle" fontFamily="Kalam" fontSize="9" fill={i<4?'#a39e96':'#6b655e'}>{m}</text>
            ))}
          </svg>
        </div>

        <div className="box p-3 col gap-2 grow">
          <div className="row">
            <span className="b">Roles · 7</span>
            <div className="grow"/>
            <span className="t-xs">tap a cell to edit headcount · system computes cost</span>
          </div>
          <div className="hr thin"/>
          {[
            {r:'Project Manager', f:[1,1,1,1,1,1], cost:'$72K'},
            {r:'Tech Lead',       f:[1,1,1,1,1,0.5], cost:'$68K'},
            {r:'Senior Engineer', f:[2,2,2,2,2,1], cost:'$110K'},
            {r:'Engineer',        f:[2,2,2,1,1,1], cost:'$66K'},
          ].map((row,i)=>(
            <div key={i} className="row gap-3" style={{padding:'2px 0'}}>
              <span style={{flex:'0 0 130px',fontSize:12,fontWeight:500}}>{row.r}</span>
              <div className="row" style={{flex:1,gap:2,alignItems:'flex-end',height:24}}>
                {row.f.map((v,j)=>(
                  <div key={j} style={{flex:1,height:`${v*30+8}%`,background:'var(--ink)',borderRadius:'2px 2px 0 0',position:'relative'}}>
                    <span style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',fontSize:9,fontFamily:'Kalam',color:'var(--ink-3)'}}>{v}</span>
                  </div>
                ))}
              </div>
              <span style={{flex:'0 0 50px',textAlign:'right',fontWeight:700,fontSize:12}}>{row.cost}</span>
            </div>
          ))}
          <div className="t-xs t-mute mt-2">+ 3 more roles…</div>
        </div>
      </div>
    </div>
    </div>
    <Anno n="1" x={350} y={140} w="180px">Stacked area shows the team scaling up &amp; down at a glance.</Anno>
    <Anno n="2" x={500} y={350} w="160px" side="l">Per-role mini bars — drag-style affordance for headcount.</Anno>
  </div>
)

const ResourceC = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters/>
    <div className="col full">
      <div className="row p-3 gap-3" style={{borderBottom:'1.5px solid var(--ink)',background:'var(--paper-2)'}}>
        <Logo size={12}/>
        <span className="t-xs">/ EAC Refresh /</span>
        <span className="b" style={{fontSize:13}}>Resource plan</span>
        <div className="grow"/>
        <div className="btn sm ghost">⚙ rates &amp; calendar</div>
        <div className="btn sm primary">+ role</div>
      </div>

      <div className="row grow" style={{alignItems:'stretch'}}>
        <div className="col p-3 gap-2" style={{flex:'0 0 220px',borderRight:'1.5px solid var(--ink-3)',background:'var(--paper-2)'}}>
          <div className="t-xs tt-up">Roles</div>
          {[
            ['Project Manager','1.0 FTE','$72K'],
            ['Tech Lead','0.96 FTE','$68K'],
            ['Senior Engineer','1.2 FTE','$110K', true],
            ['Engineer','0.83 FTE','$66K'],
            ['Network Engineer','0.29 FTE','$22K'],
            ['QA','0.33 FTE','$28K'],
            ['Admin / PMO','0.5 FTE','$24K'],
          ].map((r,i)=>(
            <div key={i} className="box p-3 col gap-1" style={{
              background:r[3]?'var(--paper)':'transparent',
              borderColor:r[3]?'var(--ink)':'var(--ink-3)',
            }}>
              <div className="row"><span className="b" style={{fontSize:12}}>{r[0]}</span><div className="grow"/><span className="t-xs t-mute">{r[2]}</span></div>
              <div className="row gap-2 t-xs"><span>{r[1]}</span><div className="grow"/><span>edit ▸</span></div>
            </div>
          ))}
        </div>

        <div className="col grow p-4 gap-3">
          <div className="row">
            <span className="title h2">Senior Engineer</span>
            <span className="t-sm" style={{marginLeft:8}}>· 14 FTE-mo · $110K total</span>
            <div className="grow"/>
            <div className="btn sm ghost">duplicate row</div>
          </div>

          <div className="box p-3 col gap-2">
            <div className="row">
              <span className="b">Monthly headcount</span>
              <div className="grow"/>
              <span className="t-xs">drag pattern → ▸</span>
            </div>
            <div className="row" style={{gap:4}}>
              {monthsR.map((m,i)=>{
                const past = i<4
                const v = ['–','–',1,1,2,2,2,2,2,1,1,'–'][i]
                return (
                  <div key={m} className="col" style={{flex:1,alignItems:'center',gap:3}}>
                    <span className="t-xs" style={{color:past?'var(--ink-3)':'var(--ink-2)'}}>{m}</span>
                    <div style={{
                      width:'100%',height:34,borderRadius:4,
                      border:past?'1px dashed var(--ink-3)':'1.5px solid var(--ink)',
                      background:past?'var(--paper-3)':(v==='–'?'var(--paper)':'rgba(58,94,140,.08)'),
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontFamily:'Caveat',fontSize:18,fontWeight:700,
                      color:past?'var(--ink-3)':'var(--ink)',
                    }}>{v}</div>
                    <span className="t-xs t-mute">{past?'$0':v==='–'?'$0':(v*22*0.4).toFixed(1)+'K'}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="row gap-3">
            <div className="box p-3 col gap-1 grow">
              <div className="t-xs tt-up">Cost formula</div>
              <div className="t-sm">2 × 22 working-days × <b>S$400</b> rate = <b>S$17.6K</b> / month</div>
              <div className="t-xs t-mute">rates locked, managed by Finance</div>
            </div>
            <div className="box p-3 col gap-1" style={{flex:'0 0 220px'}}>
              <div className="t-xs tt-up">Quick add</div>
              <div className="row gap-2">
                <span className="input" style={{flex:'1'}}>+1</span>
                <span className="input" style={{flex:'1'}}>×3 mo</span>
                <div className="btn sm primary">apply</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={130} y={250} w="160px">Master/detail: left = roles, right = pattern for the selected role.</Anno>
    <Anno n="2" x={500} y={290} w="180px" side="l">Big tap targets — friendlier than a wide spreadsheet grid.</Anno>
  </div>
)

export { ResourceA, ResourceB, ResourceC }
