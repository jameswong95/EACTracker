import React from 'react'
import { SVGFilters, Anno, Status, Table, Sidebar, Arrow } from './shared'

const AiUpdate = () => (
  <div className="wf pov-only pov-pm">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Updates" user="Sara" role="PM"/>
      <div className="col grow">
        <div className="p-4 col gap-3 grow">
          <div className="row">
            <div className="title h2">Monthly update — May '26</div>
            <span className="t-xs">· EAC Refresh Programme</span>
            <div className="grow"/>
            <span className="pill tiny">draft</span>
            <div className="btn sm ghost">save draft</div>
            <div className="btn sm primary">submit to PD</div>
          </div>

          <div className="row gap-3 grow" style={{alignItems:'stretch'}}>
            <div className="col gap-3" style={{flex:'0 0 240px'}}>
              <div className="box p-3 col gap-2">
                <div className="row">
                  <span style={{fontSize:14}}>◉</span>
                  <span className="b">Update template</span>
                  <div className="grow"/>
                  <span className="pill tiny solid">local · on-device</span>
                </div>
                <div className="t-xs t-mute">Same shape every month, every PM. PD can compare like-for-like.</div>
                <div className="hr dash"/>
                <ul style={{margin:'0 0 0 16px',padding:0,fontSize:12,lineHeight:1.65}}>
                  <li>What changed this month</li>
                  <li>Schedule — on plan? slips?</li>
                  <li>Cost / EAC movement + why</li>
                  <li>Risks &amp; mitigation</li>
                  <li>Next month's focus</li>
                </ul>
              </div>

              <div className="box p-3 col gap-2">
                <span className="b">Guardrails</span>
                <div className="row gap-2 t-xs"><span className="dot ok"/><span>120–250 words total</span></div>
                <div className="row gap-2 t-xs"><span className="dot ok"/><span>Plain English · no acronyms</span></div>
                <div className="row gap-2 t-xs"><span className="dot ok"/><span>$ amounts must match EAC</span></div>
                <div className="row gap-2 t-xs"><span className="dot warn"/><span>Flag anything &gt;$25K change</span></div>
                <div className="hr dash mt-2"/>
                <div className="t-xs t-mute">Boss's "exemplar" — generated drafts mirror the example update PD likes.</div>
              </div>

              <div className="box fill p-3 col gap-2">
                <span className="b">What goes in</span>
                <div className="t-xs">⌗ EAC numbers · SAP costs · resource plan · last 3 updates · risk register · your bullet notes</div>
                <div className="t-xs t-mute">Nothing leaves your laptop — local model, off the cloud.</div>
              </div>
            </div>

            <div className="box p-3 col gap-2 grow">
              <div className="row">
                <span className="b">Your bullets (private — only you see)</span>
                <div className="grow"/>
                <div className="btn sm primary">✨ generate draft</div>
              </div>
              <div className="box ghost p-3 col gap-1" style={{background:'var(--paper)',borderStyle:'dashed'}}>
                <div className="t-sm">— test rig: vendor delivered 2/5, rest by 20 May</div>
                <div className="t-sm">— network swap done, 4 days early</div>
                <div className="t-sm">— Mar slippage on 2 servers, cost $8K expedite</div>
                <div className="t-sm">— wave 2 kickoff next week, need Sara to confirm headcount</div>
                <div className="t-sm">— risk: vendor lead time still tight, dual-source in motion</div>
              </div>

              <div className="row mt-2">
                <span className="b">Draft for PD</span>
                <div className="grow"/>
                <span className="t-xs">194 words · within template ✓</span>
              </div>
              <div className="box p-3 col gap-3" style={{background:'#fdf9ec',borderColor:'var(--warn)',position:'relative'}}>
                <div>
                  <div className="t-xs tt-up">What changed</div>
                  <div className="t-sm">Wave 1 closed on plan. Quality test rig at 2 of 5 units delivered;
                    vendor confirms the remaining 3 by 20 May. Network swap completed 4 days ahead of schedule.</div>
                </div>
                <div>
                  <div className="t-xs tt-up">Schedule</div>
                  <div className="t-sm">On plan overall. <span style={{background:'#fdf5e3',padding:'0 3px',borderBottom:'1.5px dashed var(--warn)'}}>Wave 2 kickoff slips one week</span> pending headcount confirmation.</div>
                </div>
                <div>
                  <div className="t-xs tt-up">Cost / EAC</div>
                  <div className="t-sm">EAC <span style={{background:'#fbe9e3',padding:'0 3px'}}>$1.24M, +3.3% vs $1.20M budget</span>.
                    Mar server slippage absorbed an $8K expedite charge. Recognition tracking $77K ahead of plan — guardrail flagged.</div>
                </div>
                <div>
                  <div className="t-xs tt-up">Risks</div>
                  <div className="t-sm">Vendor lead-time remains tight; dual-source contract in progress with target close end-May. Wave 2 headcount confirmation needed from resourcing.</div>
                </div>
                <div>
                  <div className="t-xs tt-up">Next month</div>
                  <div className="t-sm">Complete test rig deployment, confirm wave 2 resourcing, close dual-source.</div>
                </div>

                <div className="hr dash"/>
                <div className="row t-xs gap-3">
                  <span><span style={{background:'#fdf5e3',padding:'0 4px',borderBottom:'1.5px dashed var(--warn)'}}>amber</span> = needs your review</span>
                  <span><span style={{background:'#fbe9e3',padding:'0 4px'}}>red</span> = pulled from SAP · verify</span>
                  <div className="grow"/>
                  <span className="t-mute">model: pfms-update-7B · run 1.4s</span>
                </div>
              </div>

              <div className="row gap-2 mt-2">
                <div className="btn sm ghost">↻ regenerate</div>
                <div className="btn sm ghost">tighter</div>
                <div className="btn sm ghost">add detail on risks</div>
                <div className="grow"/>
                <div className="btn sm">📋 copy</div>
                <div className="btn sm primary">accept &amp; submit</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={120} y={310} w="200px">Local model on the laptop — nothing leaves the network. Pulls EAC + SAP + last 3 updates.</Anno>
    <Anno n="2" x={680} y={350} w="200px">Drafts come with the template baked in. Same shape every month means PD can scan 20 of these in 5 min.</Anno>
    <Anno n="3" x={580} y={530} w="170px" side="l">Inline highlights for "review me" — never hide that the model pulled a number.</Anno>
  </div>
)

const WbsImport = () => (
  <div className="wf pov-only pov-fin">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="SAP Import" user="L. Cheng" role="Finance"/>
      <div className="col grow">
        <div className="row p-3 gap-3" style={{borderBottom:'1.5px solid var(--ink)'}}>
          <span className="t-xs">SAP Import / WBS /</span>
          <span className="b" style={{fontSize:13}}>Excel WBS — Network Modernisation</span>
          <span className="pill tiny" style={{borderColor:'var(--ink-3)',color:'var(--ink-3)'}}>main WBS 123456789/001-1</span>
          <span className="pill tiny warn">1 of 8 rows need mapping</span>
          <div className="grow"/>
          <div className="btn sm ghost">cancel</div>
          <div className="btn sm primary">commit mapping</div>
        </div>

        <div className="p-4 col gap-3 grow">
          <div className="row gap-2">
            {[
              ['1','Upload',  'ok'],
              ['2','Detect headers','ok'],
              ['3','Map to project sub-jobs','warn'],
              ['4','Review',  'mute'],
            ].map((s,i)=>(
              <React.Fragment key={i}>
                <div className="row gap-2" style={{opacity:s[2]==='mute'?.55:1}}>
                  <div className="dot" style={{
                    width:18,height:18,borderRadius:'50%',
                    background:s[2]==='ok'?'var(--ok)':s[2]==='warn'?'var(--warn)':'var(--paper)',
                    border:'1.5px solid var(--ink)',
                    color:'var(--paper)',
                    display:'inline-flex',alignItems:'center',justifyContent:'center',
                    fontSize:10,fontWeight:700,
                  }}>{s[0]}</div>
                  <span className="b" style={{fontSize:13}}>{s[1]}</span>
                </div>
                {i<3 && <span className="t-xs t-mute">———</span>}
              </React.Fragment>
            ))}
            <div className="grow"/>
            <span className="t-xs">network-mod-FY26.xlsx · 26 KB · 14 rows</span>
          </div>

          <div className="row gap-3 grow" style={{alignItems:'stretch'}}>
            <div className="box p-3 col gap-2 grow">
              <div className="row">
                <span className="b">Source · Excel</span>
                <span className="t-xs t-mute" style={{marginLeft:8}}>Sheet1 · A1:E14</span>
              </div>
              <div className="box ghost p-2" style={{background:'var(--paper-2)'}}>
                <Table
                  cols={['WBS','Description','Type','FY26 ($K)','Phase']}
                  colWidths=".7fr 2fr 1fr .9fr .9fr"
                  rows={[
                    ['1.1','PM + tech lead',          'PEOPLE',     '180','phase 1'],
                    ['1.2','Senior eng × 2',          'PEOPLE',     '156','phase 1'],
                    ['2.1','Switches + transceivers', 'HARDWARE',   '320','phase 1-2'],
                    ['2.2','Cable bulk PO',           'HARDWARE',   ' 48','phase 1-3'],
                    ['3.1','Cabling sub-con',         'VENDOR',     '180','phase 1-2'],
                    ['3.2','Decommissioning service', 'VENDOR',     ' 90','phase 2'],
                    ['4.1','12-mo DLP provision',     'PROVISION',  '220','phase 3'],
                    ['5.1','Training + handover',     'MISC',       ' 25','phase 3'],
                  ]}
                />
              </div>
            </div>

            <div className="col" style={{justifyContent:'center',flex:'0 0 40px',alignItems:'center'}}>
              <Arrow dir="right" length={30}/>
              <span className="t-xs t-mute">map</span>
            </div>

            <div className="box p-3 col gap-2 grow">
              <div className="row">
                <span className="b">Target · project's sub-jobs</span>
                <span className="t-xs t-mute" style={{marginLeft:8}}>from SAP · main WBS <span className="mono">…/001-1</span></span>
                <div className="grow"/>
                <span className="t-xs t-mute">auto-suggest from prior imports</span>
              </div>
              <div className="col gap-2">
                {[
                  {wbs:'/001-1-1', name:'Project management', tone:'ok', rows:[
                    ['1.1 PM + tech lead', '$180', 'auto · keyword: PM, lead'],
                  ]},
                  {wbs:'/001-1-2', name:'Main-con', tone:'warn', rows:[
                    ['1.2 Senior eng × 2',           '$156', 'auto · keyword: eng'],
                    ['3.1 Cabling sub-con',          '$180', 'auto · keyword: sub-con'],
                    ['3.2 Decommissioning service',  '$ 90', <span className="b" style={{color:'var(--warn)'}}>needs review</span>],
                  ]},
                  {wbs:'/001-1-3', name:'Materials & equipment', tone:'info', rows:[
                    ['2.1 Switches + transceivers',  '$320', 'auto · keyword: hardware'],
                    ['2.2 Cable bulk PO',            '$ 48', 'auto · keyword: cable'],
                  ]},
                  {wbs:'/001-1-4', name:'Misc', tone:'bad', rows:[
                    ['4.1 12-mo DLP provision',      '$220', 'auto · keyword: provision'],
                  ]},
                ].map(b=>(
                  <div key={b.wbs} className="box p-3" style={{background:'var(--paper)',borderColor:`var(--${b.tone})`}}>
                    <div className="row">
                      <span className="mono pill tiny" style={{borderColor:`var(--${b.tone})`,color:`var(--${b.tone})`}}>{b.wbs}</span>
                      <span className="b">{b.name}</span>
                      <div className="grow"/>
                      <span className="t-xs t-mute">{b.rows.length} row{b.rows.length>1?'s':''}</span>
                    </div>
                    <div className="hr dash mt-2"/>
                    {b.rows.map((r,ri)=>(
                      <div key={ri} className="row" style={{padding:'2px 0'}}>
                        <span className="t-sm" style={{flex:1.6}}>{r[0]}</span>
                        <span className="b" style={{width:60,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>{r[1]}</span>
                        <span className="t-xs" style={{flex:1,marginLeft:8,color:'var(--ink-3)'}}>{r[2]}</span>
                      </div>
                    ))}
                  </div>
                ))}

                <div className="box dash p-3" style={{borderColor:'var(--warn)',background:'#fdf5e3'}}>
                  <div className="row">
                    <span className="pill tiny warn">?</span>
                    <span className="b">Unmapped · 1 row</span>
                    <div className="grow"/>
                    <div className="btn sm ghost">save rule</div>
                  </div>
                  <div className="row mt-2">
                    <span className="t-sm" style={{flex:1.6}}>5.1 Training + handover</span>
                    <span className="b" style={{width:60,textAlign:'right'}}>$25</span>
                    <div className="row gap-2" style={{flex:1,marginLeft:8,justifyContent:'flex-end'}}>
                      <span className="mono pill tiny">→ /001-1-1</span>
                      <span className="mono pill tiny">→ /001-1-2</span>
                      <span className="mono pill tiny">→ /001-1-4</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={380} y={170} w="180px">4-step wizard. Drop the Excel — system parses headers, suggests mapping.</Anno>
    <Anno n="2" x={820} y={520} w="180px" side="l">Save mapping rules — Finance teaches the system once per legacy WBS pattern, never again.</Anno>
  </div>
)

export { AiUpdate, WbsImport }
