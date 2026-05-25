import React from 'react'
import { SVGFilters, Anno, Ph, Logo, Sidebar, Status, Table } from './shared'

const LoginA = () => (
  <div className="wf">
    <SVGFilters/>
    <div className="row full">
      <div className="col p-6" style={{flex:'0 0 45%',background:'var(--paper-2)',borderRight:'1.5px solid var(--ink)',justifyContent:'space-between'}}>
        <div>
          <Logo size={20}/>
          <div className="title h1 mt-4" style={{fontSize:34,lineHeight:1.05,maxWidth:240}}>
            Project Financial Management System
          </div>
          <div className="t-sm mt-3" style={{maxWidth:240}}>
            EAC tracking. Resource forecasting.<br/>
            AI updates. One place, no spreadsheets.
          </div>
        </div>
        <Ph w="100%" h={120} label="brand mark / illustration"/>
        <div className="t-xs">v1.0 · Internal · 35 users</div>
      </div>
      <div className="col p-6 grow" style={{justifyContent:'center',gap:14}}>
        <div className="title h2">Sign in</div>
        <div className="t-sm">Use your company SSO</div>
        <div className="col mt-3" style={{gap:8,maxWidth:280}}>
          <div className="t-xs tt-up">Email</div>
          <div className="input lg">sara.tan@company.com</div>
          <div className="t-xs tt-up mt-3">Password</div>
          <div className="input lg">●●●●●●●●●</div>
          <div className="row mt-3">
            <div className="btn primary" style={{padding:'5px 18px'}}>Sign in</div>
            <div className="t-xs grow" style={{textAlign:'right'}}>Forgot?</div>
          </div>
          <div className="hr dash mt-4"/>
          <div className="btn ghost" style={{justifyContent:'center'}}>or — Continue with company SSO</div>
        </div>
      </div>
    </div>
    <Anno n="1" x={50} y={48} w="160px">Brand mark, version, scope strip — orient new PMs.</Anno>
    <Anno n="2" x={500} y={170} w="170px" side="r">SSO is the primary path; pw form is fallback per IT.</Anno>
  </div>
)

const LoginB = () => (
  <div className="wf">
    <SVGFilters/>
    <div className="col full" style={{alignItems:'center',justifyContent:'center',gap:14,background:'var(--paper-2)'}}>
      <div style={{position:'absolute',top:14,left:14}}><Logo size={14}/></div>
      <div style={{position:'absolute',top:14,right:14}} className="t-xs">need help? → PMO</div>

      <div className="box p-6" style={{width:340,background:'var(--paper)',gap:10}}>
        <div className="title h2" style={{textAlign:'center'}}>Welcome back</div>
        <div className="t-sm" style={{textAlign:'center'}}>Sign in to PFMS</div>
        <div className="hr dash mt-3"/>
        <div className="btn" style={{justifyContent:'center',padding:'8px',marginTop:8}}>
          <span style={{width:14,height:14,background:'#3a5e8c',borderRadius:2,display:'inline-block'}}/>
          Continue with company SSO
        </div>
        <div className="row" style={{gap:8,alignItems:'center',margin:'8px 0'}}>
          <div className="hr thin grow"></div>
          <span className="t-xs">or with email</span>
          <div className="hr thin grow"></div>
        </div>
        <div className="input lg">email</div>
        <div className="input lg">password</div>
        <div className="btn primary mt-3" style={{justifyContent:'center',padding:'6px'}}>Sign in</div>
      </div>

      <div className="t-xs mt-3" style={{textAlign:'center',maxWidth:300}}>
        By signing in you agree to PFMS internal use policy.
      </div>
    </div>
    <Anno n="1" x={460} y={150} w="160px">Centered card — minimal, SSO-first.</Anno>
  </div>
)

const ShellSidebar = () => (
  <div className="wf">
    <SVGFilters/>
    <div className="row full" style={{alignItems:'stretch'}}>
      <Sidebar active="Dashboard" user="Sara" role="PM"/>
      <div className="col grow">
        <div className="row p-3 gap-4" style={{borderBottom:'1.5px solid var(--ink)'}}>
          <div className="row gap-2">
            <span className="t-xs">Home</span><span className="t-xs">/</span>
            <span className="b" style={{fontSize:13}}>My Dashboard</span>
          </div>
          <div className="grow"/>
          <div className="input" style={{minWidth:140,color:'var(--ink-3)'}}>🔍 search</div>
          <div className="pill tiny">🔔 3</div>
          <div style={{width:24,height:24,borderRadius:'50%',background:'var(--ink-3)',color:'var(--paper)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700}}>ST</div>
        </div>
        <div className="p-5 col gap-4 grow">
          <div className="title h2">Welcome back, Sara</div>
          <div className="row gap-3">
            <div className="box p-4 grow"><div className="t-xs tt-up">Active Projects</div><div className="h1 title mt-2">7</div></div>
            <div className="box p-4 grow"><div className="t-xs tt-up">Updates Due</div><div className="h1 title mt-2" style={{color:'var(--warn)'}}>2</div></div>
            <div className="box p-4 grow"><div className="t-xs tt-up">At Risk</div><div className="h1 title mt-2" style={{color:'var(--bad)'}}>1</div></div>
            <div className="box p-4 grow"><div className="t-xs tt-up">Budget Variance</div><div className="h1 title mt-2">+2.4%</div></div>
          </div>
          <div className="box p-4 grow">
            <div className="row"><span className="b">My Projects</span><div className="grow"/><span className="t-xs">filter ▾</span></div>
            <div className="hr thin mt-2 mb-2"/>
            <Table
              cols={['Project','EAC','Var','Status','Last update']}
              colWidths="2fr 1fr .8fr 1.2fr 1.2fr"
              rows={[
                ['EAC Refresh Programme','$1.24M','+1.2%',<Status status="ok"/>,'5 May'],
                ['Network Modernisation','$880K','-3.1%',<Status status="warn"/>,'2 May · overdue'],
                ['Site Comm. Phase 2','$2.10M','-7.4%',<Status status="bad"/>,'28 Apr · overdue'],
                ['Asset Refresh',  '$420K','+0.5%',<Status status="ok"/>,'9 May'],
              ]}
            />
          </div>
        </div>
      </div>
    </div>
    <Anno n="1" x={50} y={20} w="120px">Sidebar nav · primary IA.</Anno>
    <Anno n="2" x={500} y={180} w="150px" side="r">KPI strip — quick orientation on login.</Anno>
    <Anno n="3" x={200} y={300} w="170px">Single inbox of "my projects".</Anno>
  </div>
)

export { LoginA, LoginB, ShellSidebar }
