export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const RATES = [
  { grade: 'E1', title: 'Junior Engineer / Analyst',       daily: 220,  monthly: 4840  },
  { grade: 'E2', title: 'Engineer',                         daily: 285,  monthly: 6270  },
  { grade: 'E3', title: 'Senior Engineer / Tech Lead',      daily: 360,  monthly: 7920  },
  { grade: 'E4', title: 'Principal / Programme Manager',    daily: 460,  monthly: 10120 },
  { grade: 'E5', title: 'Director / Chief',                 daily: 580,  monthly: 12760 },
];

export const RESOURCE_POOL = [
  { id: 'r01', name: 'Marcus Tan',      grade: 'E5', roles: ['Programme Director', 'Programme Manager'] },
  { id: 'r02', name: 'Isabelle Dupont', grade: 'E4', roles: ['Programme Manager', 'Project Manager'] },
  { id: 'r03', name: 'Amara Osei',      grade: 'E4', roles: ['Project Manager', 'Delivery Lead'] },
  { id: 'r04', name: 'Sam Okonkwo',     grade: 'E3', roles: ['Project Manager', 'Business Analyst', 'Technical Lead'] },
  { id: 'r05', name: 'Rachel Lim',      grade: 'E3', roles: ['Business Analyst', 'Project Manager'] },
  { id: 'r06', name: 'Nadia Hassan',    grade: 'E3', roles: ['Project Manager', 'Programme Coordinator'] },
  { id: 'r07', name: 'Ravi Kumar',      grade: 'E3', roles: ['Technical Lead', 'Systems Architect', 'Site Engineer'] },
  { id: 'r08', name: 'James Chen',      grade: 'E2', roles: ['Business Analyst', 'Systems Analyst', 'Implementation Analyst'] },
  { id: 'r09', name: 'Priya Sharma',    grade: 'E2', roles: ['Engineer', 'Developer', 'Technical Analyst'] },
  { id: 'r10', name: 'Kevin Zhang',     grade: 'E2', roles: ['Network Engineer', 'Infrastructure Analyst', 'Technical Analyst'] },
  { id: 'r11', name: 'Yuki Tanaka',     grade: 'E2', roles: ['QA Engineer', 'Test Analyst'] },
  { id: 'r12', name: 'Tom Whitfield',   grade: 'E1', roles: ['Graduate Engineer', 'Analyst'] },
  { id: 'r13', name: 'Sofia Ng',        grade: 'E1', roles: ['Analyst', 'Project Coordinator'] },
  { id: 'r14', name: 'Callum Murray',   grade: 'E1', roles: ['Site Analyst', 'Graduate Analyst'] },
  { id: 'r15', name: 'Daniel Lee',      grade: 'E1', roles: ['Graduate Analyst', 'Analyst'] },
];

export const IMPORT_HISTORY = [
  { date: '(pending)',    period: "Apr '26", by: 'L. Cheng', created: 3,  updated: 47, locked: 50, exceptions: 2, status: 'warn' },
  { date: '12 Apr 14:03',period: "Mar '26", by: 'L. Cheng', created: 1,  updated: 49, locked: 50, exceptions: 0, status: 'ok'   },
  { date: '10 Mar 10:48',period: "Feb '26", by: 'L. Cheng', created: 0,  updated: 50, locked: 50, exceptions: 0, status: 'ok'   },
  { date: '8 Feb 11:22', period: "Jan '26", by: 'M. Tan',   created: 2,  updated: 48, locked: 50, exceptions: 1, status: 'ok'   },
  { date: '9 Jan 09:55', period: "Dec '25", by: 'L. Cheng', created: 0,  updated: 50, locked: 50, exceptions: 0, status: 'ok'   },
];

export const ROLE_USERS = {
  PM:      { name: 'Sara Tan',  initials: 'ST', title: 'Project Manager' },
  PD:      { name: 'K. Rajah', initials: 'KR', title: 'Project Director' },
  Finance: { name: 'L. Cheng', initials: 'LC', title: 'Finance' },
  Admin:   { name: 'Admin',    initials: 'AD', title: 'System Administrator' },
};

export const projects = [
  {
    id: 'PR-2025-014',
    name: 'EAC Refresh Programme',
    pm: 'Sara Tan',
    pd: 'K. Rajah',
    department: 'Technology',
    status: 'ok',
    wbs: '123456789/001-1',
    budget: 1200000,
    eac: 1240000,
    actual: 540000,
    committed: 180000,
    labourEtc: 390000,
    otherEtc: 130000,
    percentComplete: 64,
    monthsLeft: 7,
    lastUpdate: '2026-05-05',
    trend: [0, 96, 204, 312, 432, 540, 660, 760, 850, 920, 975, 1240],
    updates: [
      { month: 'May 2026', status: 'ok',   text: 'Test rig 2/5 delivered. Vendor confirms remainder by 20 May. % complete +6.' },
      { month: 'Apr 2026', status: 'ok',   text: 'Network swap completed. 4 days ahead of plan.' },
      { month: 'Mar 2026', status: 'warn', text: '2 servers delayed by vendor; mitigation: expedite cost SGD 8K.' },
      { month: 'Feb 2026', status: 'ok',   text: 'Wave 1 closed on budget. Wave 2 kickoff next week.' },
    ],
    milestones: [
      { name: 'Kickoff',           date: 'Jan 2025', done: true  },
      { name: 'Wave 1 complete',   date: 'Feb 2026', done: true  },
      { name: 'Quality test rig',  date: '20 May 2026', done: false, warn: true },
      { name: 'Wave 2 cutover',    date: 'Jul 2026', done: false },
      { name: 'Closeout',          date: 'Dec 2026', done: false },
    ],
    risks: [
      { id: 'R1', title: 'Vendor lead time slippage', impact: 'High', prob: 'Medium', mitigation: 'Dual-source contract in progress, close end-May.' },
      { id: 'R2', title: 'Wave 2 headcount shortage', impact: 'Medium', prob: 'Low',  mitigation: 'Resourcing request submitted 10 May.' },
    ],
    resources: [
      { role: 'Isabelle Dupont', fn: 'Programme Manager',  grade: 'E4', fte: [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5] },
      { role: 'Rachel Lim',      fn: 'Technical Lead',     grade: 'E3', fte: [1,1,1,1,1,1,1,1,0,0,0,0] },
      { role: 'James Chen',      fn: 'Engineer',           grade: 'E2', fte: [2,2,2,2,2,2,2,2,2,1,0,0] },
      { role: 'Tom Whitfield',   fn: 'Business Analyst',   grade: 'E1', fte: [1,1,1,1,1,0,0,0,0,0,0,0] },
    ],
    subjobs: [
      { wbs: '…/001-1-1', name: 'Project management', budget: 180000, actual:  72000, committed:  12000, etc:  98000 },
      { wbs: '…/001-1-2', name: 'Main-con',            budget: 820000, actual: 408000, committed: 148000, etc: 320000 },
      { wbs: '…/001-1-3', name: 'Misc',                budget: 200000, actual:  60000, committed:  20000, etc: 102000 },
    ],
    eacMonthly: {
      lockedMonths: [0,1,2,3,4],
      rows: [
        { id: 'labour',  label: 'Labour (blended)',       values: [72,78,82,86,86,70,65,55,48,30,0,0]  },
        { id: 'hardware',label: 'Hardware / Materials',   values: [0,45,88,96,0,80,120,0,0,0,0,0]     },
        { id: 'subcon',  label: 'Sub-contractor',         values: [18,18,18,18,18,20,20,20,20,20,0,0] },
        { id: 'reserve', label: 'PM Reserve',             values: [0,0,0,0,18,0,0,0,0,0,0,0]          },
      ],
    },
    revrec: {
      method: 'percent',
      recognitionCurve: [0, 8, 17, 26, 36, 45, 55, 64, 73, 79, 85, 100],
      recognisedToDate: 686400,
      forecastFull: 1240000,
    },
  },
  {
    id: 'PR-2026-022',
    name: 'Network Modernisation',
    pm: 'A. Kumar',
    pd: 'K. Rajah',
    department: 'Infrastructure',
    status: 'warn',
    wbs: '234567890/002-1',
    budget: 900000,
    eac: 880000,
    actual: 320000,
    committed: 210000,
    labourEtc: 230000,
    otherEtc: 120000,
    percentComplete: 41,
    monthsLeft: 9,
    lastUpdate: '2026-05-02',
    trend: [0, 60, 130, 210, 320, 420, 520, 620, 700, 760, 820, 880],
    updates: [
      { month: 'May 2026', status: 'warn', text: 'Phase 2 cabling behind by 2 weeks. Sub-con resource constraint identified.' },
      { month: 'Apr 2026', status: 'ok',   text: 'Core switch deployment complete across 3 sites.' },
      { month: 'Mar 2026', status: 'ok',   text: 'Materials received. Staging underway.' },
    ],
    milestones: [
      { name: 'Design sign-off',   date: 'Jan 2026', done: true },
      { name: 'Site A go-live',    date: 'Mar 2026', done: true },
      { name: 'Phase 2 cabling',   date: 'Jun 2026', done: false, warn: true },
      { name: 'Final acceptance',  date: 'Feb 2027', done: false },
    ],
    risks: [
      { id: 'R1', title: 'Sub-contractor resource constraint', impact: 'High', prob: 'High',   mitigation: 'Escalated to procurement for alternate vendor.' },
      { id: 'R2', title: 'Site access delays',                 impact: 'Low',  prob: 'Medium', mitigation: 'Facility schedule confirmed for Jun.' },
    ],
    resources: [
      { role: 'Amara Osei',   fn: 'Programme Manager',  grade: 'E4', fte: [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0,0,0] },
      { role: 'Sam Okonkwo',  fn: 'Network Lead',       grade: 'E3', fte: [1,1,1,1,1,1,1,1,1,1,0,0] },
      { role: 'Kevin Zhang',  fn: 'Engineer',           grade: 'E2', fte: [1,1,2,2,2,2,2,1,1,0,0,0] },
    ],
    subjobs: [
      { wbs: '…/002-1-1', name: 'Project management', budget: 180000, actual: 64000, committed: 20000, etc: 96000 },
      { wbs: '…/002-1-2', name: 'Main-con',            budget: 520000, actual: 210000, committed: 170000, etc: 100000 },
      { wbs: '…/002-1-3', name: 'Materials',           budget: 200000, actual: 46000,  committed: 20000,  etc: 34000 },
    ],
    eacMonthly: {
      lockedMonths: [0,1,2,3,4],
      rows: [
        { id: 'labour',  label: 'Labour (blended)', values: [40,45,48,52,52,45,40,35,28,15,0,0] },
        { id: 'hardware',label: 'Hardware',         values: [0,0,60,80,60,80,60,40,0,0,0,0]   },
        { id: 'subcon',  label: 'Sub-contractor',   values: [20,20,22,25,25,28,28,25,20,10,0,0] },
      ],
    },
    revrec: { method: 'milestone', recognitionCurve: [0,0,0,25,25,25,50,50,75,75,100,100], recognisedToDate: 225000, forecastFull: 900000 },
  },
  {
    id: 'PR-2025-031',
    name: 'Site Commissioning Ph.2',
    pm: 'L. Wong',
    pd: 'K. Rajah',
    department: 'Operations',
    status: 'bad',
    wbs: '345678901/003-1',
    budget: 1950000,
    eac: 2100000,
    actual: 980000,
    committed: 420000,
    labourEtc: 520000,
    otherEtc: 180000,
    percentComplete: 52,
    monthsLeft: 6,
    lastUpdate: '2026-04-28',
    trend: [0, 140, 290, 460, 620, 800, 980, 1100, 1250, 1400, 1550, 2100],
    updates: [
      { month: 'Apr 2026', status: 'bad',  text: 'Commissioning delay due to third-party certification backlog. EAC increased by $150K.' },
      { month: 'Mar 2026', status: 'warn', text: 'Permit approval behind schedule. Contingency draw-down authorised.' },
      { month: 'Feb 2026', status: 'warn', text: 'Scope addition for seismic bracing approved +$80K.' },
    ],
    milestones: [
      { name: 'Foundation complete',  date: 'Oct 2025',  done: true },
      { name: 'Structure complete',   date: 'Jan 2026',  done: true },
      { name: 'Commissioning',        date: 'May 2026',  done: false, warn: true },
      { name: 'Handover',             date: 'Oct 2026',  done: false },
    ],
    risks: [
      { id: 'R1', title: 'Certification authority backlog', impact: 'High', prob: 'High',   mitigation: 'Engaged external expediter. Expect 3-week slip.' },
      { id: 'R2', title: 'Cost overrun > 10%',             impact: 'High', prob: 'Medium', mitigation: 'Change control board review scheduled.' },
      { id: 'R3', title: 'Weather delays in Q3',           impact: 'Low',  prob: 'Medium', mitigation: 'Float buffer included in revised schedule.' },
    ],
    resources: [
      { role: 'Isabelle Dupont', fn: 'Programme Manager', grade: 'E4', fte: [1,1,1,1,1,1,1,1,0.5,0,0,0] },
      { role: 'Ravi Kumar',      fn: 'Site Engineer',     grade: 'E3', fte: [2,2,2,2,2,2,2,2,1,0,0,0] },
      { role: 'Priya Sharma',    fn: 'Engineer',          grade: 'E2', fte: [3,3,3,4,4,4,3,2,1,0,0,0] },
      { role: 'Callum Murray',   fn: 'Site Analyst',      grade: 'E1', fte: [1,1,1,1,1,1,0,0,0,0,0,0] },
    ],
    subjobs: [
      { wbs: '…/003-1-1', name: 'Project management', budget: 350000, actual: 180000, committed: 40000, etc: 180000 },
      { wbs: '…/003-1-2', name: 'Civil works',         budget: 1100000, actual: 620000, committed: 320000, etc: 280000 },
      { wbs: '…/003-1-3', name: 'MEP',                 budget: 500000, actual: 180000, committed: 60000, etc: 60000 },
    ],
    eacMonthly: {
      lockedMonths: [0,1,2,3,4],
      rows: [
        { id: 'labour',   label: 'Labour',        values: [140,150,160,170,175,165,150,120,90,50,0,0]  },
        { id: 'civil',    label: 'Civil works',    values: [0,80,120,180,200,220,200,160,100,40,0,0]   },
        { id: 'mep',      label: 'MEP',            values: [0,0,0,60,80,80,100,80,60,40,0,0]          },
        { id: 'reserve',  label: 'Contingency',    values: [0,0,0,0,0,30,30,30,0,0,0,0]               },
      ],
    },
    revrec: { method: 'percent', recognitionCurve: [0,7,15,24,34,45,55,65,75,83,90,100], recognisedToDate: 1015400, forecastFull: 1950000 },
  },
  {
    id: 'PR-2025-007',
    name: 'Asset Refresh — Office',
    pm: 'J. Lim',
    pd: 'K. Rajah',
    department: 'Corporate IT',
    status: 'ok',
    wbs: '456789012/004-1',
    budget: 420000,
    eac: 418000,
    actual: 280000,
    committed: 90000,
    labourEtc: 30000,
    otherEtc: 18000,
    percentComplete: 78,
    monthsLeft: 3,
    lastUpdate: '2026-05-09',
    trend: [0, 40, 90, 145, 195, 250, 300, 340, 380, 400, 410, 418],
    updates: [
      { month: 'May 2026', status: 'ok', text: 'Batch 4 rollout complete. Final batch scheduled for Jun.' },
      { month: 'Apr 2026', status: 'ok', text: 'All hardware received and staging complete.' },
    ],
    milestones: [
      { name: 'Batch 1–3 rollout', date: 'Mar 2026', done: true },
      { name: 'Batch 4 rollout',   date: 'May 2026', done: true },
      { name: 'Final batch',       date: 'Jun 2026', done: false },
      { name: 'Closeout',          date: 'Aug 2026', done: false },
    ],
    risks: [
      { id: 'R1', title: 'User adoption issues', impact: 'Low', prob: 'Low', mitigation: 'Training sessions scheduled Jul.' },
    ],
    resources: [
      { role: 'Nadia Hassan', fn: 'Project Manager', grade: 'E3', fte: [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0,0,0,0] },
      { role: 'Yuki Tanaka',  fn: 'IT Engineer',     grade: 'E2', fte: [1,1,1,1,1,1,1,0,0,0,0,0] },
    ],
    subjobs: [
      { wbs: '…/004-1-1', name: 'Project management', budget: 80000,  actual: 45000,  committed: 5000,  etc: 28000 },
      { wbs: '…/004-1-2', name: 'Hardware',            budget: 280000, actual: 200000, committed: 70000, etc: 0 },
      { wbs: '…/004-1-3', name: 'Deployment services', budget: 60000,  actual: 35000,  committed: 15000, etc: 2000 },
    ],
    eacMonthly: {
      lockedMonths: [0,1,2,3,4],
      rows: [
        { id: 'labour',   label: 'Labour',    values: [20,20,22,24,24,22,20,18,0,0,0,0] },
        { id: 'hardware', label: 'Hardware',  values: [0,40,60,80,80,60,40,20,0,0,0,0] },
        { id: 'services', label: 'Services',  values: [20,20,20,20,20,8,0,0,0,0,0,0] },
      ],
    },
    revrec: { method: 'percent', recognitionCurve: [0,10,21,35,46,60,71,81,91,95,98,100], recognisedToDate: 326040, forecastFull: 420000 },
  },
  {
    id: 'PR-2025-089',
    name: 'Datacentre Migration',
    pm: 'R. Patel',
    pd: 'K. Rajah',
    department: 'Technology',
    status: 'ok',
    wbs: '567890123/005-1',
    budget: 3400000,
    eac: 3450000,
    actual: 1200000,
    committed: 850000,
    labourEtc: 1100000,
    otherEtc: 300000,
    percentComplete: 38,
    monthsLeft: 14,
    lastUpdate: '2026-05-06',
    trend: [0, 200, 420, 650, 900, 1150, 1400, 1650, 1900, 2200, 2550, 3450],
    updates: [
      { month: 'May 2026', status: 'ok',   text: 'Phase 1 migration of 200 VMs complete. Phase 2 scope confirmed.' },
      { month: 'Apr 2026', status: 'ok',   text: 'DR environment validated. Go-live approved.' },
      { month: 'Mar 2026', status: 'ok',   text: 'Network fabric installation on track.' },
    ],
    milestones: [
      { name: 'Phase 1 migration', date: 'May 2026', done: true },
      { name: 'Phase 2 migration', date: 'Sep 2026', done: false },
      { name: 'Phase 3 migration', date: 'Mar 2027', done: false },
      { name: 'Decommission old DC', date: 'Jul 2027', done: false },
    ],
    risks: [
      { id: 'R1', title: 'Phase 2 complexity underestimated', impact: 'High', prob: 'Low', mitigation: 'Independent review scheduled Q3.' },
    ],
    resources: [
      { role: 'Amara Osei',   fn: 'Programme Manager',  grade: 'E4', fte: [1,1,1,1,1,1,1,1,1,1,1,1, 1,0.5,0.5,0.5,0.5,0,0,0,0,0,0,0] },
      { role: 'Rachel Lim',   fn: 'Migration Lead',     grade: 'E3', fte: [2,2,2,2,2,2,2,2,2,2,1,0, 2,2,2,1,0,0,0,0,0,0,0,0] },
      { role: 'Kevin Zhang',  fn: 'Infrastructure Eng', grade: 'E2', fte: [3,3,4,4,4,4,4,4,3,3,2,0, 0,2,3,4,4,3,2,1,0,0,0,0] },
      { role: 'Daniel Lee',   fn: 'Analyst',            grade: 'E1', fte: [2,2,2,2,2,2,2,2,2,1,0,0, 0,1,2,2,2,2,1,0,0,0,0,0] },
    ],
    subjobs: [
      { wbs: '…/005-1-1', name: 'Project management', budget: 500000,  actual: 180000, committed: 50000,  etc: 270000 },
      { wbs: '…/005-1-2', name: 'Migration services',  budget: 1800000, actual: 650000, committed: 600000, etc: 550000 },
      { wbs: '…/005-1-3', name: 'Hardware & licensing',budget: 900000,  actual: 320000, committed: 180000, etc: 250000 },
      { wbs: '…/005-1-4', name: 'Network',             budget: 200000,  actual: 50000,  committed: 20000,  etc: 30000 },
    ],
    eacMonthly: {
      lockedMonths: [0,1,2,3,4],
      rows: [
        { id: 'labour',   label: 'Labour',       values: [200,210,220,230,230,220,210,200,190,180,160,0, 0,160,180,200,180,160,120,60,0,0,0,0] },
        { id: 'hw',       label: 'HW/Licensing', values: [0,80,80,80,80,80,80,80,80,0,0,0,             0,0,0,0,0,0,0,0,0,0,0,0] },
        { id: 'services', label: 'Services',      values: [0,0,0,80,100,100,120,120,100,80,60,0,         0,80,100,120,100,80,60,0,0,0,0,0] },
        { id: 'network',  label: 'Network',       values: [0,0,20,20,20,20,10,10,10,0,0,0,              0,0,0,0,0,0,0,0,0,0,0,0] },
      ],
    },
    revrec: { method: 'percent', recognitionCurve: [0,6,12,19,27,35,43,51,59,66,74,100], recognisedToDate: 1292400, forecastFull: 3400000 },
  },
  {
    id: 'PR-2026-003',
    name: 'Security Hardening Wave 3',
    pm: 'M. Goh',
    pd: 'K. Rajah',
    department: 'Cybersecurity',
    status: 'warn',
    wbs: '678901234/006-1',
    budget: 240000,
    eac: 246000,
    actual: 90000,
    committed: 60000,
    labourEtc: 68000,
    otherEtc: 28000,
    percentComplete: 45,
    monthsLeft: 4,
    lastUpdate: '2026-05-01',
    trend: [0, 18, 38, 58, 80, 108, 130, 155, 180, 210, 230, 246],
    updates: [
      { month: 'May 2026', status: 'warn', text: 'Pen test finding requires additional remediation effort; EAC adjusted +$6K.' },
      { month: 'Apr 2026', status: 'ok',   text: 'Firewall replacement complete across primary sites.' },
    ],
    milestones: [
      { name: 'Firewall replacement',  date: 'Apr 2026', done: true },
      { name: 'Pen test complete',     date: 'Jun 2026', done: false, warn: true },
      { name: 'Remediation close-out', date: 'Aug 2026', done: false },
    ],
    risks: [
      { id: 'R1', title: 'Additional pen test findings', impact: 'Medium', prob: 'Medium', mitigation: 'Budget reserve $10K held.' },
    ],
    resources: [
      { role: 'Sam Okonkwo',  fn: 'Security PM',       grade: 'E3', fte: [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0,0,0,0] },
      { role: 'Priya Sharma', fn: 'Security Engineer', grade: 'E2', fte: [1,1,1,1,1,1,1,0,0,0,0,0] },
    ],
    subjobs: [
      { wbs: '…/006-1-1', name: 'Project management', budget: 40000,  actual: 18000, committed: 5000,  etc: 20000 },
      { wbs: '…/006-1-2', name: 'Technical delivery',  budget: 160000, actual: 58000, committed: 50000, etc: 48000 },
      { wbs: '…/006-1-3', name: 'Licensing',           budget: 40000,  actual: 14000, committed: 5000,  etc: 0 },
    ],
    eacMonthly: {
      lockedMonths: [0,1,2,3,4],
      rows: [
        { id: 'labour',   label: 'Labour',     values: [14,15,16,18,18,16,14,12,0,0,0,0] },
        { id: 'technical',label: 'Technical',  values: [0,8,12,18,22,22,20,18,0,0,0,0] },
        { id: 'licensing',label: 'Licensing',  values: [4,4,4,4,4,4,0,0,0,0,0,0] },
      ],
    },
    revrec: { method: 'milestone', recognitionCurve: [0,0,0,0,0,50,50,50,100,100,100,100], recognisedToDate: 108000, forecastFull: 240000 },
  },
  {
    id: 'PR-2025-055',
    name: 'Wireless Refresh',
    pm: 'A. Kumar',
    pd: 'K. Rajah',
    department: 'Infrastructure',
    status: 'ok',
    wbs: '789012345/007-1',
    budget: 680000,
    eac: 665000,
    actual: 380000,
    committed: 180000,
    labourEtc: 75000,
    otherEtc: 30000,
    percentComplete: 72,
    monthsLeft: 3,
    lastUpdate: '2026-05-10',
    trend: [0, 55, 115, 180, 255, 330, 400, 465, 520, 570, 620, 665],
    updates: [
      { month: 'May 2026', status: 'ok', text: 'Final 8 sites underway. Project tracking $15K under budget.' },
      { month: 'Apr 2026', status: 'ok', text: '32 of 40 sites completed. Equipment lead times improving.' },
    ],
    milestones: [
      { name: 'Sites 1–20 live', date: 'Feb 2026', done: true },
      { name: 'Sites 21–32 live', date: 'Apr 2026', done: true },
      { name: 'Sites 33–40 live', date: 'Jun 2026', done: false },
      { name: 'Closeout',         date: 'Aug 2026', done: false },
    ],
    risks: [
      { id: 'R1', title: 'Site access at final 8 locations', impact: 'Low', prob: 'Low', mitigation: 'Facility management engaged.' },
    ],
    resources: [
      { role: 'Nadia Hassan', fn: 'Project Manager',   grade: 'E3', fte: [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0,0,0,0,0] },
      { role: 'Kevin Zhang',  fn: 'Network Engineer',  grade: 'E2', fte: [2,2,2,2,2,2,1,0,0,0,0,0] },
    ],
    subjobs: [
      { wbs: '…/007-1-1', name: 'Project management', budget: 80000,  actual: 46000,  committed: 10000, etc: 22000 },
      { wbs: '…/007-1-2', name: 'Hardware',            budget: 420000, actual: 260000, committed: 160000, etc: 0 },
      { wbs: '…/007-1-3', name: 'Installation',        budget: 180000, actual: 74000,  committed: 10000, etc: 53000 },
    ],
    eacMonthly: {
      lockedMonths: [0,1,2,3,4],
      rows: [
        { id: 'labour',   label: 'Labour',      values: [30,32,34,36,36,30,22,16,0,0,0,0] },
        { id: 'hardware', label: 'Hardware',     values: [0,40,60,80,80,80,60,20,0,0,0,0] },
        { id: 'install',  label: 'Installation', values: [25,25,25,25,25,25,20,20,0,0,0,0] },
      ],
    },
    revrec: { method: 'percent', recognitionCurve: [0,8,17,27,37,49,59,71,83,90,96,100], recognisedToDate: 489660, forecastFull: 680000 },
  },
  {
    id: 'PR-2025-072',
    name: 'CRM Rollout',
    pm: 'Sara Tan',
    pd: 'K. Rajah',
    department: 'Corporate',
    status: 'ok',
    wbs: '890123456/008-1',
    budget: 1100000,
    eac: 1130000,
    actual: 520000,
    committed: 290000,
    labourEtc: 240000,
    otherEtc: 80000,
    percentComplete: 55,
    monthsLeft: 6,
    lastUpdate: '2026-05-07',
    trend: [0, 80, 170, 270, 375, 480, 590, 700, 810, 920, 1020, 1130],
    updates: [
      { month: 'May 2026', status: 'ok',   text: 'UAT phase 2 underway with 15 business users. 3 minor defects raised.' },
      { month: 'Apr 2026', status: 'ok',   text: 'Data migration dry run successful. Go-live planned Aug.' },
      { month: 'Mar 2026', status: 'warn', text: 'Integration testing revealed API compatibility issue. Fixed in sprint 8.' },
    ],
    milestones: [
      { name: 'System build complete', date: 'Feb 2026', done: true },
      { name: 'UAT phase 1',           date: 'Apr 2026', done: true },
      { name: 'UAT phase 2',           date: 'Jun 2026', done: false },
      { name: 'Go-live',               date: 'Aug 2026', done: false },
      { name: 'Hypercare end',         date: 'Nov 2026', done: false },
    ],
    risks: [
      { id: 'R1', title: 'User adoption below target', impact: 'Medium', prob: 'Medium', mitigation: 'Change management plan activated.' },
      { id: 'R2', title: 'Data quality issues',        impact: 'Medium', prob: 'Low',    mitigation: 'Data cleansing sprint scheduled.' },
    ],
    resources: [
      { role: 'Isabelle Dupont', fn: 'Programme Manager', grade: 'E4', fte: [1,1,1,1,1,1,1,1,0.5,0,0,0] },
      { role: 'Ravi Kumar',      fn: 'Technical Lead',    grade: 'E3', fte: [1,1,1,1,1,1,1,1,1,0,0,0] },
      { role: 'James Chen',      fn: 'Business Analyst',  grade: 'E2', fte: [2,2,2,2,2,2,2,2,1,0,0,0] },
      { role: 'Yuki Tanaka',     fn: 'QA Engineer',       grade: 'E2', fte: [0,0,1,1,1,1,1,1,0,0,0,0] },
    ],
    subjobs: [
      { wbs: '…/008-1-1', name: 'Project management', budget: 200000, actual: 92000,  committed: 30000, etc: 78000 },
      { wbs: '…/008-1-2', name: 'Development',         budget: 600000, actual: 280000, committed: 200000, etc: 120000 },
      { wbs: '…/008-1-3', name: 'Licensing',           budget: 200000, actual: 100000, committed: 50000,  etc: 50000 },
      { wbs: '…/008-1-4', name: 'Change management',   budget: 100000, actual: 48000,  committed: 10000,  etc: 20000 },
    ],
    eacMonthly: {
      lockedMonths: [0,1,2,3,4],
      rows: [
        { id: 'labour',    label: 'Labour',          values: [80,85,90,95,95,90,85,80,50,0,0,0] },
        { id: 'licensing', label: 'Licensing',        values: [20,20,20,20,20,20,15,15,0,0,0,0] },
        { id: 'change',    label: 'Change mgmt',      values: [0,0,10,15,15,15,10,10,0,0,0,0] },
        { id: 'reserve',   label: 'Reserve',          values: [0,0,0,0,0,0,0,0,0,0,0,0] },
      ],
    },
    revrec: { method: 'percent', recognitionCurve: [0,7,15,25,34,44,54,64,74,84,93,100], recognisedToDate: 604450, forecastFull: 1100000 },
  },
];

export function getProject(id) {
  return projects.find(p => p.id === id) || projects[0];
}

export function fmt(n) {
  if (n >= 1000000) return `$${(n/1000000).toFixed(2)}M`;
  if (n >= 1000)    return `$${Math.round(n/1000)}K`;
  return `$${n}`;
}

export function fmtPct(n, budget) {
  const pct = ((n - budget) / budget * 100);
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
}

export function statusLabel(s) {
  return s === 'ok' ? 'On Track' : s === 'warn' ? 'At Risk' : 'Delayed';
}
