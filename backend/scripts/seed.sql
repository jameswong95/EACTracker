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
  ('sara.tan',     'Sara Tan',          'ST', 'PM'),
  ('a.kumar',      'Amara Kumar',       'AK', 'PM'),
  ('nadia.hassan', 'Nadia Hassan',      'NH', 'PM'),
  ('sam.okonkwo',  'Sam Okonkwo',       'SO', 'PM'),
  ('k.rajah',      'K. Rajah',          'KR', 'PD'),
  ('marcus.tan',   'Marcus Tan',        'MT', 'PD'),
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
INSERT INTO project_resources (project_id, resource_id, role_name, function_title, grade, fte_allocations) VALUES
('PR-2025-014','r02','Isabelle Dupont','Programme Manager','E4',
  '[{"year":2026,"month":1,"fte":0.5},{"year":2026,"month":2,"fte":0.5},{"year":2026,"month":3,"fte":0.5},{"year":2026,"month":4,"fte":0.5},{"year":2026,"month":5,"fte":0.5},{"year":2026,"month":6,"fte":0.5},{"year":2026,"month":7,"fte":0.5},{"year":2026,"month":8,"fte":0.5}]'),
('PR-2025-014','r05','Rachel Lim',     'Technical Lead',   'E3',
  '[{"year":2026,"month":1,"fte":1},{"year":2026,"month":2,"fte":1},{"year":2026,"month":3,"fte":1},{"year":2026,"month":4,"fte":1},{"year":2026,"month":5,"fte":1},{"year":2026,"month":6,"fte":1},{"year":2026,"month":7,"fte":1},{"year":2026,"month":8,"fte":1}]'),
('PR-2025-014','r08','James Chen',     'Engineer',         'E2',
  '[{"year":2026,"month":1,"fte":2},{"year":2026,"month":2,"fte":2},{"year":2026,"month":3,"fte":2},{"year":2026,"month":4,"fte":2},{"year":2026,"month":5,"fte":2},{"year":2026,"month":6,"fte":2},{"year":2026,"month":7,"fte":2}]'),
('PR-2025-014','r12','Tom Whitfield',  'Business Analyst', 'E1',
  '[{"year":2026,"month":1,"fte":1},{"year":2026,"month":2,"fte":1},{"year":2026,"month":3,"fte":1},{"year":2026,"month":4,"fte":1},{"year":2026,"month":5,"fte":1}]'),
('PR-2026-022','r03','Amara Osei',     'Programme Manager','E4',
  '[{"year":2026,"month":1,"fte":0.5},{"year":2026,"month":2,"fte":0.5},{"year":2026,"month":3,"fte":0.5},{"year":2026,"month":4,"fte":0.5},{"year":2026,"month":5,"fte":0.5},{"year":2026,"month":6,"fte":0.5},{"year":2026,"month":7,"fte":0.5},{"year":2026,"month":8,"fte":0.5},{"year":2026,"month":9,"fte":0.5}]'),
('PR-2026-022','r04','Sam Okonkwo',    'Network Lead',     'E3',
  '[{"year":2026,"month":1,"fte":1},{"year":2026,"month":2,"fte":1},{"year":2026,"month":3,"fte":1},{"year":2026,"month":4,"fte":1},{"year":2026,"month":5,"fte":1},{"year":2026,"month":6,"fte":1},{"year":2026,"month":7,"fte":1},{"year":2026,"month":8,"fte":1},{"year":2026,"month":9,"fte":1},{"year":2026,"month":10,"fte":1}]'),
('PR-2026-022','r10','Kevin Zhang',    'Engineer',         'E2',
  '[{"year":2026,"month":1,"fte":1},{"year":2026,"month":2,"fte":1},{"year":2026,"month":3,"fte":2},{"year":2026,"month":4,"fte":2},{"year":2026,"month":5,"fte":2},{"year":2026,"month":6,"fte":2},{"year":2026,"month":7,"fte":2},{"year":2026,"month":8,"fte":1},{"year":2026,"month":9,"fte":1}]'),
('PR-2026-031','r01','Marcus Tan',     'Programme Director','E5',
  '[{"year":2026,"month":3,"fte":0.3},{"year":2026,"month":4,"fte":0.3},{"year":2026,"month":5,"fte":0.3},{"year":2026,"month":6,"fte":0.3}]'),
('PR-2026-031','r07','Ravi Kumar',     'Technical Lead',   'E3',
  '[{"year":2026,"month":3,"fte":1},{"year":2026,"month":4,"fte":1},{"year":2026,"month":5,"fte":1},{"year":2026,"month":6,"fte":1},{"year":2026,"month":7,"fte":1},{"year":2026,"month":8,"fte":1}]'),
('PR-2026-008','r06','Nadia Hassan',   'Project Manager',  'E3',
  '[{"year":2025,"month":11,"fte":1},{"year":2025,"month":12,"fte":1},{"year":2026,"month":1,"fte":1},{"year":2026,"month":2,"fte":1},{"year":2026,"month":3,"fte":1},{"year":2026,"month":4,"fte":1},{"year":2026,"month":5,"fte":1}]'),
('PR-2026-008','r09','Priya Sharma',   'Security Engineer','E2',
  '[{"year":2025,"month":11,"fte":2},{"year":2025,"month":12,"fte":2},{"year":2026,"month":1,"fte":2},{"year":2026,"month":2,"fte":2},{"year":2026,"month":3,"fte":2},{"year":2026,"month":4,"fte":2},{"year":2026,"month":5,"fte":2}]')
ON CONFLICT DO NOTHING;

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
    VALUES ('PR-2025-014','labour',  'Labour (blended)',     0) RETURNING id INTO r1;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2025-014','hardware','Hardware / Materials', 1) RETURNING id INTO r2;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2025-014','subcon',  'Sub-contractor',       2) RETURNING id INTO r3;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2025-014','reserve', 'PM Reserve',           3) RETURNING id INTO r4;

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
    VALUES ('PR-2026-022','labour',  'Labour (blended)',     0) RETURNING id INTO r5;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-022','materials','Materials / Hardware',1) RETURNING id INTO r6;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-022','subcon',  'Sub-contractor',       2) RETURNING id INTO r7;

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
    VALUES ('PR-2026-031','labour',  'Labour (blended)',     0) RETURNING id INTO r8;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-031','services','Migration Services',   1) RETURNING id INTO r9;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-031','hardware','Hardware / Infra',     2) RETURNING id INTO r10;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-031','reserve', 'Contingency',          3) RETURNING id INTO r11;

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
    VALUES ('PR-2026-008','labour',  'Labour (blended)',     0) RETURNING id INTO r12;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-008','software','Software / Licences',  1) RETURNING id INTO r13;
  INSERT INTO eac_monthly_rows (project_id, cost_category, label, sort_order)
    VALUES ('PR-2026-008','subcon',  'Sub-contractor',       2) RETURNING id INTO r14;

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

