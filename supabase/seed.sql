-- ============================================================
-- SentraSafe AI — Supabase Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ------- DISTRICTS -------
insert into public.districts (state, name, center_lat, center_lng) values
('Kerala','Thiruvananthapuram',8.5241,76.9366),
('Kerala','Kollam',8.8932,76.6141),
('Kerala','Pathanamthitta',9.2648,76.7870),
('Kerala','Alappuzha',9.4981,76.3388),
('Kerala','Kottayam',9.5916,76.5222),
('Kerala','Idukki',10.0889,77.0595),
('Kerala','Ernakulam',9.9816,76.2999),
('Kerala','Thrissur',10.5276,76.2144),
('Kerala','Palakkad',10.7867,76.6548),
('Kerala','Malappuram',11.0510,76.0711),
('Kerala','Kozhikode',11.2588,75.7804),
('Kerala','Wayanad',11.6083,76.0838),
('Kerala','Kannur',11.8745,75.3704),
('Kerala','Kasaragod',12.4996,74.9869),
('Tamil Nadu','Chennai',13.0827,80.2707),
('Tamil Nadu','Coimbatore',11.0168,76.9558),
('Tamil Nadu','Erode',11.3410,77.7172),
('Tamil Nadu','Nilgiris',11.4102,76.6950),
('Tamil Nadu','Madurai',9.9252,78.1198),
('Tamil Nadu','Salem',11.6643,78.1460),
('Tamil Nadu','Tiruchirappalli',10.7905,78.7047),
('Tamil Nadu','Tirunelveli',8.7139,77.7567),
('Tamil Nadu','Vellore',12.9165,79.1325),
('Tamil Nadu','Kanyakumari',8.0883,77.5385),
('Tamil Nadu','Chengalpattu',12.6819,79.9880),
('Tamil Nadu','Krishnagiri',12.5186,78.2137),
('Tamil Nadu','Sivaganga',9.8479,78.4836)
on conflict do nothing;

-- ------- COLLEGES (with Nandha campuses) -------
insert into public.colleges (college_name, state, district, college_type, can_be_relief_center, latitude, longitude, contact_phone, address, emergency_number, admin_contact) values
('Nandha College of Technology','Tamil Nadu','Erode','Engineering',true,11.3410,77.7172,'+91-4242244888','Perundurai Rd, Erode','+91-4242244000','symonsaniya@gmail.com'),
('Nandha Engineering College','Tamil Nadu','Erode','Engineering',true,11.3495,77.7225,'+91-4242244999','Vaikkaalmedu, Erode','+91-4242244001','symonsaniya@gmail.com'),
('Kongu Engineering College','Tamil Nadu','Erode','Engineering',true,11.2698,77.6076,'+91-4294226602','Perundurai, Erode','+91-4294226600',null),
('IIT Madras','Tamil Nadu','Chennai','Engineering',true,12.9915,80.2337,'+91-4422578100','Sardar Patel Rd, Chennai','+91-4422578000',null),
('Anna University','Tamil Nadu','Chennai','University',true,13.0107,80.2352,'+91-4422351723','Guindy, Chennai','+91-4422351000',null),
('PSG College of Technology','Tamil Nadu','Coimbatore','Engineering',true,11.0244,77.0028,'+91-4222572177','Peelamedu, Coimbatore','+91-4222572000',null),
('Government College Ooty','Tamil Nadu','Nilgiris','Arts & Science',true,11.4131,76.6959,'+91-4232442334','Ooty Main Rd','+91-4232442000',null),
('Thiagarajar College of Engineering','Tamil Nadu','Madurai','Engineering',true,9.8853,78.0810,'+91-4522482240','Thiruparankundram, Madurai','+91-4522482000',null),
('SRM University Kattankulathur','Tamil Nadu','Chengalpattu','University',true,12.8231,80.0444,'+91-4427417000','Kattankulathur','+91-4427417100',null),
('Bharathidasan University','Tamil Nadu','Tiruchirappalli','University',true,10.7305,78.7580,'+91-4312407088','Palkalaiperur, Trichy','+91-4312407000',null),
('Government College of Engineering Salem','Tamil Nadu','Salem','Engineering',true,11.6740,78.1230,'+91-4272346424','Salem','+91-4272346000',null),
('Manonmaniam Sundaranar University','Tamil Nadu','Tirunelveli','University',true,8.6849,77.7379,'+91-4622333741','Abishekapatti, Tirunelveli','+91-4622333000',null),
('Alagappa University','Tamil Nadu','Sivaganga','University',true,9.9138,78.7970,'+91-4565223125','Karaikudi, Sivaganga','+91-4565223000',null),
('Vellore Institute of Technology','Tamil Nadu','Vellore','University',true,12.9692,79.1559,'+91-4162202020','Katpadi, Vellore','+91-4162202000',null),
('Government Engineering College Wayanad','Kerala','Wayanad','Engineering',true,11.6250,76.0900,'+91-4936256211','Mananthavady, Wayanad','+91-4936256000',null),
('College of Engineering Munnar','Kerala','Idukki','Engineering',true,10.0800,77.0600,'+91-4865234567','Munnar, Idukki','+91-4865234000',null),
('St. Thomas College Thrissur','Kerala','Thrissur','Arts & Science',true,10.5215,76.2131,'+91-4872420080','Thrissur','+91-4872420000',null),
('TKM College of Engineering','Kerala','Kollam','Engineering',true,8.9130,76.6300,'+91-4742712024','Karicode, Kollam','+91-4742712000',null),
('College of Engineering Trivandrum','Kerala','Thiruvananthapuram','Engineering',true,8.5443,76.9052,'+91-4712515555','Sreekariyam, TVM','+91-4712515000',null),
('Cochin University of Science and Technology','Kerala','Ernakulam','University',true,10.0459,76.3272,'+91-4842577550','Kalamassery, Ernakulam','+91-4842577000',null),
('NIT Calicut','Kerala','Kozhikode','Engineering',true,11.3208,75.9345,'+91-4952286100','NIT Campus, Kozhikode','+91-4952286000',null),
('Kannur University','Kerala','Kannur','University',true,11.8745,75.3704,'+91-4972806000','Thavakkara, Kannur','+91-4972806100',null),
('Central University of Kerala','Kerala','Kasaragod','University',true,12.4996,74.9869,'+91-4994256400','Periye, Kasaragod','+91-4994256000',null),
('Government Engineering College Palakkad','Kerala','Palakkad','Engineering',true,10.7867,76.6548,'+91-4922282122','Sreekrishnapuram, Palakkad','+91-4922282000',null),
('Government College Kottayam','Kerala','Kottayam','Arts & Science',true,9.5916,76.5222,'+91-4812562374','Nattakom, Kottayam','+91-4812562000',null),
('Catholicate College Pathanamthitta','Kerala','Pathanamthitta','Arts & Science',true,9.2648,76.7870,'+91-4682222223','Pathanamthitta','+91-4682222000',null),
('SD College Alappuzha','Kerala','Alappuzha','Arts & Science',true,9.4981,76.3388,'+91-4772243403','Alappuzha','+91-4772243000',null),
('Government College Malappuram','Kerala','Malappuram','Arts & Science',true,11.0510,76.0711,'+91-4832734844','Malappuram','+91-4832734000',null)
on conflict do nothing;

-- ------- SHELTERS -------
insert into public.shelters (shelter_name, state, district, max_capacity, occupied_spots, latitude, longitude, contact_phone, address) values
('Anna Nagar Community Hall','Tamil Nadu','Chennai',400,120,13.0850,80.2101,'+91-9840012301','Anna Nagar West, Chennai'),
('Marina Relief Camp','Tamil Nadu','Chennai',600,340,13.0500,80.2824,'+91-9840012302','Marina Beach Rd, Chennai'),
('Coimbatore Central Shelter','Tamil Nadu','Coimbatore',500,210,11.0168,76.9558,'+91-9840012303','RS Puram, Coimbatore'),
('Ooty Hillside Shelter','Tamil Nadu','Nilgiris',200,60,11.4102,76.6950,'+91-9840012304','Charring Cross, Ooty'),
('Erode Community Shelter','Tamil Nadu','Erode',300,90,11.3410,77.7172,'+91-4242244555','Bhavani Road, Erode'),
('Kalpetta Relief Center','Kerala','Wayanad',350,190,11.6083,76.0838,'+91-9847012305','Kalpetta Town, Wayanad'),
('Munnar Emergency Shelter','Kerala','Idukki',250,80,10.0889,77.0595,'+91-9847012306','Munnar Center, Idukki'),
('Thrissur Town Hall Shelter','Kerala','Thrissur',400,100,10.5276,76.2144,'+91-9847012307','Swaraj Round, Thrissur'),
('Kollam Beach Shelter','Kerala','Kollam',300,150,8.8932,76.6141,'+91-9847012308','Kollam Beach Rd'),
('TVM Central Shelter','Kerala','Thiruvananthapuram',500,210,8.5241,76.9366,'+91-9847012309','MG Rd, Thiruvananthapuram')
on conflict do nothing;

-- ------- HOSPITALS -------
insert into public.hospitals (hospital_name, state, district, hospital_type, bed_capacity, available_beds, latitude, longitude, contact_phone, address) values
('Apollo Hospital Chennai','Tamil Nadu','Chennai','Multi-Specialty',500,120,13.0637,80.2521,'+91-4428293333','Greams Rd, Chennai'),
('Rajiv Gandhi Govt Hospital','Tamil Nadu','Chennai','Government',800,260,13.0827,80.2707,'+91-4425305000','Park Town, Chennai'),
('PSG Hospital Coimbatore','Tamil Nadu','Coimbatore','Multi-Specialty',900,340,11.0244,77.0028,'+91-4222570170','Peelamedu, Coimbatore'),
('Erode Government Hospital','Tamil Nadu','Erode','Government',400,120,11.3410,77.7172,'+91-4242244123','Perundurai Rd, Erode'),
('Ooty Govt Hospital','Tamil Nadu','Nilgiris','Government',200,55,11.4133,76.6980,'+91-4232442218','Hospital Rd, Ooty'),
('Wayanad Institute of Medical Sciences','Kerala','Wayanad','Multi-Specialty',450,130,11.6820,76.1315,'+91-4936355555','Meppadi, Wayanad'),
('Idukki District Hospital','Kerala','Idukki','Government',300,90,9.8497,76.9681,'+91-4862232310','Painavu, Idukki'),
('Amala Institute of Medical Sciences','Kerala','Thrissur','Multi-Specialty',800,280,10.5470,76.2110,'+91-4872307000','Amala Nagar, Thrissur'),
('Kollam District Hospital','Kerala','Kollam','Government',400,110,8.8790,76.5980,'+91-4742793015','Kollam, Kerala'),
('SCTIMST Thiruvananthapuram','Kerala','Thiruvananthapuram','Speciality',550,170,8.5450,76.9020,'+91-4712524140','Poojappura, TVM')
on conflict do nothing;

-- ------- HAZARD ZONES -------
insert into public.hazard_zones (name, state, district, hazard_type, risk_level, latitude, longitude, rules_json) values
('Chennai Coastal Flood Zone','Tamil Nadu','Chennai','flood','high',13.0500,80.2824,'{"rainfall_mm":180}'),
('Nilgiris Landslide Belt','Tamil Nadu','Nilgiris','landslide','severe',11.4102,76.6950,'{"slope_movement_mm":45}'),
('Erode River Basin Flood','Tamil Nadu','Erode','flood','medium',11.3410,77.7172,'{"rainfall_mm":120}'),
('Wayanad Landslide Sector','Kerala','Wayanad','landslide','severe',11.6083,76.0838,'{"slope_movement_mm":60}'),
('Idukki Reservoir Overflow Zone','Kerala','Idukki','flood','high',10.0889,77.0595,'{"rainfall_mm":200}'),
('Thrissur Lowland Flood','Kerala','Thrissur','flood','medium',10.5276,76.2144,'{"rainfall_mm":130}'),
('TVM Coastal Surge Zone','Kerala','Thiruvananthapuram','flood','medium',8.5241,76.9366,'{"rainfall_mm":140}'),
('Kollam Backwater Flood','Kerala','Kollam','flood','medium',8.8932,76.6141,'{"rainfall_mm":135}')
on conflict do nothing;

-- ------- CAMPUS CONTACTS (seed each college with 6 roles) -------
insert into public.campus_contacts (college_id, contact_name, role_type, phone, is_primary)
select c.id, x.name, x.role, '+91-98' || substr(md5(random()::text || c.id::text || x.role), 1, 8), x.primary
from public.colleges c
cross join (values
  ('Prof. Rajesh Kumar','professor', true),
  ('Cadet Officer Vikram','ncc', false),
  ('Security Chief Suresh','security', false),
  ('Emergency Coordinator Priya','coordinator', false),
  ('Dr. Meera Nair','medical', false),
  ('Campus Admin Anitha','admin', false)
) as x(name, role, primary)
on conflict do nothing;

-- ------- OWNER PROFILE (super-admin) -------
-- Note: after auth user sign-up for symonsaniya@gmail.com, link the profile:
-- update public.user_profiles set auth_user_id = (select id from auth.users where email='symonsaniya@gmail.com') where email='symonsaniya@gmail.com';
insert into public.user_profiles (role, full_name, email, phone, state, district, preferred_language, campus_role, linked_campus_id)
select 'campus','Owner (Saniya)','symonsaniya@gmail.com','+91-9999900000','Tamil Nadu','Erode','en','admin', c.id
from public.colleges c where c.college_name = 'Nandha College of Technology'
on conflict do nothing;
