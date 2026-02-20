### D:\Projects\Goose\mashov-bridge\app\api\agent\daily-report\route.ts
```typescript
1: import { NextResponse } from "next/server";
2: import { createServerClient } from "@/lib/supabase/server";
3: 
4: export async function GET() {
5:   const supabase = createServerClient();
6:   const today = new Date().toISOString().slice(0, 10);
7: 
8:   const { data } = await (supabase as any)
9:     .from("attendance_logs")
10:     .select("timestamp, students(full_name, group_name, mashov_id)")
11:     .gte("timestamp", today + "T00:00:00")
12:     .lte("timestamp", today + "T23:59:59");
13: 
14:   return NextResponse.json({
15:     date: today,
16:     present:
17:       data?.map((row: any) => ({
18:         full_name: row.students?.full_name,
19:         mashov_id: row.students?.mashov_id,
20:         group_name: row.students?.group_name,
21:         time: new Date(row.timestamp).toLocaleTimeString("he-IL", {
22:           hour: "2-digit",
23:           minute: "2-digit",
24:         }),
25:       })) ?? [],
26:   });
27: }
```

### D:\Projects\Goose\mashov-bridge\app\api\agent\daily-report\route.ts
```typescript
1: import { NextResponse } from "next/server";
2: import { createServerClient } from "@/lib/supabase/server";
3: 
4: export async function GET() {
5:   const supabase = createServerClient();
6:   const today = new Date().toISOString().slice(0, 10);
7: 
8:   const { data } = await supabase
9:     .from("attendance_logs")
10:     .select("timestamp, students(full_name, group_name, mashov_id)")
11:     .gte("timestamp", today + "T00:00:00")
12:     .lte("timestamp", today + "T23:59:59");
13: 
14:   return NextResponse.json({
15:     date: today,
16:     present:
17:       data?.map((row) => ({
18:         full_name: row.students?.full_name,
19:         mashov_id: row.students?.mashov_id,
20:         group_name: row.students?.group_name,
21:         time: new Date(row.timestamp).toLocaleTimeString("he-IL", {
22:           hour: "2-digit",
23:           minute: "2-digit",
24:         }),
25:       })) ?? [],
26:   });
27: }
```
