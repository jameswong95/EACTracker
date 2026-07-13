-- =============================================================
-- EAC Tracker — seed data (idempotent via ON CONFLICT DO NOTHING)
-- Run with: psql $DATABASE_URL -f scripts/seed.sql
-- =============================================================

-- -- resource_grades --
INSERT INTO resource_grades (grade, title, daily_rate, monthly_rate) VALUES
  ('E1', 'Junior Engineer / Analyst',       220,   4840),
  ('E2', 'Engineer',                         285,   6270),
  ('E3', 'Senior Engineer / Tech Lead',      360,   7920),
  ('E4', 'Principal / Programme Manager',    460,  10120),
  ('E5', 'Director / Chief',                 580,  12760)
ON CONFLICT (grade) DO NOTHING;

-- -- users --
INSERT INTO users (username, full_name, initials, role) VALUES
  ('sara.tan',     'Sara Tan',          'ST', 'Project Manager'),
  ('a.kumar',      'Amara Kumar',       'AK', 'Project Manager'),
  ('nadia.hassan', 'Nadia Hassan',      'NH', 'Project Manager'),
  ('sam.okonkwo',  'Sam Okonkwo',       'SO', 'Project Manager'),
  ('k.rajah',      'K. Rajah',          'KR', 'Project Director'),
  ('marcus.tan',   'Marcus Tan',        'MT', 'Project Director'),
  ('j.chen',       'Jennifer Chen',     'JC', 'Leader'),
  ('l.cheng',      'L. Cheng',          'LC', 'Finance'),
  ('admin',        'System Admin',      'AD', 'Admin')
ON CONFLICT (username) DO NOTHING;

-- -- resource_pool --
INSERT INTO resource_pool (id, name, grade) VALUES
  ('r01', 'Marcus Tan',      'E5'),
  ('r02', 'Isabelle Dupont', 'E4'),
  ('r03', 'Amara Osei',      'E4'),
  ('r04', 'Sam Okonkwo',     'E3'),
  ('r05', 'Rachel Lim',      'E3'),
  ('r06', 'Nadia Hassan',    'E3'),
  ('r07', 'Ravi Kumar',      'E3'),
  ('r08', 'James Chen',      'E2'),
  ('r09', 'Priya Sharma',    'E2'),
  ('r10', 'Kevin Zhang',     'E2'),
  ('r11', 'Yuki Tanaka',     'E2'),
  ('r12', 'Tom Whitfield',   'E1'),
  ('r13', 'Sofia Ng',        'E1'),
  ('r14', 'Callum Murray',   'E1'),
  ('r15', 'Daniel Lee',      'E1')
ON CONFLICT (id) DO NOTHING;

-- -- projects --
-- Resolve user IDs dynamically so insert order doesn't matter.
DO $$
DECLARE
  pm_sara    INT := (SELECT id FROM users WHERE username = 'sara.tan');
  pm_amara   INT := (SELECT id FROM users WHERE username = 'a.kumar');
  pm_nadia   INT := (SELECT id FROM users WHERE username = 'nadia.hassan');
  pm_sam     INT := (SELECT id FROM users WHERE username = 'sam.okonkwo');
  pd_rajah   INT := (SELECT id FROM users WHERE username = 'k.rajah');
  pd_marcus  INT := (SELECT id FROM users WHERE username = 'marcus.tan');
BEGIN

  INSERT INTO projects (
    id, name, wbs_code, sap_project_no, customer, department,
    pm_user_id, pd_user_id, status,
    start_date, end_date,
    contract_value, initial_budget, budget, eac, actual, committed,
    rev_recognised, progress_billing, gr_profit_sap,
    revrec_method, last_update
  ) VALUES
  (
    'PR-2025-014', 'EAC Refresh Programme',
    '123456789/001-1', '123456789', 'Internal', 'Technology',
    pm_sara, pd_rajah, 'ok',
    '2025-01-15', '2026-12-31',
    1500000, 1200000, 1200000, 1240000, 540000, 180000,
    686400, 540000, 146400,
    'milestone', '2026-05-05'
  ),
  (
    'PR-2026-022', 'Network Modernisation',
    '234567890/002-1', '234567890', 'MOD Agency', 'Infrastructure',
    pm_amara, pd_rajah, 'warn',
    '2026-01-10', '2027-02-28',
    1100000, 900000, 900000, 880000, 320000, 210000,
    350000, 320000, 30000,
    'milestone', '2026-05-02'
  ),
  (
    'PR-2026-031', 'Data Centre Migration',
    '345678901/003-1', '345678901', 'FinCorp Ltd', 'Technology',
    pm_sam, pd_marcus, 'ok',
    '2026-03-01', '2027-06-30',
    2200000, 1900000, 1900000, 1920000, 280000, 320000,
    140000, 280000, -140000,
    'progress_claim', '2026-05-08'
  ),
  (
    'PR-2026-008', 'Cybersecurity Uplift',
    '456789012/004-1', '456789012', 'GovTech', 'Security',
    pm_nadia, pd_rajah, 'bad',
    '2025-11-01', '2026-09-30',
    750000, 620000, 620000, 710000, 480000, 80000,
    440000, 480000, -40000,
    'milestone', '2026-05-01'
  )
  ON CONFLICT (id) DO NOTHING;

END $$;

UPDATE projects
   SET end_date = '2028-12-31'
 WHERE id = 'PR-2026-022'
   AND (end_date IS NULL OR end_date < '2028-12-31');

UPDATE projects
   SET end_date = '2035-12-31'
 WHERE id = 'PR-2026-031'
   AND (end_date IS NULL OR end_date < '2035-12-31');

INSERT INTO project_pm_assignments (project_id, user_id, is_lead)
SELECT id, pm_user_id, TRUE
FROM projects
WHERE pm_user_id IS NOT NULL
ON CONFLICT (project_id, user_id) DO UPDATE
  SET is_lead = project_pm_assignments.is_lead OR EXCLUDED.is_lead;

-- -- sub_jobs --
INSERT INTO sub_jobs (project_id, wbs_code, wbs_suffix, name, sort_order,
                      lab, foh, mat, doc, sco, tot_cost, com_cst, plan_cos,
                      etc_lab, etc_foh, etc_mat, etc_doc, etc_sco) VALUES
-- PR-2025-014
('PR-2025-014','123456789/001-1-1','001-1-1','Project Management',  0,  72000,  8000,     0,  2000,     0,  82000,  12000, 180000,  68000,  8000,     0,  2000,     0),
('PR-2025-014','123456789/001-1-2','001-1-2','Main Contractor',      1, 268000, 28000,140000, 12000, 60000, 508000, 148000, 820000, 188000, 20000, 72000,  8000, 52000),
('PR-2025-014','123456789/001-1-3','001-1-3','Miscellaneous',        2,  30000,  4000, 18000,  4000,  4000,  60000,  20000, 200000,  48000,  6000, 32000,  8000,  8000),
-- PR-2026-022
('PR-2026-022','234567890/002-1-1','002-1-1','Project Management',  0,  64000,  6000,     0,  2000,     0,  72000,  20000, 180000,  52000,  6000,     0,  2000,     0),
('PR-2026-022','234567890/002-1-2','002-1-2','Main Contractor',      1, 148000, 16000, 34000,  8000,  4000, 210000, 170000, 520000,  88000, 10000, 28000,  4000,  2000),
('PR-2026-022','234567890/002-1-3','002-1-3','Materials',            2,  14000,  2000, 28000,  2000,     0,  46000,  20000, 200000,  10000,  2000, 20000,  2000,     0),
-- PR-2026-031
('PR-2026-031','345678901/003-1-1','003-1-1','Project Management',  0,  80000,  8000,     0,  4000,     0,  92000,  40000, 250000,  88000,  8000,     0,  4000,     0),
('PR-2026-031','345678901/003-1-2','003-1-2','Migration Services',   1, 140000, 16000, 28000, 12000, 20000, 216000, 260000,1400000, 288000, 32000, 80000, 28000, 44000),
('PR-2026-031','345678901/003-1-3','003-1-3','Hardware & Infra',     2,  12000,  2000, 44000,  4000,  4000,  66000,  20000, 250000,  42000,  6000,128000, 10000, 10000),
-- PR-2026-008
('PR-2026-008','456789012/004-1-1','004-1-1','Project Management',  0,  96000, 10000,     0,  4000,     0, 110000,  10000, 120000,  44000,  6000,     0,  2000,     0),
('PR-2026-008','456789012/004-1-2','004-1-2','Security Controls',    1, 240000, 28000, 72000, 10000, 20000, 370000,  60000, 400000,  72000, 10000, 28000,  4000,  8000),
('PR-2026-008','456789012/004-1-3','004-1-3','Training & Audit',     2,  14000,  2000,     0, 10000,     0,  26000,  10000, 100000,  18000,  2000,     0,  8000,     0)
ON CONFLICT (wbs_code) DO NOTHING;

-- -- milestones --
INSERT INTO milestones (project_id, name, target_date, is_done, is_warning, sort_order) VALUES
-- PR-2025-014
('PR-2025-014','Kickoff',           '2025-01-20', TRUE,  FALSE, 0),
('PR-2025-014','Wave 1 complete',   '2026-02-28', TRUE,  FALSE, 1),
('PR-2025-014','Quality test rig',  '2026-05-20', FALSE, TRUE,  2),
('PR-2025-014','Wave 2 cutover',    '2026-07-31', FALSE, FALSE, 3),
('PR-2025-014','Closeout',          '2026-12-31', FALSE, FALSE, 4),
-- PR-2026-022
('PR-2026-022','Design sign-off',   '2026-01-31', TRUE,  FALSE, 0),
('PR-2026-022','Site A go-live',    '2026-03-31', TRUE,  FALSE, 1),
('PR-2026-022','Phase 2 cabling',   '2026-06-30', FALSE, TRUE,  2),
('PR-2026-022','Final acceptance',  '2027-02-28', FALSE, FALSE, 3),
-- PR-2026-031
('PR-2026-031','Kickoff',           '2026-03-10', TRUE,  FALSE, 0),
('PR-2026-031','Design freeze',     '2026-05-31', FALSE, FALSE, 1),
('PR-2026-031','Pilot migration',   '2026-09-30', FALSE, FALSE, 2),
('PR-2026-031','Full cutover',      '2027-03-31', FALSE, FALSE, 3),
('PR-2026-031','Closeout',          '2027-06-30', FALSE, FALSE, 4),
-- PR-2026-008
('PR-2026-008','Kickoff',           '2025-11-10', TRUE,  FALSE, 0),
('PR-2026-008','Gap assessment',    '2026-01-31', TRUE,  FALSE, 1),
('PR-2026-008','Controls deploy',   '2026-05-31', FALSE, TRUE,  2),
('PR-2026-008','Pen test',          '2026-07-31', FALSE, FALSE, 3),
('PR-2026-008','Closeout',          '2026-09-30', FALSE, FALSE, 4)
ON CONFLICT DO NOTHING;

-- -- risks --
INSERT INTO risks (project_id, ref, title, impact, probability, mitigation, status) VALUES
('PR-2025-014','R1','Vendor lead time slippage',       'High',  'Medium','Dual-source contract in progress, close end-May.','open'),
('PR-2025-014','R2','Wave 2 headcount shortage',        'Medium','Low',   'Resourcing request submitted 10 May.',            'open'),
('PR-2026-022','R1','Sub-contractor resource constraint','High',  'High',  'Escalated to procurement for alternate vendor.',  'open'),
('PR-2026-022','R2','Site access delays',               'Low',   'Medium','Facility schedule confirmed for Jun.',            'monitor'),
('PR-2026-031','R1','Scope creep from client changes',  'High',  'Medium','Change control board established.',               'open'),
('PR-2026-031','R2','Data migration errors',            'High',  'Low',   'Full dry-run scheduled for Aug.',                 'open'),
('PR-2026-008','R1','Budget overrun',                   'High',  'High',  'Variance reported to PD; scope review in progress.','open'),
('PR-2026-008','R2','Key staff attrition',              'Medium','Low',   'Retention plan approved by HR.',                  'monitor')
ON CONFLICT DO NOTHING;

-- -- project_updates --
DO $$
DECLARE
  u_sara  INT := (SELECT id FROM users WHERE username = 'sara.tan');
  u_amara INT := (SELECT id FROM users WHERE username = 'a.kumar');
  u_nadia INT := (SELECT id FROM users WHERE username = 'nadia.hassan');
  u_sam   INT := (SELECT id FROM users WHERE username = 'sam.okonkwo');
BEGIN
  INSERT INTO project_updates (project_id, period_year, period_month, status, narrative, created_by) VALUES
  ('PR-2025-014',2026,5,'ok',  'Test rig 2/5 delivered. Vendor confirms remainder by 20 May. % complete +6.',u_sara),
  ('PR-2025-014',2026,4,'ok',  'Network swap completed. 4 days ahead of plan.',                              u_sara),
  ('PR-2025-014',2026,3,'warn','2 servers delayed by vendor; mitigation: expedite cost SGD 8K.',             u_sara),
  ('PR-2025-014',2026,2,'ok',  'Wave 1 closed on budget. Wave 2 kickoff next week.',                         u_sara),
  ('PR-2026-022',2026,5,'warn','Phase 2 cabling behind by 2 weeks. Sub-con resource constraint identified.', u_amara),
  ('PR-2026-022',2026,4,'ok',  'Core switch deployment complete across 3 sites.',                            u_amara),
  ('PR-2026-022',2026,3,'ok',  'Materials received. Staging underway.',                                      u_amara),
  ('PR-2026-031',2026,5,'ok',  'Design workshop concluded. Architecture signed off.',                        u_sam),
  ('PR-2026-031',2026,4,'ok',  'Kickoff complete. Workstream leads confirmed.',                               u_sam),
  ('PR-2026-008',2026,5,'bad', 'Budget overrun confirmed at 14.5%. Scope reduction options under review.',   u_nadia),
  ('PR-2026-008',2026,4,'warn','Controls deployment delayed 2 weeks. Overtime authorised.',                  u_nadia),
  ('PR-2026-008',2026,3,'ok',  'Gap assessment closed. 47 findings, 8 critical.',                            u_nadia)
  ON CONFLICT (project_id, period_year, period_month) DO NOTHING;
END $$;

-- -- project_resources --
WITH rows(project_id, resource_id, role_name, function_title, grade, category, wbs_code, fte_allocations) AS (VALUES
('PR-2025-014','r02','Isabelle Dupont','Programme Manager', 'E4','PM',  '123456789/001-1-1',
  '[{"year":2026,"month":1,"fte":0.5},{"year":2026,"month":2,"fte":0.5},{"year":2026,"month":3,"fte":0.5},{"year":2026,"month":4,"fte":0.5},{"year":2026,"month":5,"fte":0.5},{"year":2026,"month":6,"fte":0.5},{"year":2026,"month":7,"fte":0.5},{"year":2026,"month":8,"fte":0.5}]'::jsonb),
('PR-2025-014','r05','Rachel Lim',     'Technical Lead',    'E3','PM',  '123456789/001-1-2',
  '[{"year":2026,"month":1,"fte":1},{"year":2026,"month":2,"fte":1},{"year":2026,"month":3,"fte":1},{"year":2026,"month":4,"fte":1},{"year":2026,"month":5,"fte":1},{"year":2026,"month":6,"fte":1},{"year":2026,"month":7,"fte":1},{"year":2026,"month":8,"fte":1}]'::jsonb),
('PR-2025-014','r08','James Chen',     'Engineer',          'E2','PM',  '123456789/001-1-2',
  '[{"year":2026,"month":1,"fte":2},{"year":2026,"month":2,"fte":2},{"year":2026,"month":3,"fte":2},{"year":2026,"month":4,"fte":2},{"year":2026,"month":5,"fte":2},{"year":2026,"month":6,"fte":2},{"year":2026,"month":7,"fte":2}]'::jsonb),
('PR-2025-014','r12','Tom Whitfield',  'Business Analyst',  'E1','MISC','123456789/001-1-3',
  '[{"year":2026,"month":1,"fte":1},{"year":2026,"month":2,"fte":1},{"year":2026,"month":3,"fte":1},{"year":2026,"month":4,"fte":1},{"year":2026,"month":5,"fte":1}]'::jsonb),
('PR-2026-022','r03','Amara Osei',     'Programme Manager', 'E4','PM',  '234567890/002-1-1',
  '[{"year":2026,"month":1,"fte":0.5},{"year":2026,"month":2,"fte":0.5},{"year":2026,"month":3,"fte":0.5},{"year":2026,"month":4,"fte":0.5},{"year":2026,"month":5,"fte":0.5},{"year":2026,"month":6,"fte":0.5},{"year":2026,"month":7,"fte":0.5},{"year":2026,"month":8,"fte":0.5},{"year":2026,"month":9,"fte":0.5}]'::jsonb),
('PR-2026-022','r04','Sam Okonkwo',    'Network Lead',      'E3','PM',  '234567890/002-1-2',
  '[{"year":2026,"month":1,"fte":1},{"year":2026,"month":2,"fte":1},{"year":2026,"month":3,"fte":1},{"year":2026,"month":4,"fte":1},{"year":2026,"month":5,"fte":1},{"year":2026,"month":6,"fte":1},{"year":2026,"month":7,"fte":1},{"year":2026,"month":8,"fte":1},{"year":2026,"month":9,"fte":1},{"year":2026,"month":10,"fte":1}]'::jsonb),
('PR-2026-022','r10','Kevin Zhang',    'Engineer',          'E2','PM',  '234567890/002-1-2',
  '[{"year":2026,"month":1,"fte":1},{"year":2026,"month":2,"fte":1},{"year":2026,"month":3,"fte":2},{"year":2026,"month":4,"fte":2},{"year":2026,"month":5,"fte":2},{"year":2026,"month":6,"fte":2},{"year":2026,"month":7,"fte":2},{"year":2026,"month":8,"fte":1},{"year":2026,"month":9,"fte":1}]'::jsonb),
('PR-2026-022','r13','Sofia Ng',       'Site Coordinator',  'E1','MISC','234567890/002-1-3',
  '[{"year":2026,"month":5,"fte":0.5},{"year":2026,"month":6,"fte":0.5},{"year":2026,"month":7,"fte":0.5}]'::jsonb),
('PR-2026-031','r01','Marcus Tan',     'Programme Director','E5','PM',  '345678901/003-1-1',
  '[{"year":2026,"month":3,"fte":0.3},{"year":2026,"month":4,"fte":0.3},{"year":2026,"month":5,"fte":0.3},{"year":2026,"month":6,"fte":0.3}]'::jsonb),
('PR-2026-031','r07','Ravi Kumar',     'Technical Lead',    'E3','PM',  '345678901/003-1-2',
  '[{"year":2026,"month":3,"fte":1},{"year":2026,"month":4,"fte":1},{"year":2026,"month":5,"fte":1},{"year":2026,"month":6,"fte":1},{"year":2026,"month":7,"fte":1},{"year":2026,"month":8,"fte":1}]'::jsonb),
('PR-2026-031','r15','Daniel Lee',     'Cutover Support',   'E1','MISC','345678901/003-1-3',
  '[{"year":2026,"month":7,"fte":1},{"year":2026,"month":8,"fte":1},{"year":2026,"month":9,"fte":1}]'::jsonb),
('PR-2026-008','r06','Nadia Hassan',   'Project Manager',   'E3','PM',  '456789012/004-1-1',
  '[{"year":2025,"month":11,"fte":1},{"year":2025,"month":12,"fte":1},{"year":2026,"month":1,"fte":1},{"year":2026,"month":2,"fte":1},{"year":2026,"month":3,"fte":1},{"year":2026,"month":4,"fte":1},{"year":2026,"month":5,"fte":1}]'::jsonb),
('PR-2026-008','r09','Priya Sharma',   'Security Engineer', 'E2','PM',  '456789012/004-1-2',
  '[{"year":2025,"month":11,"fte":2},{"year":2025,"month":12,"fte":2},{"year":2026,"month":1,"fte":2},{"year":2026,"month":2,"fte":2},{"year":2026,"month":3,"fte":2},{"year":2026,"month":4,"fte":2},{"year":2026,"month":5,"fte":2}]'::jsonb),
('PR-2026-008','r11','Yuki Tanaka',    'Audit Analyst',     'E2','MISC','456789012/004-1-3',
  '[{"year":2026,"month":5,"fte":0.5},{"year":2026,"month":6,"fte":0.5},{"year":2026,"month":7,"fte":0.5}]'::jsonb)
)
INSERT INTO project_resources (project_id, resource_id, role_name, function_title, grade, category, sub_job_id, fte_allocations)
SELECT r.project_id, r.resource_id, r.role_name, r.function_title, r.grade, r.category, sj.id, r.fte_allocations
FROM rows r
LEFT JOIN sub_jobs sj ON sj.wbs_code = r.wbs_code
WHERE NOT EXISTS (
  SELECT 1
  FROM project_resources pr
  WHERE pr.project_id = r.project_id
    AND pr.resource_id = r.resource_id
    AND pr.function_title = r.function_title
);

WITH links(project_id, resource_id, function_title, category, wbs_code) AS (VALUES
  ('PR-2025-014','r02','Programme Manager', 'PM',  '123456789/001-1-1'),
  ('PR-2025-014','r05','Technical Lead',    'PM',  '123456789/001-1-2'),
  ('PR-2025-014','r08','Engineer',          'PM',  '123456789/001-1-2'),
  ('PR-2025-014','r12','Business Analyst',  'MISC','123456789/001-1-3'),
  ('PR-2026-022','r03','Programme Manager', 'PM',  '234567890/002-1-1'),
  ('PR-2026-022','r04','Network Lead',      'PM',  '234567890/002-1-2'),
  ('PR-2026-022','r10','Engineer',          'PM',  '234567890/002-1-2'),
  ('PR-2026-022','r13','Site Coordinator',  'MISC','234567890/002-1-3'),
  ('PR-2026-031','r01','Programme Director','PM',  '345678901/003-1-1'),
  ('PR-2026-031','r07','Technical Lead',    'PM',  '345678901/003-1-2'),
  ('PR-2026-031','r15','Cutover Support',   'MISC','345678901/003-1-3'),
  ('PR-2026-008','r06','Project Manager',   'PM',  '456789012/004-1-1'),
  ('PR-2026-008','r09','Security Engineer', 'PM',  '456789012/004-1-2'),
  ('PR-2026-008','r11','Audit Analyst',     'MISC','456789012/004-1-3')
)
UPDATE project_resources pr
SET category = l.category,
    sub_job_id = sj.id
FROM links l
LEFT JOIN sub_jobs sj ON sj.wbs_code = l.wbs_code
WHERE pr.project_id = l.project_id
  AND pr.resource_id = l.resource_id
  AND pr.function_title = l.function_title
  AND (pr.category IS DISTINCT FROM l.category OR pr.sub_job_id IS DISTINCT FROM sj.id);

-- -- material / sub-con / others LOB-MISC cost items --
DO $$
DECLARE
  u_sara  INT := (SELECT id FROM users WHERE username = 'sara.tan');
  u_amara INT := (SELECT id FROM users WHERE username = 'a.kumar');
  u_nadia INT := (SELECT id FROM users WHERE username = 'nadia.hassan');
  u_sam   INT := (SELECT id FROM users WHERE username = 'sam.okonkwo');
BEGIN
  WITH rows(project_id, wbs_code, category, description, amount, estimated_received_date, notes, created_by) AS (VALUES
    ('PR-2025-014','123456789/001-1-2','PM',  'Core network switches and optics',      96000,'2026-04-18'::date,'Estimated receipt for Wave 2 rollout hardware.',u_sara),
    ('PR-2025-014','123456789/001-1-2','PM',  'Test rig spares and installation kit',   78000,NULL::date,        'Forecast ETC pending final vendor quotation.',u_sara),
    ('PR-2025-014','123456789/001-1-3','MISC','Site consumables and patch leads',        22000,'2026-05-06'::date,'MISC material drawdown for late-stage works.',u_sara),
    ('PR-2026-022','234567890/002-1-3','PM',  'Access points and mounting kits',         52000,'2026-03-22'::date,'Estimated receipt for Site A deployment.',u_amara),
    ('PR-2026-022','234567890/002-1-2','MISC','Temporary cabling and labels',            18000,NULL::date,        'MISC forecast for phase 2 cabling recovery.',u_amara),
    ('PR-2026-031','345678901/003-1-3','PM',  'Migration staging storage',               64000,NULL::date,        'Forecast storage expansion for pilot migration.',u_sam),
    ('PR-2026-008','456789012/004-1-2','PM',  'Endpoint security licences',              48000,'2026-02-14'::date,'Estimated receipt for annual licence tranche.',u_nadia),
    ('PR-2026-008','456789012/004-1-3','MISC','Training lab tokens and certificates',     14000,NULL::date,        'MISC forecast for audit training materials.',u_nadia)
  )
  INSERT INTO material_items (project_id, sub_job_id, category, description, amount, estimated_received_date, notes, created_by)
  SELECT r.project_id, sj.id, r.category, r.description, r.amount, r.estimated_received_date, r.notes, r.created_by
  FROM rows r
  LEFT JOIN sub_jobs sj ON sj.wbs_code = r.wbs_code
  WHERE NOT EXISTS (
    SELECT 1 FROM material_items it
    WHERE it.project_id = r.project_id AND it.description = r.description
  );

  WITH rows(project_id, wbs_code, category, description, amount, estimated_received_date, notes, created_by) AS (VALUES
    ('PR-2025-014','123456789/001-1-2','PM',  'Cutover field engineering crew',          58000,'2026-05-02'::date,'Estimated receipt for night cutover support.',u_sara),
    ('PR-2025-014','123456789/001-1-3','MISC','Ad-hoc site reinstatement support',       24000,NULL::date,        'MISC forecast for closeout punch-list.',u_sara),
    ('PR-2026-022','234567890/002-1-2','PM',  'Structured cabling subcontractor',         88000,'2026-04-10'::date,'Estimated receipt for cabling crew support.',u_amara),
    ('PR-2026-022','234567890/002-1-2','PM',  'Additional weekend installation crew',     36000,NULL::date,        'Forecast recovery crew for delayed sites.',u_amara),
    ('PR-2026-031','345678901/003-1-2','PM',  'Data migration factory partner',          120000,'2026-05-18'::date,'Estimated receipt for migration partner mobilisation.',u_sam),
    ('PR-2026-031','345678901/003-1-3','MISC','Decommissioning disposal vendor',          28000,NULL::date,        'MISC forecast for legacy hardware disposal.',u_sam),
    ('PR-2026-008','456789012/004-1-2','PM',  'Pen-test specialist retainer',             42000,'2026-03-08'::date,'Estimated receipt for security testing retainer.',u_nadia),
    ('PR-2026-008','456789012/004-1-3','MISC','Independent audit reviewer',               26000,NULL::date,        'MISC forecast for final controls audit.',u_nadia)
  )
  INSERT INTO sub_con_items (project_id, sub_job_id, category, description, amount, estimated_received_date, notes, created_by)
  SELECT r.project_id, sj.id, r.category, r.description, r.amount, r.estimated_received_date, r.notes, r.created_by
  FROM rows r
  LEFT JOIN sub_jobs sj ON sj.wbs_code = r.wbs_code
  WHERE NOT EXISTS (
    SELECT 1 FROM sub_con_items it
    WHERE it.project_id = r.project_id AND it.description = r.description
  );

  WITH rows(project_id, wbs_code, description, amount, estimated_received_date, notes, created_by) AS (VALUES
    ('PR-2025-014','123456789/001-1-3','LOB travel and site allowance',       18500,NULL::date,        'LOB forecast for regional rollout visits.',u_sara),
    ('PR-2025-014','123456789/001-1-3','MISC permit and access passes',        6500,'2026-04-25'::date,'MISC estimated site access cost.',u_sara),
    ('PR-2026-022','234567890/002-1-3','LOB site survey expenses',            12000,'2026-03-12'::date,'LOB survey and transport claims.',u_amara),
    ('PR-2026-022','234567890/002-1-3','MISC overtime meal allowance',         9000,NULL::date,        'MISC forecast tied to weekend recovery plan.',u_amara),
    ('PR-2026-031','345678901/003-1-3','LOB data centre access fees',         21000,NULL::date,        'LOB forecast for secure migration windows.',u_sam),
    ('PR-2026-031','345678901/003-1-1','MISC client workshop expenses',        8000,'2026-05-03'::date,'MISC estimated workshop logistics.',u_sam),
    ('PR-2026-008','456789012/004-1-3','LOB compliance filing fees',          11000,'2026-04-18'::date,'LOB filing and regulator submission fees.',u_nadia),
    ('PR-2026-008','456789012/004-1-3','MISC training venue and materials',   16000,NULL::date,        'MISC forecast for security awareness sessions.',u_nadia)
  )
  INSERT INTO others_items (project_id, sub_job_id, description, amount, estimated_received_date, notes, created_by)
  SELECT r.project_id, sj.id, r.description, r.amount, r.estimated_received_date, r.notes, r.created_by
  FROM rows r
  LEFT JOIN sub_jobs sj ON sj.wbs_code = r.wbs_code
  WHERE NOT EXISTS (
    SELECT 1 FROM others_items it
    WHERE it.project_id = r.project_id AND it.description = r.description
  );

  INSERT INTO cost_item_schedule (entity_type, entity_id, year, month, amount)
  SELECT x.entity_type, x.entity_id, x.year, x.month, x.amount
  FROM (
    SELECT 'material_item' AS entity_type, id AS entity_id, 2026 AS year, 6 AS month, 42000::numeric AS amount FROM material_items WHERE project_id='PR-2025-014' AND description='Test rig spares and installation kit'
    UNION ALL SELECT 'material_item', id, 2026, 7, 36000 FROM material_items WHERE project_id='PR-2025-014' AND description='Test rig spares and installation kit'
    UNION ALL SELECT 'material_item', id, 2026, 6, 18000 FROM material_items WHERE project_id='PR-2026-022' AND description='Temporary cabling and labels'
    UNION ALL SELECT 'material_item', id, 2026, 7, 32000 FROM material_items WHERE project_id='PR-2026-031' AND description='Migration staging storage'
    UNION ALL SELECT 'material_item', id, 2026, 8, 32000 FROM material_items WHERE project_id='PR-2026-031' AND description='Migration staging storage'
    UNION ALL SELECT 'material_item', id, 2026, 6, 14000 FROM material_items WHERE project_id='PR-2026-008' AND description='Training lab tokens and certificates'
    UNION ALL SELECT 'sub_con_item',  id, 2026, 6, 24000 FROM sub_con_items WHERE project_id='PR-2025-014' AND description='Ad-hoc site reinstatement support'
    UNION ALL SELECT 'sub_con_item',  id, 2026, 6, 18000 FROM sub_con_items WHERE project_id='PR-2026-022' AND description='Additional weekend installation crew'
    UNION ALL SELECT 'sub_con_item',  id, 2026, 7, 18000 FROM sub_con_items WHERE project_id='PR-2026-022' AND description='Additional weekend installation crew'
    UNION ALL SELECT 'sub_con_item',  id, 2026, 9, 28000 FROM sub_con_items WHERE project_id='PR-2026-031' AND description='Decommissioning disposal vendor'
    UNION ALL SELECT 'sub_con_item',  id, 2026, 7, 26000 FROM sub_con_items WHERE project_id='PR-2026-008' AND description='Independent audit reviewer'
    UNION ALL SELECT 'others_item',   id, 2026, 6,  9000 FROM others_items WHERE project_id='PR-2025-014' AND description='LOB travel and site allowance'
    UNION ALL SELECT 'others_item',   id, 2026, 7,  9500 FROM others_items WHERE project_id='PR-2025-014' AND description='LOB travel and site allowance'
    UNION ALL SELECT 'others_item',   id, 2026, 6,  9000 FROM others_items WHERE project_id='PR-2026-022' AND description='MISC overtime meal allowance'
    UNION ALL SELECT 'others_item',   id, 2026, 8, 21000 FROM others_items WHERE project_id='PR-2026-031' AND description='LOB data centre access fees'
    UNION ALL SELECT 'others_item',   id, 2026, 6, 16000 FROM others_items WHERE project_id='PR-2026-008' AND description='MISC training venue and materials'
  ) x
  ON CONFLICT (entity_type, entity_id, year, month)
  DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW();
END $$;

-- -- eac_monthly_rows + values --
DO $$
DECLARE
  r1  INT; r2  INT; r3  INT; r4  INT;   -- PR-2025-014 row ids
  r5  INT; r6  INT; r7  INT;             -- PR-2026-022 row ids
  r8  INT; r9  INT; r10 INT; r11 INT;   -- PR-2026-031 row ids
  r12 INT; r13 INT; r14 INT;            -- PR-2026-008 row ids
BEGIN
  -- PR-2025-014 rows
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2025-014','labour',  'Labour (blended)',     0)
    ON CONFLICT (project_id, cost_category) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    RETURNING id INTO r1;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2025-014','hardware','Hardware / Materials', 1)
    ON CONFLICT (project_id, cost_category) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    RETURNING id INTO r2;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2025-014','subcon',  'Sub-contractor',       2)
    ON CONFLICT (project_id, cost_category) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    RETURNING id INTO r3;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2025-014','reserve', 'PM Reserve',           3)
    ON CONFLICT (project_id, cost_category) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    RETURNING id INTO r4;

  -- PR-2025-014 values (amount_k = thousands)
  INSERT INTO eac_monthly_values (row_id, project_id, year, month, amount_k, is_locked) VALUES
    (r1,'PR-2025-014',2026,1, 72, TRUE), (r1,'PR-2025-014',2026,2, 78, TRUE),
    (r1,'PR-2025-014',2026,3, 82, TRUE), (r1,'PR-2025-014',2026,4, 86, TRUE),
    (r1,'PR-2025-014',2026,5, 86, TRUE), (r1,'PR-2025-014',2026,6, 70, FALSE),
    (r1,'PR-2025-014',2026,7, 65, FALSE),(r1,'PR-2025-014',2026,8, 55, FALSE),
    (r1,'PR-2025-014',2026,9, 48, FALSE),(r1,'PR-2025-014',2026,10,30, FALSE),
    (r2,'PR-2025-014',2026,2, 45, TRUE), (r2,'PR-2025-014',2026,3, 88, TRUE),
    (r2,'PR-2025-014',2026,4, 96, TRUE), (r2,'PR-2025-014',2026,6, 80, FALSE),
    (r2,'PR-2025-014',2026,7,120, FALSE),
    (r3,'PR-2025-014',2026,1, 18, TRUE), (r3,'PR-2025-014',2026,2, 18, TRUE),
    (r3,'PR-2025-014',2026,3, 18, TRUE), (r3,'PR-2025-014',2026,4, 18, TRUE),
    (r3,'PR-2025-014',2026,5, 18, TRUE), (r3,'PR-2025-014',2026,6, 20, FALSE),
    (r3,'PR-2025-014',2026,7, 20, FALSE),(r3,'PR-2025-014',2026,8, 20, FALSE),
    (r3,'PR-2025-014',2026,9, 20, FALSE),(r3,'PR-2025-014',2026,10,20, FALSE),
    (r4,'PR-2025-014',2026,5, 18, FALSE)
  ON CONFLICT (row_id, year, month) DO NOTHING;

  -- PR-2026-022 rows
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-022','labour',  'Labour (blended)',     0)
    ON CONFLICT (project_id, cost_category) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    RETURNING id INTO r5;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-022','materials','Materials / Hardware',1)
    ON CONFLICT (project_id, cost_category) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    RETURNING id INTO r6;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-022','subcon',  'Sub-contractor',       2)
    ON CONFLICT (project_id, cost_category) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    RETURNING id INTO r7;

  INSERT INTO eac_monthly_values (row_id, project_id, year, month, amount_k, is_locked) VALUES
    (r5,'PR-2026-022',2026,1, 42, TRUE), (r5,'PR-2026-022',2026,2, 48, TRUE),
    (r5,'PR-2026-022',2026,3, 55, TRUE), (r5,'PR-2026-022',2026,4, 60, TRUE),
    (r5,'PR-2026-022',2026,5, 60, FALSE),(r5,'PR-2026-022',2026,6, 55, FALSE),
    (r5,'PR-2026-022',2026,7, 48, FALSE),(r5,'PR-2026-022',2026,8, 42, FALSE),
    (r5,'PR-2026-022',2026,9, 38, FALSE),
    (r6,'PR-2026-022',2026,2, 18, TRUE), (r6,'PR-2026-022',2026,3, 62, TRUE),
    (r6,'PR-2026-022',2026,4, 72, TRUE), (r6,'PR-2026-022',2026,5, 32, FALSE),
    (r6,'PR-2026-022',2026,7, 40, FALSE),
    (r7,'PR-2026-022',2026,1, 12, TRUE), (r7,'PR-2026-022',2026,2, 15, TRUE),
    (r7,'PR-2026-022',2026,3, 18, TRUE), (r7,'PR-2026-022',2026,4, 18, TRUE),
    (r7,'PR-2026-022',2026,5, 22, FALSE),(r7,'PR-2026-022',2026,6, 22, FALSE),
    (r7,'PR-2026-022',2026,7, 20, FALSE),(r7,'PR-2026-022',2026,8, 18, FALSE),
    (r7,'PR-2026-022',2026,9, 15, FALSE),(r7,'PR-2026-022',2026,10,12, FALSE)
  ON CONFLICT (row_id, year, month) DO NOTHING;

  -- PR-2026-031 rows
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-031','labour',  'Labour (blended)',     0)
    ON CONFLICT (project_id, cost_category) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    RETURNING id INTO r8;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-031','services','Migration Services',   1)
    ON CONFLICT (project_id, cost_category) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    RETURNING id INTO r9;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-031','hardware','Hardware / Infra',     2)
    ON CONFLICT (project_id, cost_category) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    RETURNING id INTO r10;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-031','reserve', 'Contingency',          3)
    ON CONFLICT (project_id, cost_category) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    RETURNING id INTO r11;

  INSERT INTO eac_monthly_values (row_id, project_id, year, month, amount_k, is_locked) VALUES
    (r8,'PR-2026-031',2026,3, 48, TRUE), (r8,'PR-2026-031',2026,4, 52, TRUE),
    (r8,'PR-2026-031',2026,5, 55, FALSE),(r8,'PR-2026-031',2026,6, 60, FALSE),
    (r8,'PR-2026-031',2026,7, 60, FALSE),(r8,'PR-2026-031',2026,8, 58, FALSE),
    (r8,'PR-2026-031',2026,9, 55, FALSE),(r8,'PR-2026-031',2026,10,52, FALSE),
    (r8,'PR-2026-031',2026,11,48, FALSE),(r8,'PR-2026-031',2026,12,40, FALSE),
    (r9,'PR-2026-031',2026,4, 30, TRUE), (r9,'PR-2026-031',2026,5, 42, FALSE),
    (r9,'PR-2026-031',2026,6, 55, FALSE),(r9,'PR-2026-031',2026,7, 68, FALSE),
    (r9,'PR-2026-031',2026,8, 80, FALSE),(r9,'PR-2026-031',2026,9,100, FALSE),
    (r9,'PR-2026-031',2026,10,90, FALSE),(r9,'PR-2026-031',2026,11,80, FALSE),
    (r10,'PR-2026-031',2026,5, 22, FALSE),(r10,'PR-2026-031',2026,6, 28, FALSE),
    (r10,'PR-2026-031',2026,7, 35, FALSE),(r10,'PR-2026-031',2026,9, 40, FALSE),
    (r11,'PR-2026-031',2026,6, 20, FALSE),(r11,'PR-2026-031',2026,9, 30, FALSE)
  ON CONFLICT (row_id, year, month) DO NOTHING;

  -- PR-2026-008 rows
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-008','labour',  'Labour (blended)',     0)
    ON CONFLICT (project_id, cost_category) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    RETURNING id INTO r12;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-008','software','Software / Licences',  1)
    ON CONFLICT (project_id, cost_category) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    RETURNING id INTO r13;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-008','subcon',  'Sub-contractor',       2)
    ON CONFLICT (project_id, cost_category) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order
    RETURNING id INTO r14;

  INSERT INTO eac_monthly_values (row_id, project_id, year, month, amount_k, is_locked) VALUES
    (r12,'PR-2026-008',2025,11,68, TRUE),(r12,'PR-2026-008',2025,12,72, TRUE),
    (r12,'PR-2026-008',2026,1, 80, TRUE),(r12,'PR-2026-008',2026,2, 82, TRUE),
    (r12,'PR-2026-008',2026,3, 86, TRUE),(r12,'PR-2026-008',2026,4, 88, TRUE),
    (r12,'PR-2026-008',2026,5, 90, FALSE),(r12,'PR-2026-008',2026,6,80, FALSE),
    (r12,'PR-2026-008',2026,7, 60, FALSE),
    (r13,'PR-2026-008',2025,12,20, TRUE),(r13,'PR-2026-008',2026,2, 18, TRUE),
    (r13,'PR-2026-008',2026,4, 24, TRUE),(r13,'PR-2026-008',2026,6, 12, FALSE),
    (r14,'PR-2026-008',2025,11,10, TRUE),(r14,'PR-2026-008',2025,12,10, TRUE),
    (r14,'PR-2026-008',2026,1, 10, TRUE),(r14,'PR-2026-008',2026,2, 10, TRUE),
    (r14,'PR-2026-008',2026,3, 12, TRUE),(r14,'PR-2026-008',2026,4, 12, TRUE),
    (r14,'PR-2026-008',2026,5, 14, FALSE),(r14,'PR-2026-008',2026,6,14, FALSE)
  ON CONFLICT (row_id, year, month) DO NOTHING;

END $$;

-- -- adaptive planned-spend chart seed coverage --
-- PR-2026-008 remains short (~11 months) for monthly display.
-- PR-2026-022 spans ~3 years for quarterly display.
-- PR-2026-031 spans ~10 years for yearly display.
WITH rows(project_id, label, year, month, amount_k, is_locked) AS (VALUES
  -- PR-2026-022 quarterly-mode coverage through 2028.
  ('PR-2026-022','Labour (blended)',      2027,1, 35,FALSE),
  ('PR-2026-022','Labour (blended)',      2027,4, 32,FALSE),
  ('PR-2026-022','Labour (blended)',      2027,7, 28,FALSE),
  ('PR-2026-022','Labour (blended)',      2027,10,24,FALSE),
  ('PR-2026-022','Labour (blended)',      2028,1, 22,FALSE),
  ('PR-2026-022','Labour (blended)',      2028,4, 20,FALSE),
  ('PR-2026-022','Labour (blended)',      2028,7, 16,FALSE),
  ('PR-2026-022','Labour (blended)',      2028,10,12,FALSE),
  ('PR-2026-022','Materials / Hardware',  2027,2, 42,FALSE),
  ('PR-2026-022','Materials / Hardware',  2027,8, 30,FALSE),
  ('PR-2026-022','Materials / Hardware',  2028,3, 24,FALSE),
  ('PR-2026-022','Materials / Hardware',  2028,9, 18,FALSE),
  ('PR-2026-022','Sub-contractor',        2027,1, 18,FALSE),
  ('PR-2026-022','Sub-contractor',        2027,4, 18,FALSE),
  ('PR-2026-022','Sub-contractor',        2027,7, 15,FALSE),
  ('PR-2026-022','Sub-contractor',        2028,1, 12,FALSE),
  ('PR-2026-022','Sub-contractor',        2028,7, 10,FALSE),

  -- PR-2026-031 long programme coverage through 2035.
  ('PR-2026-031','Labour (blended)',      2027,1, 46,FALSE),
  ('PR-2026-031','Labour (blended)',      2027,7, 44,FALSE),
  ('PR-2026-031','Labour (blended)',      2028,1, 42,FALSE),
  ('PR-2026-031','Labour (blended)',      2028,7, 40,FALSE),
  ('PR-2026-031','Labour (blended)',      2029,1, 38,FALSE),
  ('PR-2026-031','Labour (blended)',      2029,7, 36,FALSE),
  ('PR-2026-031','Labour (blended)',      2030,1, 34,FALSE),
  ('PR-2026-031','Labour (blended)',      2030,7, 32,FALSE),
  ('PR-2026-031','Labour (blended)',      2031,1, 30,FALSE),
  ('PR-2026-031','Labour (blended)',      2031,7, 28,FALSE),
  ('PR-2026-031','Labour (blended)',      2032,1, 26,FALSE),
  ('PR-2026-031','Labour (blended)',      2032,7, 24,FALSE),
  ('PR-2026-031','Labour (blended)',      2033,1, 22,FALSE),
  ('PR-2026-031','Labour (blended)',      2033,7, 20,FALSE),
  ('PR-2026-031','Labour (blended)',      2034,1, 18,FALSE),
  ('PR-2026-031','Labour (blended)',      2034,7, 16,FALSE),
  ('PR-2026-031','Labour (blended)',      2035,1, 14,FALSE),
  ('PR-2026-031','Labour (blended)',      2035,7, 12,FALSE),
  ('PR-2026-031','Migration Services',    2027,3, 70,FALSE),
  ('PR-2026-031','Migration Services',    2027,9, 80,FALSE),
  ('PR-2026-031','Migration Services',    2028,3, 90,FALSE),
  ('PR-2026-031','Migration Services',    2028,9,100,FALSE),
  ('PR-2026-031','Migration Services',    2029,3, 90,FALSE),
  ('PR-2026-031','Migration Services',    2029,9, 82,FALSE),
  ('PR-2026-031','Migration Services',    2030,3, 72,FALSE),
  ('PR-2026-031','Migration Services',    2030,9, 62,FALSE),
  ('PR-2026-031','Migration Services',    2031,3, 52,FALSE),
  ('PR-2026-031','Migration Services',    2031,9, 45,FALSE),
  ('PR-2026-031','Migration Services',    2032,3, 38,FALSE),
  ('PR-2026-031','Migration Services',    2032,9, 32,FALSE),
  ('PR-2026-031','Migration Services',    2033,3, 28,FALSE),
  ('PR-2026-031','Migration Services',    2033,9, 24,FALSE),
  ('PR-2026-031','Migration Services',    2034,3, 20,FALSE),
  ('PR-2026-031','Migration Services',    2034,9, 18,FALSE),
  ('PR-2026-031','Migration Services',    2035,3, 15,FALSE),
  ('PR-2026-031','Migration Services',    2035,9, 12,FALSE),
  ('PR-2026-031','Hardware / Infra',      2027,2, 35,FALSE),
  ('PR-2026-031','Hardware / Infra',      2028,2, 42,FALSE),
  ('PR-2026-031','Hardware / Infra',      2029,2, 48,FALSE),
  ('PR-2026-031','Hardware / Infra',      2030,2, 45,FALSE),
  ('PR-2026-031','Hardware / Infra',      2031,2, 38,FALSE),
  ('PR-2026-031','Hardware / Infra',      2032,2, 32,FALSE),
  ('PR-2026-031','Hardware / Infra',      2033,2, 26,FALSE),
  ('PR-2026-031','Hardware / Infra',      2034,2, 20,FALSE),
  ('PR-2026-031','Hardware / Infra',      2035,2, 16,FALSE),
  ('PR-2026-031','Contingency',           2028,12,20,FALSE),
  ('PR-2026-031','Contingency',           2030,12,25,FALSE),
  ('PR-2026-031','Contingency',           2032,12,20,FALSE),
  ('PR-2026-031','Contingency',           2034,12,15,FALSE)
)
INSERT INTO eac_monthly_values (row_id, project_id, year, month, amount_k, is_locked)
SELECT rrow.id, r.project_id, r.year, r.month, r.amount_k, r.is_locked
FROM rows r
JOIN eac_monthly_rows rrow
  ON rrow.project_id = r.project_id
 AND rrow.label = r.label
ON CONFLICT (row_id, year, month)
DO UPDATE SET amount_k = EXCLUDED.amount_k,
              is_locked = EXCLUDED.is_locked;

-- -- revrec_entries --
DO $$
DECLARE
  m1 INT; m2 INT; m3 INT; m4 INT; m5 INT;   -- PR-2025-014 milestones
  m6 INT; m7 INT; m8 INT; m9 INT;            -- PR-2026-022 milestones
  fin INT := (SELECT id FROM users WHERE username = 'l.cheng');
BEGIN
  -- PR-2025-014 milestone IDs
  SELECT id INTO m1 FROM milestones WHERE project_id='PR-2025-014' AND name='Kickoff';
  SELECT id INTO m2 FROM milestones WHERE project_id='PR-2025-014' AND name='Wave 1 complete';
  SELECT id INTO m3 FROM milestones WHERE project_id='PR-2025-014' AND name='Quality test rig';
  SELECT id INTO m4 FROM milestones WHERE project_id='PR-2025-014' AND name='Wave 2 cutover';
  SELECT id INTO m5 FROM milestones WHERE project_id='PR-2025-014' AND name='Closeout';

  INSERT INTO revrec_entries (project_id, milestone_id, description, amount, is_locked, created_by) VALUES
    ('PR-2025-014', m1, 'Kickoff milestone recognition',         150000, TRUE, fin),
    ('PR-2025-014', m2, 'Wave 1 completion recognition',         350000, TRUE, fin),
    ('PR-2025-014', m3, 'Test rig delivery (partial)',            186400, FALSE, fin),
    ('PR-2025-014', m4, 'Wave 2 cutover recognition',            450000, FALSE, fin),
    ('PR-2025-014', m5, 'Final closeout recognition',            363600, FALSE, fin)
  ON CONFLICT DO NOTHING;

  -- PR-2026-022 milestone IDs
  SELECT id INTO m6 FROM milestones WHERE project_id='PR-2026-022' AND name='Design sign-off';
  SELECT id INTO m7 FROM milestones WHERE project_id='PR-2026-022' AND name='Site A go-live';
  SELECT id INTO m8 FROM milestones WHERE project_id='PR-2026-022' AND name='Phase 2 cabling';
  SELECT id INTO m9 FROM milestones WHERE project_id='PR-2026-022' AND name='Final acceptance';

  INSERT INTO revrec_entries (project_id, milestone_id, description, amount, is_locked, created_by) VALUES
    ('PR-2026-022', m6, 'Design sign-off recognition',           110000, TRUE,  fin),
    ('PR-2026-022', m7, 'Site A go-live recognition',            240000, TRUE,  fin),
    ('PR-2026-022', m8, 'Phase 2 cabling recognition',           275000, FALSE, fin),
    ('PR-2026-022', m9, 'Final acceptance recognition',          475000, FALSE, fin)
  ON CONFLICT DO NOTHING;

  -- PR-2026-031 progress-claim entries (monthly)
  INSERT INTO revrec_entries (project_id, period_year, period_month, description, amount, is_locked, created_by) VALUES
    ('PR-2026-031',2026,3, 'Mar progress claim',  70000, TRUE,  fin),
    ('PR-2026-031',2026,4, 'Apr progress claim',  70000, TRUE,  fin),
    ('PR-2026-031',2026,5, 'May progress claim',  80000, FALSE, fin),
    ('PR-2026-031',2026,6, 'Jun forecast',         90000, FALSE, fin),
    ('PR-2026-031',2026,7, 'Jul forecast',        100000, FALSE, fin),
    ('PR-2026-031',2026,8, 'Aug forecast',        110000, FALSE, fin),
    ('PR-2026-031',2026,9, 'Sep forecast',        120000, FALSE, fin),
    ('PR-2026-031',2026,10,'Oct forecast',        120000, FALSE, fin),
    ('PR-2026-031',2026,11,'Nov forecast',        110000, FALSE, fin),
    ('PR-2026-031',2026,12,'Dec forecast',        100000, FALSE, fin),
    ('PR-2026-031',2027,1, 'Jan 27 forecast',      90000, FALSE, fin),
    ('PR-2026-031',2027,2, 'Feb 27 forecast',      90000, FALSE, fin),
    ('PR-2026-031',2027,3, 'Mar 27 forecast',      90000, FALSE, fin),
    ('PR-2026-031',2027,4, 'Apr 27 forecast',      80000, FALSE, fin),
    ('PR-2026-031',2027,5, 'May 27 forecast',      80000, FALSE, fin),
    ('PR-2026-031',2027,6, 'Jun 27 closeout',      50000, FALSE, fin)
  ON CONFLICT DO NOTHING;

  -- PR-2026-008 — partial milestone-based
  INSERT INTO revrec_entries (project_id, period_year, period_month, description, amount, is_locked, created_by) VALUES
    ('PR-2026-008',2025,11,'Nov 25 recognition',  80000, TRUE,  fin),
    ('PR-2026-008',2025,12,'Dec 25 recognition',  80000, TRUE,  fin),
    ('PR-2026-008',2026,1, 'Jan 26 recognition',  80000, TRUE,  fin),
    ('PR-2026-008',2026,2, 'Feb 26 recognition',  80000, TRUE,  fin),
    ('PR-2026-008',2026,3, 'Mar 26 recognition',  80000, TRUE,  fin),
    ('PR-2026-008',2026,4, 'Apr 26 recognition',  80000, TRUE,  fin),
    ('PR-2026-008',2026,5, 'May 26 forecast',      80000, FALSE, fin),
    ('PR-2026-008',2026,6, 'Jun 26 forecast',      70000, FALSE, fin),
    ('PR-2026-008',2026,7, 'Jul 26 forecast',      70000, FALSE, fin),
    ('PR-2026-008',2026,8, 'Aug 26 forecast',      50000, FALSE, fin),
    ('PR-2026-008',2026,9, 'Sep 26 closeout',      50000, FALSE, fin)
  ON CONFLICT DO NOTHING;

END $$;

-- -- period_locks --
DO $$
DECLARE fin INT := (SELECT id FROM users WHERE username = 'l.cheng');
BEGIN
  INSERT INTO period_locks (period_year, period_month, is_locked, locked_by, locked_at) VALUES
    (2026,1,TRUE, fin, '2026-02-10 10:00:00+08'),
    (2026,2,TRUE, fin, '2026-03-10 10:48:00+08'),
    (2026,3,TRUE, fin, '2026-04-12 14:03:00+08'),
    (2026,4,TRUE, fin, '2026-05-12 09:30:00+08'),
    (2026,5,FALSE,NULL, NULL)
  ON CONFLICT (period_year, period_month) DO NOTHING;
END $$;

