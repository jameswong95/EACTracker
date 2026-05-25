import React from 'react'
import { SVGFilters, Anno, Status, Table, Sidebar, Logo, LineChart } from './shared'

const monthsRR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const RevRecConcept = () => (
  <div className="wf pov-only pov-fin">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="SAP Import" user="L. Cheng" role="Finance"/>
      <div className="col grow">
      <div className="row p-3 gap-3" style={{borderBottom:'1.5px solid var(--ink)',background:'var(--paper-2)'}}>
        <Logo size={12}/>
        <span className="t-xs">/ Finance · internal /</span>
        <span className="b" style={{fontSize:13}}>How recognition works</span>
        <div className="grow"/>
        <span className="pill tiny solid">applies to all projects · FY26</span>
      </div>

      <div className="p-5 col gap-3 grow">
        <div className="row">
          <div className="title h2">Costs drive recognition</div>
          <div className="grow"/>
          <span className="t-xs t-mute">PMs don't see this — they work in EAC. This is what happens behind the scenes.</span>
        </div>

        <div className="row gap-4 grow" style={{alignItems:'stretch'}}>
          <div className="box p-4 col gap-3" style={{flex:'1.4',background:'#fdf9ec'}}>
            <div className="row">
              <span className="pill tiny solid">how</span>
              <span className="b" style={{fontSize:14}}>Recognition formula</span>
            </div>
            <div className="t-sm">Each month, recognised revenue is the share of contract value matching the share of cost incurred:</div>
            <div className="box p-3 col gap-1" style={{background:'var(--paper)'}}>
              <div className="title h2" style={{textAlign:'center'}}>
                (cost to date ÷ EAC) × contract value
              </div>
              <div className="t-xs t-mute" style={{textAlign:'center'}}>cost to date = actual + committed · EAC includes the ETC the PM forecasts</div>
            </div>

            <div className="box fill p-3 col gap-2">
              <div className="t-xs tt-up">Smooth revenue curve</div>
              <svg width="100%" height="90" viewBox="0 0 300 90" preserveAspectRatio="none">
                <line x1="10" y1="78" x2="290" y2="78" stroke="#1a1815" strokeWidth="1.2"/>
                <path d="M10 76 Q80 60 150 38 T290 12"
                      fill="none" stroke="#3b7a55" strokeWidth="2"/>
                {[[10,76],[80,55],[150,38],[220,22],[290,12]].map(([x,y],i)=>(
                  <circle key={i} cx={x} cy={y} r="2.6" fill="#3b7a55"/>
                ))}
                <text x="160" y="58" fontFamily="Caveat" fontSize="12" fill="#3b7a55">monthly · smooth</text>
              </svg>
              <div className="t-xs t-mute">a slice every month as costs land — no waiting for customer sign-off</div>
            </div>
          </div>

          <div className="box p-4 col gap-3 grow">
            <div className="row">
              <span className="pill tiny">why</span>
              <span className="b" style={{fontSize:14}}>The catch</span>
            </div>
            <div className="t-sm">Costs drive the calculation. If EAC isn't refreshed monthly, we keep recognising revenue
              while overruns silently eat margin. Once budget is gone, there's nothing left to recognise
              — PNL flips negative in the closing months.</div>
            <div className="hr dash"/>
            <div className="t-xs tt-up">PFMS's job</div>
            <ul style={{margin:'0 0 0 16px',padding:0,fontSize:13,lineHeight:1.55}}>
              <li>Make monthly EAC refresh effortless</li>
              <li>Auto-cap recognition at the planned curve when EAC drifts</li>
              <li>Surface drift early to PD before close</li>
            </ul>
            <div className="grow"/>
            <div className="btn sm primary" style={{justifyContent:'center'}}>→ see the monthly guardrail</div>
          </div>
        </div>
      </div>
    </div>
    </div>
    <Anno n="1" x={420} y={250} w="200px">One formula, every project. PMs never see this — they work in EAC.</Anno>
    <Anno n="2" x={830} y={300} w="180px" side="l">If EAC isn't refreshed, the formula keeps running on stale numbers — hence the monthly discipline.</Anno>
  </div>
)

const RevRecPlan = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Recognition" user="Sara" role="PM"/>
      <div className="col grow">
        <div className="row p-3 gap-3" style={{borderBottom:'1.5px solid var(--ink)'}}>
          <span className="t-xs">Rev. recognition /</span>
          <span className="b" style={{fontSize:13}}>EAC Refresh Programme · initial plan</span>
          <div className="grow"/>
          <span className="pill tiny">v2 · locked baseline</span>
          <div className="btn sm ghost">↻ re-baseline</div>
          <div className="btn sm primary">save plan</div>
        </div>

        <div className="p-4 col gap-3 grow" style={{overflow:'hidden'}}>
          <div className="row gap-3">
            <div className="box p-3 grow"><div className="t-xs tt-up">Contract value</div><div className="h3 b mt-2">$1.20M</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Duration</div><div className="h3 b mt-2">3 yrs</div></div>
            <div className="box p-3 grow"><div className="t-xs tt-up">Baseline by</div><div className="h3 b mt-2">Sara · 12 May</div></div>
            <div className="box p-3 grow fill"><div className="t-xs tt-up">Σ planned recog.</div><div className="h3 title mt-2">$1.20M</div></div>
          </div>

          <div className="box p-3 col gap-2">
            <div className="row">
              <span className="b">Planned recognition by year &amp; quarter</span>
              <span className="t-xs t-mute" style={{marginLeft:8}}>· anchor for monthly EAC discipline</span>
              <div className="grow"/>
              <span className="t-xs">$ thousands</span>
            </div>
            <Table
              cols={['Year','Phase','Q1','Q2','Q3','Q4','Year total','% of contract']}
              colWidths=".7fr 1.6fr .7fr .7fr .7fr .7fr .9fr .9fr"
              rows={[
                ["Y1 '25", 'mobilisation · wave 1',  '120','180','220','280','800','67%'],
                ["Y2 '26", 'wave 2 + integration',    '90','60','50','—','200','17%'],
                ["Y3 '27", 'wave 3 + close-out',      '60','60','40','40','200','17%'],
              ].map((r,ri)=>r.map((c,ci)=>{
                if(ci<=1) return c
                if(ci===7) return <span className="b">{c}</span>
                if(ci===6) return <span className="b" style={{textAlign:'right',width:'100%'}}>{c}</span>
                return <span style={{textAlign:'right',width:'100%',fontVariantNumeric:'tabular-nums'}}>{c}</span>
              }))}
            />
          </div>

          <div className="row gap-3 grow">
            <div className="box p-3 col gap-2 grow">
              <div className="row">
                <span className="b">Cumulative plan — revenue vs expected cost</span>
                <div className="grow"/>
                <div className="row gap-3 t-xs">
                  <span><i style={{display:'inline-block',width:14,height:2,background:'#1a1815',verticalAlign:'middle'}}/> planned revenue</span>
                  <span><i style={{display:'inline-block',width:14,height:0,borderTop:'1.5px dashed #c98a2c',verticalAlign:'middle'}}/> expected cost</span>
                </div>
              </div>
              <svg width="100%" height="160" viewBox="0 0 560 160" preserveAspectRatio="none">
                <line x1="30" y1="140" x2="550" y2="140" stroke="#1a1815" strokeWidth="1.2"/>
                <line x1="30" y1="10" x2="30" y2="140" stroke="#1a1815" strokeWidth="1.2"/>
                <path d="M30 140 L80 120 L130 95 L180 75 L230 58 L280 50 L330 45 L380 40 L430 35 L480 30 L530 25"
                      fill="none" stroke="#1a1815" strokeWidth="2"/>
                <path d="M30 140 L80 125 L130 105 L180 88 L230 70 L280 60 L330 55 L380 48 L430 42 L480 36 L530 30"
                      fill="none" stroke="#c98a2c" strokeWidth="1.6" strokeDasharray="5 4"/>
                {[180,330].map((x,i)=>(
                  <line key={i} x1={x} y1={10} x2={x} y2={140} stroke="#6b655e" strokeWidth=".8" strokeDasharray="2 4"/>
                ))}
                <text x="100" y="155" fontFamily="Kalam" fontSize="10" fill="#6b655e" textAnchor="middle">Y1 '25</text>
                <text x="255" y="155" fontFamily="Kalam" fontSize="10" fill="#6b655e" textAnchor="middle">Y2 '26</text>
                <text x="430" y="155" fontFamily="Kalam" fontSize="10" fill="#6b655e" textAnchor="middle">Y3 '27</text>
                <text x="540" y="22" fontFamily="Caveat" fontSize="13" fill="#1a1815" textAnchor="end">$1.20M</text>
              </svg>
            </div>

            <div className="box p-3 col gap-2" style={{flex:'0 0 240px'}}>
              <span className="b">Why this matters</span>
              <div className="t-sm">Planned recognition is the rail. Each month's actual recognition (= cost × multiplier) is compared against this curve — if you're ahead, the system flags over-recognition risk before you close.</div>
              <div className="hr dash mt-2"/>
              <div className="t-xs tt-up">Inputs needed</div>
              <ul style={{margin:'4px 0 0 16px',padding:0,fontSize:12,lineHeight:1.5}}>
                <li>resource plan + standard rates</li>
                <li>equipment / materials phasing</li>
                <li>sub-con commitments</li>
              </ul>
              <div className="hr dash"/>
              <div className="t-xs t-mute">Smaller projects: 1-page baseline.<br/>Larger projects: per-phase split.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={420} y={205} w="200px">Plan up-front. Director signs once. This is the rail every monthly EAC measures against.</Anno>
    <Anno n="2" x={680} y={400} w="170px" side="l">Plan curve + expected cost curve — gap = expected margin per period.</Anno>
  </div>
)

const RevRecMonthly = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Recognition" user="Sara" role="PM"/>
      <div className="col grow">
      <div className="p-4 col gap-3 grow">
        <div className="row">
          <div className="title h2">Recognition · May '26</div>
          <span className="t-xs t-mute">· EAC Refresh Programme · main WBS <span className="mono">123456789/001-1</span></span>
          <Status status="warn"/>
          <div className="grow"/>
          <div className="btn sm ghost">save draft</div>
          <div className="btn sm primary">post recognition</div>
        </div>

        <div className="row gap-3">
          <div className="box p-3 grow"><div className="t-xs tt-up">May · recog. cost</div><div className="h3 b mt-2">$92K</div><div className="t-xs t-mute">Σ sub-jobs</div></div>
          <div className="box p-3 grow"><div className="t-xs tt-up">May · margin</div><div className="h3 b mt-2">$14K</div><div className="t-xs t-mute">15.2% blended</div></div>
          <div className="box p-3 grow fill"><div className="t-xs tt-up">= May · revenue</div><div className="h3 title mt-2">$106K</div></div>
          <div className="box p-3 grow"><div className="t-xs tt-up">Cum. revenue</div><div className="h3 b mt-2">$697K</div><div className="t-xs t-mute">YTD</div></div>
          <div className="box p-3 grow"><div className="t-xs tt-up">Contract remaining</div><div className="h3 b mt-2">$503K</div><div className="t-xs t-mute">$1.20M − cum.</div></div>
        </div>

        <div className="box p-3 col gap-2">
          <div className="row">
            <span className="b">May '26 · per sub-job</span>
            <span className="t-xs t-mute" style={{marginLeft:8}}>· PM enters recognised cost + margin · revenue auto-calculates</span>
            <div className="grow"/>
            <div className="btn sm ghost">copy from Apr</div>
            <div className="btn sm ghost">↻ recalc</div>
          </div>
          <Table
            cols={[
              'Sub-job',
              <span>Budget <span className="t-xs t-mute">·SAP</span></span>,
              <span>EAC <span className="t-xs t-mute">·calc</span></span>,
              <span>Cost CTD <span className="t-xs t-mute">·calc</span></span>,
              <span>Recog. cost <span className="t-xs t-mute">·input</span></span>,
              <span>Margin <span className="t-xs t-mute">·input</span></span>,
              <span>= Revenue <span className="t-xs t-mute">·calc</span></span>,
              'Margin %',
            ]}
            colWidths="2fr .8fr .8fr .9fr 1fr 1fr 1fr .7fr"
            rows={[
              ['  ↳ /001-1-1 · Project management',
                '$180', '$182', '$ 84',
                <span className="input" style={{minWidth:60,fontWeight:700,background:'rgba(58,94,140,.06)'}}>$ 12K</span>,
                <span className="input" style={{minWidth:50,fontWeight:700,background:'rgba(58,94,140,.06)'}}>$ 2K</span>,
                <span className="b" style={{fontVariantNumeric:'tabular-nums'}}>$ 14K</span>,
                <span style={{color:'var(--ok)'}}>16.7%</span>,
              ],
              ['  ↳ /001-1-2 · Main-con',
                '$820', '$876', '$556',
                <span className="input" style={{minWidth:60,fontWeight:700,background:'rgba(58,94,140,.06)'}}>$ 62K</span>,
                <span className="input" style={{minWidth:50,fontWeight:700,background:'rgba(58,94,140,.06)'}}>$ 8K</span>,
                <span className="b" style={{fontVariantNumeric:'tabular-nums'}}>$ 70K</span>,
                <span style={{color:'var(--warn)'}}>12.9%</span>,
              ],
              ['  ↳ /001-1-3 · Misc',
                '$200', '$182', '$ 80',
                <span className="input" style={{minWidth:60,fontWeight:700,background:'rgba(58,94,140,.06)'}}>$ 18K</span>,
                <span className="input" style={{minWidth:50,fontWeight:700,background:'rgba(58,94,140,.06)'}}>$ 4K</span>,
                <span className="b" style={{fontVariantNumeric:'tabular-nums'}}>$ 22K</span>,
                <span style={{color:'var(--ok)'}}>22.2%</span>,
              ],
              ['Σ this month',
                '$1,200', '$1,240', '$720',
                <span className="b" style={{fontVariantNumeric:'tabular-nums'}}>$ 92K</span>,
                <span className="b" style={{fontVariantNumeric:'tabular-nums'}}>$ 14K</span>,
                <span className="b title" style={{fontVariantNumeric:'tabular-nums'}}>$106K</span>,
                <span className="b">15.2%</span>,
              ],
            ].map((r,ri)=>{
              const arr = r.map((c,ci)=>{
                if(ci===0) return <span style={{fontWeight:ri===3?700:500,fontSize:12,fontFamily:ri===3?undefined:'JetBrains Mono,monospace'}}>{c}</span>
                if(typeof c === 'string') return <span style={{textAlign:'right',width:'100%',display:'block',fontVariantNumeric:'tabular-nums',color:ri<3?'var(--ink-2)':'var(--ink)'}}>{c}</span>
                return <span style={{textAlign:'right',width:'100%',display:'block'}}>{c}</span>
              })
              arr.__rowStyle = ri===3?{background:'var(--paper-2)',fontWeight:700}:{}
              return arr
            })}
          />
          <div className="hr dash mt-2"/>
          <div className="row gap-3 t-xs">
            <span><b>Revenue</b> = Recog. cost + Margin · entered per sub-job, per month</span>
            <div className="grow"/>
            <span className="t-mute">Posts to SAP on the 8th · then locked next import</span>
          </div>
        </div>

        <div className="row gap-3">
          <div className="box p-3 col gap-2 grow">
            <div className="row">
              <span className="b">Plan vs actual recognition — cumulative</span>
              <div className="grow"/>
              <span className="pill tiny warn">+$77K ahead of plan</span>
            </div>
            <svg width="100%" height="140" viewBox="0 0 600 140" preserveAspectRatio="none">
              <line x1="30" y1="120" x2="590" y2="120" stroke="#1a1815" strokeWidth="1.2"/>
              <line x1="30" y1="10" x2="30" y2="120" stroke="#1a1815" strokeWidth="1.2"/>
              <path d="M30 120 L80 108 L130 95 L180 82 L230 66 L280 55 L330 46 L380 38 L430 30 L480 24 L530 19 L580 15"
                    fill="none" stroke="#1a1815" strokeWidth="1.8" strokeDasharray="6 4"/>
              <path d="M30 120 L80 105 L130 88 L180 72 L230 58 L280 46"
                    fill="none" stroke="#c98a2c" strokeWidth="2.2"/>
              {[[30,120],[80,105],[130,88],[180,72],[230,58],[280,46]].map(([x,y],i)=>(
                <circle key={i} cx={x} cy={y} r="3" fill="#c98a2c"/>
              ))}
              {monthsRR.map((m,i)=>(
                <text key={i} x={30+i*50} y={135} fontFamily="Kalam" fontSize="9"
                      fill={i<=4?'#1a1815':'#6b655e'} textAnchor="middle">{m}</text>
              ))}
              <text x="160" y="22" fontFamily="Caveat" fontSize="13" fill="#1a1815">┄ planned</text>
              <text x="260" y="22" fontFamily="Caveat" fontSize="13" fill="#c98a2c">— actual recog.</text>
              <line x1="280" y1="10" x2="280" y2="120" stroke="#3a5e8c" strokeWidth="1" strokeDasharray="3 3"/>
              <text x="282" y="14" fontFamily="Kalam" fontSize="9" fill="#3a5e8c">today</text>
            </svg>
          </div>

          <div className="box p-3 col gap-3" style={{flex:'0 0 240px',borderColor:'var(--warn)',background:'#fdf5e3'}}>
            <div className="row">
              <span style={{fontSize:18}}>⚠</span>
              <span className="b">Over-recognition guardrail</span>
            </div>
            <div className="t-sm">Cumulative recognised revenue is <b>$77K</b> ahead of the baseline plan. Reduce May margin or re-baseline.</div>
            <div className="hr dash"/>
            <div className="row gap-2"><span className="dot ok"/><span className="t-sm">Cap May revenue at <b>$29K</b> (plan)</span></div>
            <div className="row gap-2"><span className="dot warn"/><span className="t-sm">Re-baseline · Director sign-off</span></div>
            <div className="btn sm primary" style={{justifyContent:'center'}}>cap to plan</div>
          </div>
        </div>
      </div>
    </div>
    </div>
    <Anno n="1" x={300} y={310} w="200px">PM enters recognised cost + margin per sub-job, per month. Revenue auto-sums.</Anno>
    <Anno n="2" x={770} y={520} w="180px" side="l">Guardrail compares cumulative revenue (Σ months × Σ sub-jobs) against the baseline plan.</Anno>
  </div>
)

const RevRecRisk = () => (
  <div className="wf pov-only pov-pd">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Recognition risk" user="K. Rajah" role="PD"/>
      <div className="col grow">
      <div className="row p-3 gap-3" style={{borderBottom:'1.5px solid var(--ink)',background:'var(--paper-2)'}}>
        <Logo size={12}/>
        <span className="t-xs">/ Director view /</span>
        <span className="b" style={{fontSize:13}}>Over-recognition risk — portfolio</span>
        <div className="grow"/>
        <span className="pill tiny warn">3 projects at risk</span>
        <div className="btn sm ghost">export</div>
      </div>

      <div className="p-4 col gap-3 grow">
        <div className="row gap-3">
          <div className="box p-3 grow">
            <div className="t-xs tt-up">What this view shows</div>
            <div className="t-sm mt-2">Projects where <b>recognised revenue is ahead of plan</b>, ranked by tail-risk —
              i.e. how much PNL will reverse if EAC continues to drift up and there's nothing left to recognise.</div>
          </div>
          <div className="box p-3 grow fill">
            <div className="t-xs tt-up">Tail risk pool</div>
            <div className="h2 title mt-2">$280K</div>
            <div className="t-xs t-mute">aggregate potential reversal · next 6 mo</div>
          </div>
        </div>

        <div className="box p-3 col gap-2 grow">
          <div className="row">
            <span className="b">Portfolio · ahead-of-plan recognition</span>
            <div className="grow"/>
            <span className="t-xs">click any row to drill into project</span>
          </div>
          <Table
            cols={['Project','PM','Contract','Recog. to date','vs plan','EAC drift','Tail risk','Last EAC']}
            colWidths="1.6fr 1fr .8fr 1fr 1fr .9fr .9fr .9fr"
            rows={[
              ['EAC Refresh Programme', 'Sara Tan', '$1.20M', '$697K', <span className="b" style={{color:'var(--warn)'}}>+$77K</span>, '+3.3%', <span className="b" style={{color:'var(--warn)'}}>$95K</span>, '12 May'],
              ['Network Modernisation', 'J. Lim',    '$2.40M', '$1.42M', <span className="b" style={{color:'var(--bad)'}}>+$160K</span>, '+6.8%', <span className="b" style={{color:'var(--bad)'}}>$140K</span>, <span style={{color:'var(--bad)'}}>2 mo ago</span>],
              ['Quality Lab Build-out', 'M. Wee',    '$680K', '$390K', <span className="b" style={{color:'var(--warn)'}}>+$28K</span>, '+1.9%', <span className="b" style={{color:'var(--warn)'}}>$45K</span>, '8 May'],
              ['DLP — Tower B',        'R. Goh',    '$120K', '$60K',  'on plan','+0.2%', '—',     '6 May'],
              ['Wave 3 Cabling',       'K. Yeo',    '$340K', '$110K', 'on plan','+0.4%', '—',     '11 May'],
            ].map((r,ri)=>r.map((c,ci)=>{
              if(ci===0) return <span style={{fontWeight:600,fontSize:12}}>{c}</span>
              return c
            }))}
          />
          <div className="row mt-2 gap-3 t-xs">
            <span><span className="dot warn"/> ahead of plan, EAC drift</span>
            <span><span className="dot bad"/> ahead of plan, EAC stale &gt; 6 weeks</span>
            <div className="grow"/>
            <span>filter: ☑ all  ⬚ ahead-of-plan only  ⬚ stale EAC only</span>
          </div>
        </div>

        <div className="row gap-3">
          <div className="box p-3 col gap-1 grow">
            <div className="t-xs tt-up">Policy nudge</div>
            <div className="t-sm">PMs who haven't refreshed EAC in 30+ days get auto-reminded. After 60 days, recognition for that project is <b>frozen at last EAC</b>.</div>
          </div>
          <div className="box p-3 col gap-1 grow">
            <div className="t-xs tt-up">Audit log</div>
            <div className="t-sm">Every re-baseline is logged with the Director who approved it. Quarterly export to Finance.</div>
          </div>
          <div className="box p-3 col gap-1 grow">
            <div className="t-xs tt-up">Forecast reversal</div>
            <div className="t-sm">If today's recognition curves continue, Q4 '26 PNL is at risk of negative $180K across these 3 projects.</div>
          </div>
        </div>
      </div>
    </div>
    </div>
    <Anno n="1" x={380} y={290} w="210px">PD's main "where do I focus" lens. Stale EAC + ahead-of-plan = bad news together.</Anno>
    <Anno n="2" x={680} y={520} w="180px" side="l">Soft policy ladder: nudge at 30d, freeze at 60d. No surprise reversals.</Anno>
  </div>
)

export { RevRecConcept, RevRecPlan, RevRecMonthly, RevRecRisk }
