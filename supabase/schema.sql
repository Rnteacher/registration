### D:\Projects\Goose\mashov-bridge\supabase\schema.sql
```sql
1: ### D:\Projects\Goose\mashov-bridge\supabase\schema.sql
2: ```sql
3: 1: create extension if not exists "uuid-ossp";
4: 2: 
5: 3: create table students (
6: 4:   id uuid default uuid_generate_v4() primary key,
7: 5:   full_name text not null,
8: 6:   mashov_id text unique not null,
9: 7:   group_name text not null,
10: 8:   checkin_token text unique not null,
11: 9:   device_id text unique,
12: 10:   created_at timestamptz default now()
13: 11: );
14: 12: 
15: 13: create table attendance_logs (
16: 14:   id uuid default uuid_generate_v4() primary key,
17: 15:   student_id uuid references students(id),
18: 16:   timestamp timestamptz default now(),
19: 17:   method text check (method in ('QR', 'NFC')),
20: 18:   lat float,
21: 19:   lng float,
22: 20:   is_verified_location boolean default false
23: 21: );
24: 22: 
25: 23: alter table students enable row level security;
26: 24: alter table attendance_logs enable row level security;
27: 25: 
28: 26: create policy "admins_full_access_students"
29: 27: on students for all
30: 28: using (auth.role() = 'authenticated')
31: 29: with check (auth.role() = 'authenticated');
32: 30: 
33: 31: create policy "public_select_students"
34: 32: on students for select
35: 33: using (true);
36: 34: 
37: 35: create policy "public_update_device_id"
38: 36: on students for update
39: 37: using (device_id is null)
40: 38: with check (device_id is not null);
41: 39: 
42: 40: create policy "admins_full_access_attendance"
43: 41: on attendance_logs for all
44: 42: using (auth.role() = 'authenticated')
45: 43: with check (auth.role() = 'authenticated');
46: 44: 
47: 45: create policy "students_insert_attendance"
48: 46: on attendance_logs for insert
49: 47: with check (true);
50: ```
51: 
52: ### D:\Projects\Goose\mashov-bridge\supabase\schema.sql
53: ```sql
54: 1: create extension if not exists "uuid-ossp";
55: 2: 
56: 3: create table students (
57: 4:   id uuid default uuid_generate_v4() primary key,
58: 5:   full_name text not null,
59: 6:   mashov_id text unique not null,
60: 7:   group_name text not null,
61: 8:   checkin_token text unique not null,
62: 9:   device_id text unique,
63: 10:   created_at timestamptz default now()
64: 11: );
65: 12: 
66: 13: create table attendance_logs (
67: 14:   id uuid default uuid_generate_v4() primary key,
68: 15:   student_id uuid references students(id),
69: 16:   timestamp timestamptz default now(),
70: 17:   method text check (method in ('QR', 'NFC')),
71: 18:   lat float,
72: 19:   lng float,
73: 20:   is_verified_location boolean default false
74: 21: );
75: 22: 
76: 23: alter table students enable row level security;
77: 24: alter table attendance_logs enable row level security;
78: 25: 
79: 26: create policy "admins_full_access_students"
80: 27: on students for all
81: 28: using (auth.role() = 'authenticated')
82: 29: with check (auth.role() = 'authenticated');
83: 30: 
84: 31: create policy "public_select_students"
85: 32: on students for select
86: 33: using (true);
87: 34: 
88: 35: create policy "public_update_device_id"
89: 36: on students for update
90: 37: using (device_id is null)
91: 38: with check (device_id is not null);
92: 39: 
93: 40: create policy "admins_full_access_attendance"
94: 41: on attendance_logs for all
95: 42: using (auth.role() = 'authenticated')
96: 43: with check (auth.role() = 'authenticated');
97: 44: 
98: 45: create policy "students_insert_attendance"
99: 46: on attendance_logs for insert
100: 47: with check (true);
101: ```
102: 
103: create unique index if not exists attendance_unique_daily on attendance_logs (student_id, (timestamp::date));
```

### D:\Projects\Goose\mashov-bridge\supabase\schema.sql
```sql
1: ### D:\Projects\Goose\mashov-bridge\supabase\schema.sql
2: ```sql
3: 1: create extension if not exists "uuid-ossp";
4: 2: 
5: 3: create table students (
6: 4:   id uuid default uuid_generate_v4() primary key,
7: 5:   full_name text not null,
8: 6:   mashov_id text unique not null,
9: 7:   group_name text not null,
10: 8:   checkin_token text unique not null,
11: 9:   device_id text unique,
12: 10:   created_at timestamptz default now()
13: 11: );
14: 12: 
15: 13: create table attendance_logs (
16: 14:   id uuid default uuid_generate_v4() primary key,
17: 15:   student_id uuid references students(id),
18: 16:   timestamp timestamptz default now(),
19: 17:   method text check (method in ('QR', 'NFC')),
20: 18:   lat float,
21: 19:   lng float,
22: 20:   is_verified_location boolean default false
23: 21: );
24: 22: 
25: 23: alter table students enable row level security;
26: 24: alter table attendance_logs enable row level security;
27: 25: 
28: 26: create policy "admins_full_access_students"
29: 27: on students for all
30: 28: using (auth.role() = 'authenticated')
31: 29: with check (auth.role() = 'authenticated');
32: 30: 
33: 31: create policy "public_select_students"
34: 32: on students for select
35: 33: using (true);
36: 34: 
37: 35: create policy "public_update_device_id"
38: 36: on students for update
39: 37: using (device_id is null)
40: 38: with check (device_id is not null);
41: 39: 
42: 40: create policy "admins_full_access_attendance"
43: 41: on attendance_logs for all
44: 42: using (auth.role() = 'authenticated')
45: 43: with check (auth.role() = 'authenticated');
46: 44: 
47: 45: create policy "students_insert_attendance"
48: 46: on attendance_logs for insert
49: 47: with check (true);
50: ```
51: 
52: ### D:\Projects\Goose\mashov-bridge\supabase\schema.sql
53: ```sql
54: 1: create extension if not exists "uuid-ossp";
55: 2: 
56: 3: create table students (
57: 4:   id uuid default uuid_generate_v4() primary key,
58: 5:   full_name text not null,
59: 6:   mashov_id text unique not null,
60: 7:   group_name text not null,
61: 8:   checkin_token text unique not null,
62: 9:   device_id text unique,
63: 10:   created_at timestamptz default now()
64: 11: );
65: 12: 
66: 13: create table attendance_logs (
67: 14:   id uuid default uuid_generate_v4() primary key,
68: 15:   student_id uuid references students(id),
69: 16:   timestamp timestamptz default now(),
70: 17:   method text check (method in ('QR', 'NFC')),
71: 18:   lat float,
72: 19:   lng float,
73: 20:   is_verified_location boolean default false
74: 21: );
75: 22: 
76: 23: alter table students enable row level security;
77: 24: alter table attendance_logs enable row level security;
78: 25: 
79: 26: create policy "admins_full_access_students"
80: 27: on students for all
81: 28: using (auth.role() = 'authenticated')
82: 29: with check (auth.role() = 'authenticated');
83: 30: 
84: 31: create policy "public_select_students"
85: 32: on students for select
86: 33: using (true);
87: 34: 
88: 35: create policy "public_update_device_id"
89: 36: on students for update
90: 37: using (device_id is null)
91: 38: with check (device_id is not null);
92: 39: 
93: 40: create policy "admins_full_access_attendance"
94: 41: on attendance_logs for all
95: 42: using (auth.role() = 'authenticated')
96: 43: with check (auth.role() = 'authenticated');
97: 44: 
98: 45: create policy "students_insert_attendance"
99: 46: on attendance_logs for insert
100: 47: with check (true);
101: ```
102: 
103: create unique index if not exists attendance_unique_daily on attendance_logs (student_id, (timestamp::date));
```
