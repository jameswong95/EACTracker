import React from 'react'
import { SVGFilters, Anno, Sidebar, BarChart, Logo, Status } from './shared'

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const EacA = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Recognition" user="Sara" role="PM"/>
      <div className="col grow">
        <div className="row p-3 gap-3" style={{borderBottom:'1.5px solid var(--ink)'}}>
          <span className="t-xs">EAC /</span>
          <span className="b" style={{fontSize:13}}>EAC Refresh Programme</span>
          <div className="grow"/>
          <span className="pill tiny">past · locked</span>
          <span className="pill tiny solid">future · editable</span>
          <div className="btn sm ghost">↺ recalc</div>
          <div className="btn sm primary">save</div>
        </div>

        <div className="p-4 col gap-3 grow" style={{overflow:'hidden'}}>
          <div className="row gap-3">
            <div className="box p-3 grow"><div className="t-xs tt-up">Actual</div><div className="h3 b">$540K</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Committed</div><div className="h3 b">$180K</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Labour ETC</div><div className="h3 b">$390K</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Other ETC</div><div className="h3 b">$130K</div></div>
            <div className="box p-3 grow fill"><div className="t-xs tt-up">= EAC</div><div className="h3 title">$1.24M</div></div>
          </div>

          <div className="box p-3 col gap-2 grow" style={{overflow:'hidden'}}>
            <div className="row">
              <span className="b">Time-phased — 2026</span>
              <span className="t-xs t-mute" style={{marginLeft:8}}>· past 4mo locked · grey · future editable · white</span>
              <div className="grow"/>
              <span className="t-xs">$ thousands</span>
            </div>
            <div className="tbl" style={{gridTemplateColumns:`1.6fr ${months.map(()=>'.6fr').join(' ')} .9fr`}}>
              {['Row',...months,'Total'].map((c,i)=><div key={i} className="th">{c}</div>)}
              {[
                ['Actual (SAP)',  ...[' 120',' 140',' 130',' 150','—','—','—','—','—','—','—','—'],'540'],
                ['Committed',     ...['  20','  30','  40','  20','  20','  20','  10','  10','  10','—','—','—'],'180'],
                ['Labour ETC',    ...['—','—','—','—','  55','  60','  60','  55','  50','  55','  55','—'],'390'],
                ['Other ETC',     ...['—','—','—','—','  18','  20','  20','  18','  18','  18','  18','—'],'130'],
                ['= Monthly',     ...[' 120',' 170',' 170',' 170','  93',' 100','  90','  83','  78','  73','  73','—'],'1240'],
              ].map((r,ri)=>
                r.map((c,ci)=>{
                  if(ci===0) return <div key={`${ri}-${ci}`} className="td">{c}</div>
                  if(ci===13) return <div key={`${ri}-${ci}`} className="td" style={ri===4?{fontWeight:700}:{}}>{c}</div>
                  const past = ci<=4
                  return (
                    <div key={`${ri}-${ci}`} className="td" style={ri===4?{background:'var(--paper-2)',fontWeight:700}:{}}>
                      <span style={{
                        width:'100%',textAlign:'right',
                        color: past?'var(--ink-3)':(c==='—'?'var(--ink-3)':'var(--ink)'),
                        fontStyle: ri>=2 && ci===5 ? 'italic':'normal',
                        background: ri>=2 && ci>=5 && ci<=11 ? 'rgba(58,94,140,.06)' : 'transparent',
                        padding:'0 4px',borderRadius:2,
                        fontVariantNumeric:'tabular-nums',
                      }}>{c}</span>
                    </div>
                  )
                })
              )}
            </div>
            <div className="row mt-2 gap-3">
              <div className="t-xs"><span className="dot mute"/> grey = SAP locked</div>
              <div className="t-xs"><span style={{display:'inline-block',width:9,height:9,background:'rgba(58,94,140,.2)',marginRight:4}}/>blue = editable forecast</div>
              <div className="grow"/>
              <div className="t-xs">override past? <span className="b" style={{color:'var(--bad)'}}>requires reason</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={300} y={210} w="180px">Past months locked &amp; greyed — never editable except by override with note.</Anno>
    <Anno n="2" x={650} y={280} w="160px" side="l">Editable forecast cells get a soft blue tint.</Anno>
  </div>
)

const EacB = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Recognition" user="Sara" role="PM"/>
      <div className="col grow">
      <div className="p-4 col gap-3 grow">
        <div className="row">
          <div className="title h2">EAC — EAC Refresh Programme</div>
          <div className="grow"/>
          <span className="pill warn">+3.3% over budget</span>
        </div>

        <div className="box p-3 col gap-2">
          <div className="row">
            <span className="b">Cumulative spend — actuals (past) + forecast (future)</span>
            <div className="grow"/>
            <span className="t-xs">drag forecast points to adjust</span>
          </div>
          <svg width="700" height="160" style={{display:'block'}}>
            <line x1="30" y1="140" x2="690" y2="140" stroke="#1a1815" strokeWidth="1.2"/>
            <line x1="30" y1="10" x2="30" y2="140" stroke="#1a1815" strokeWidth="1.2"/>
            <line x1="30" y1="42" x2="690" y2="42" stroke="#b8442e" strokeWidth="1.2" strokeDasharray="5 4"/>
            <text x="690" y="38" textAnchor="end" fontFamily="Kalam" fontSize="10" fill="#b8442e">Budget $1.20M</text>
            <rect x="30" y="10" width="220" height="130" fill="rgba(0,0,0,.05)"/>
            <text x="135" y="22" textAnchor="middle" fontFamily="Caveat" fontSize="14" fill="#6b655e">past · SAP locked</text>
            <text x="470" y="22" textAnchor="middle" fontFamily="Caveat" fontSize="14" fill="#6b655e">forecast · editable</text>
            <path d="M30 130 L70 116 L110 96 L150 80 L190 64 L250 50"
                  fill="none" stroke="#1a1815" strokeWidth="2"/>
            {[130,116,96,80,64,50].map((y,i)=>(
              <circle key={i} cx={30+i*40} cy={y} r="2.5" fill="#1a1815"/>
            ))}
            <path d="M250 50 L300 40 L350 32 L400 28 L450 24 L500 22 L550 20 L600 18 L650 16"
                  fill="none" stroke="#3a5e8c" strokeWidth="2" strokeDasharray="5 3"/>
            {[40,32,28,24,22,20,18,16].map((y,i)=>(
              <circle key={i} cx={300+i*50} cy={y} r="3.2" fill="#fdfcf8" stroke="#3a5e8c" strokeWidth="1.6"/>
            ))}
            {months.map((m,i)=>(
              <text key={i} x={30+i*55} y={155} textAnchor="middle" fontFamily="Kalam" fontSize="9" fill="#6b655e">{m}</text>
            ))}
            <circle cx="450" cy="24" r="9" fill="none" stroke="#3a5e8c" strokeWidth="1.5" strokeDasharray="3 3"/>
            <rect x="430" y="-2" width="80" height="20" rx="3" fill="#fdfcf8" stroke="#1a1815" strokeWidth="1"/>
            <text x="470" y="11" textAnchor="middle" fontFamily="Kalam" fontSize="10">$1.10M cum.</text>
          </svg>
        </div>

        <div className="row gap-3 grow">
          <div className="box p-3 col gap-2 grow">
            <div className="row">
              <span className="b">Forecast inputs · next 6 months</span>
              <div className="grow"/>
              <div className="btn sm ghost">↻ recalc</div>
            </div>
            <div className="row" style={{flexWrap:'wrap',gap:8}}>
              {['May','Jun','Jul','Aug','Sep','Oct'].map(m=>(
                <div key={m} className="box p-3 col gap-1" style={{flex:'1 1 calc(33% - 6px)',minWidth:120,background:'rgba(58,94,140,.04)'}}>
                  <div className="t-xs tt-up">{m} '26</div>
                  <div className="row gap-2">
                    <div className="input" style={{flex:1,fontWeight:700}}>$ 93K</div>
                    <span className="t-xs t-mute">ETC</span>
                  </div>
                  <div className="t-xs t-mute">labour $73K · other $20K</div>
                </div>
              ))}
            </div>
          </div>
          <div className="box p-3 col gap-2" style={{flex:'0 0 220px'}}>
            <span className="b">Override past month?</span>
            <div className="t-xs">SAP locks past months. Overriding requires a reason and director sign-off.</div>
            <div className="input" style={{height:24}}>Apr · reason…</div>
            <div className="btn sm ghost" style={{justifyContent:'center'}}>Request override</div>
            <div className="hr dash mt-2"/>
            <div className="t-xs t-mute">Last SAP import: 8 May · 142 lines</div>
          </div>
        </div>
      </div>
    </div>
    </div>
    <Anno n="1" x={350} y={130} w="200px">Chart-forward: drag the future points to re-forecast. Live numbers below update.</Anno>
    <Anno n="2" x={130} y={330} w="170px">Per-month ETC cards — bigger hit targets than a wide grid.</Anno>
  </div>
)

const EacC = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters/>
    <div className="col full">
      <div className="row p-3 gap-3" style={{borderBottom:'1.5px solid var(--ink)',background:'var(--paper-2)'}}>
        <Logo size={12}/><span className="t-xs">/ EAC Refresh /</span>
        <span className="b" style={{fontSize:13}}>EAC editor</span>
        <Status status="warn"/>
        <div className="grow"/>
        <div className="row gap-2">
          {['Time-phased','Cumulative','Variance'].map((t,i)=>(
            <div key={i} className="pill tiny" style={{
              background:i===0?'var(--ink)':'transparent',
              color:i===0?'var(--paper)':'var(--ink-2)',
              borderColor:i===0?'var(--ink)':'var(--ink-3)',
            }}>{t}</div>
          ))}
        </div>
        <div className="btn sm ghost">↶ undo</div>
        <div className="btn sm primary">save</div>
      </div>

      <div className="row grow" style={{alignItems:'stretch'}}>
        <div className="col p-3 gap-2" style={{flex:'0 0 180px',borderRight:'1.5px solid var(--ink-3)',background:'var(--paper-2)'}}>
          <div className="t-xs tt-up">EAC components</div>
          {[
            ['Actual (SAP)', '$540K', 'mute'],
            ['Committed',    '$180K', 'info'],
            ['Labour ETC',   '$390K', 'ok'],
            ['Other ETC',    '$130K', 'warn'],
          ].map((c,i)=>(
            <div key={i} className="box p-3 col gap-1" style={{background:i===2?'var(--paper)':'transparent',borderColor:i===2?'var(--ink)':'var(--ink-3)'}}>
              <div className="row"><span className="dot" style={{background:`var(--${c[2]==='mute'?'ink-3':c[2]==='info'?'info':c[2]==='ok'?'ok':'warn'})`}}/><span className="t-xs">{c[0]}</span></div>
              <div className="b">{c[1]}</div>
            </div>
          ))}
          <div className="hr dash"/>
          <div className="t-xs tt-up">Total EAC</div>
          <div className="h2 title">$1.24M</div>
          <div className="t-xs" style={{color:'var(--warn)'}}>+3.3% over</div>
          <div className="grow"/>
          <div className="status-bar"><i style={{width:'103%',background:'var(--warn)'}}/></div>
          <div className="t-xs t-mute">budget · EAC</div>
        </div>

        <div className="col grow p-4 gap-3">
          <div className="row">
            <span className="b">Labour ETC · monthly</span>
            <span className="t-xs t-mute" style={{marginLeft:8}}>(highlighted in left rail)</span>
            <div className="grow"/>
            <div className="btn sm ghost">copy forward →</div>
          </div>

          <div className="box p-3">
            <BarChart width={500} height={70} bars={[
              {v:0,c:'#ebe6dc'},{v:0,c:'#ebe6dc'},{v:0,c:'#ebe6dc'},{v:0,c:'#ebe6dc'},
              {v:55,c:'#1a1815'},{v:60,c:'#1a1815'},{v:60,c:'#1a1815'},{v:55,c:'#1a1815'},
              {v:50,c:'#1a1815'},{v:55,c:'#1a1815'},{v:55,c:'#1a1815'},{v:0,c:'#ebe6dc'},
            ]}/>
            <div className="row t-xs" style={{justifyContent:'space-between',marginTop:4}}>
              {months.map((m,i)=>(
                <span key={i} style={{flex:1,textAlign:'center',color:i<4?'var(--ink-3)':'var(--ink)'}}>{m}</span>
              ))}
            </div>
          </div>

          <div className="box p-3 col gap-2">
            <div className="row t-xs">
              <span style={{flex:'1.4'}}>Month</span>
              {months.map(m=>(<span key={m} style={{flex:'.7',textAlign:'center'}}>{m}</span>))}
            </div>
            <div className="row">
              <span style={{flex:'1.4',fontSize:12}}>Labour ETC ($K)</span>
              {months.map((m,i)=>{
                const past = i<4
                const v = past?'—':[55,60,60,55,50,55,55,'—'][i-4]
                return (
                  <span key={m} style={{
                    flex:'.7',
                    height:22,margin:'0 1px',
                    borderRadius:3,
                    border:past?'1px dashed var(--ink-3)':'1.5px solid var(--ink)',
                    background:past?'var(--paper-3)':'var(--paper)',
                    color:past?'var(--ink-3)':'var(--ink)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontFamily:'Kalam',fontSize:11,
                    fontVariantNumeric:'tabular-nums',
                  }}>{v}</span>
                )
              })}
            </div>
            <div className="t-xs t-mute mt-2">↑ click any white cell to edit · past cells locked (SAP)</div>
          </div>

          <div className="row gap-3">
            <div className="box p-3 col gap-1 grow">
              <div className="t-xs tt-up">Auto-calc preview</div>
              <div className="t-sm">2.5 FTE × 22 days × $230/day = <span className="b">$12.65K</span> for Jul</div>
            </div>
            <div className="box p-3 col gap-1 grow">
              <div className="t-xs tt-up">Variance impact</div>
              <div className="t-sm">+10K to May raises EAC by 0.8% → still amber</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={100} y={250} w="160px">Left rail = formula components, click to drill into one.</Anno>
    <Anno n="2" x={500} y={310} w="180px" side="l">Mini bar chart of the active component above the editable row.</Anno>
  </div>
)

export { EacA, EacB, EacC }
