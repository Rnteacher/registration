### D:\Projects\Goose\mashov-bridge\app\(public)\checkin\page.tsx
```
1: "use client";
2: 
3: import { useEffect, useMemo, useState } from "react";
4: import { supabase } from "@/lib/supabase/client";
5: import { distanceInMeters, SCHOOL_LAT, SCHOOL_LNG } from "@/lib/geo";
6: import type { Database } from "@/types/supabase";
7: 
8: const DEVICE_KEY = "mashov_device_id";
9: const MAX_DISTANCE_METERS = 150;
10: 
11: type Student = {
12:   id: string;
13:   full_name: string;
14:   group_name: string;
15:   device_id: string | null;
16: };
17: 
18: type Status =
19:   | "loading"
20:   | "choose"
21:   | "success"
22:   | "error"
23:   | "already"
24:   | "no_location"
25:   | "too_far";
26: 
27: export default function CheckinPage() {
28:   const [status, setStatus] = useState<Status>("loading");
29:   const [students, setStudents] = useState<Student[]>([]);
30:   const [studentName, setStudentName] = useState("");
31:   const [errorMsg, setErrorMsg] = useState("");
32:   const [search, setSearch] = useState("");
33: 
34:   const deviceId = useMemo(() => {
35:     if (typeof window === "undefined") return null;
36:     return localStorage.getItem(DEVICE_KEY);
37:   }, []);
38: 
39:   const getLocation = () =>
40:     new Promise<{ lat: number; lng: number }>((resolve, reject) => {
41:       if (!navigator.geolocation) {
42:         reject(new Error("no_geo"));
43:         return;
44:       }
45:       navigator.geolocation.getCurrentPosition(
46:         (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
47:         () => reject(new Error("no_geo"))
48:       );
49:     });
50: 
51:   const attemptCheckin = async (student: Student) => {
52:     try {
53:       const { lat, lng } = await getLocation();
54:       const dist = distanceInMeters(lat, lng, SCHOOL_LAT, SCHOOL_LNG);
55: 
56:       if (dist > MAX_DISTANCE_METERS) {
57:         setStatus("too_far");
58:         return;
59:       }
60: 
61:       const payload: Database["public"]["Tables"]["attendance_logs"]["Insert"] = {
62:         student_id: student.id,
63:         method: "QR",
64:         lat,
65:         lng,
66:         is_verified_location: true,
67:       };
68: 
69:       const { error } = await (supabase as any).from("attendance_logs").insert(payload);
70: 
71:       if (error) {
72:         if ((error as { code?: string }).code === "23505") {
73:           setStudentName(student.full_name);
74:           setStatus("already");
75:           return;
76:         }
77:         setErrorMsg("שגיאה ברישום נוכחות");
78:         setStatus("error");
79:         return;
80:       }
81: 
82:       setStudentName(student.full_name);
83:       setStatus("success");
84:     } catch {
85:       setStatus("no_location");
86:     }
87:   };
88: 
89:   useEffect(() => {
90:     const run = async () => {
91:       if (deviceId) {
92:         const { data: student } = await supabase
93:           .from("students")
94:           .select("id, full_name, group_name, device_id")
95:           .eq("device_id", deviceId)
96:           .single();
97: 
98:         if (student) {
99:           await attemptCheckin(student as Student);
100:           return;
101:         }
102: 
103:         localStorage.removeItem(DEVICE_KEY);
104:       }
105: 
106:       const { data, error } = await supabase
107:         .from("students")
108:         .select("id, full_name, group_name, device_id")
109:         .order("full_name");
110: 
111:       if (error || !data) {
112:         setErrorMsg("לא ניתן לטעון רשימת חניכים");
113:         setStatus("error");
114:         return;
115:       }
116: 
117:       setStudents(data as Student[]);
118:       setStatus("choose");
119:     };
120: 
121:     run();
122:   }, [deviceId]);
123: 
124:   const handleChoose = async (student: Student) => {
125:     if (student.device_id) {
126:       setErrorMsg("החניך כבר משויך למכשיר אחר");
127:       setStatus("error");
128:       return;
129:     }
130: 
131:     try {
132:       const id =
133:         window.crypto?.randomUUID?.() ??
134:         Date.now().toString() + "-" + Math.random().toString(16).slice(2);
135: 
136:       const { error: updateError } = await supabase
137:         .from("students")
138:         .update({ device_id: id })
139:         .eq("id", student.id);
140: 
141:       if (updateError) {
142:         setErrorMsg("לא ניתן לשייך את המכשיר");
143:         setStatus("error");
144:         return;
145:       }
146: 
147:       localStorage.setItem(DEVICE_KEY, id);
148:       await attemptCheckin(student);
149:     } catch {
150:       setErrorMsg("שגיאה כללית");
151:       setStatus("error");
152:     }
153:   };
154: 
155:   const filteredStudents = students.filter((student) =>
156:     student.full_name.toLowerCase().includes(search.trim().toLowerCase())
157:   );
158: 
159:   return (
160:     <main className="min-h-screen flex items-center justify-center p-6 text-center">
161:       <div className="max-w-md bg-white shadow rounded-2xl p-6 space-y-4 w-full">
162:         {status === "loading" && <p>טוען...</p>}
163: 
164:         {status === "success" && (
165:           <p className="text-lg font-semibold">
166:             שלום {studentName}, נוכחותך נקלטה בהצלחה
167:           </p>
168:         )}
169: 
170:         {status === "already" && (
171:           <p className="text-lg font-semibold">
172:             שלום {studentName}, נוכחותך כבר נרשמה היום
173:           </p>
174:         )}
175: 
176:         {status === "too_far" && (
177:           <p className="text-lg text-red-600">אינך נמצא בקרבת בית הספר</p>
178:         )}
179: 
180:         {status === "no_location" && (
181:           <p className="text-lg text-red-600">לא ניתן לגשת למיקום המכשיר</p>
182:         )}
183: 
184:         {status === "error" && (
185:           <p className="text-lg text-red-600">{errorMsg || "שגיאה"}</p>
186:         )}
187: 
188:         {status === "choose" && (
189:           <div className="space-y-3 text-right">
190:             <div>
191:               <p className="text-lg font-semibold">בחר/י את שמך</p>
192:               <p className="text-sm text-slate-500">בחר פעם אחת בלבד</p>
193:             </div>
194:             <input
195:               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
196:               placeholder="חיפוש לפי שם"
197:               value={search}
198:               onChange={(e) => setSearch(e.target.value)}
199:             />
200:             <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
201:               {filteredStudents.length === 0 && (
202:                 <p className="p-4 text-sm text-slate-500">אין תוצאות</p>
203:               )}
204:               {filteredStudents.map((student) => (
205:                 <button
206:                   key={student.id}
207:                   className={
208:                     "w-full px-4 py-3 text-right hover:bg-slate-50 " +
209:                     (student.device_id ? "opacity-50 cursor-not-allowed" : "")
210:                   }
211:                   onClick={() => handleChoose(student)}
212:                   disabled={!!student.device_id}
213:                 >
214:                   <div className="font-medium">{student.full_name}</div>
215:                   <div className="text-slate-500 text-sm">{student.group_name}</div>
216:                 </button>
217:               ))}
218:             </div>
219:           </div>
220:         )}
221:       </div>
222:     </main>
223:   );
224: }
```

### D:\Projects\Goose\mashov-bridge\app\(public)\checkin\page.tsx
```
1: "use client";
2: 
3: import { useEffect, useMemo, useState } from "react";
4: import { supabase } from "@/lib/supabase/client";
5: import { distanceInMeters, SCHOOL_LAT, SCHOOL_LNG } from "@/lib/geo";
6: import type { Database } from "@/types/supabase";
7: 
8: const DEVICE_KEY = "mashov_device_id";
9: const MAX_DISTANCE_METERS = 150;
10: 
11: type Student = {
12:   id: string;
13:   full_name: string;
14:   group_name: string;
15:   device_id: string | null;
16: };
17: 
18: type Status =
19:   | "loading"
20:   | "choose"
21:   | "success"
22:   | "error"
23:   | "already"
24:   | "no_location"
25:   | "too_far";
26: 
27: export default function CheckinPage() {
28:   const [status, setStatus] = useState<Status>("loading");
29:   const [students, setStudents] = useState<Student[]>([]);
30:   const [studentName, setStudentName] = useState("");
31:   const [errorMsg, setErrorMsg] = useState("");
32:   const [search, setSearch] = useState("");
33: 
34:   const deviceId = useMemo(() => {
35:     if (typeof window === "undefined") return null;
36:     return localStorage.getItem(DEVICE_KEY);
37:   }, []);
38: 
39:   const getLocation = () =>
40:     new Promise<{ lat: number; lng: number }>((resolve, reject) => {
41:       if (!navigator.geolocation) {
42:         reject(new Error("no_geo"));
43:         return;
44:       }
45:       navigator.geolocation.getCurrentPosition(
46:         (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
47:         () => reject(new Error("no_geo"))
48:       );
49:     });
50: 
51:   const attemptCheckin = async (student: Student) => {
52:     try {
53:       const { lat, lng } = await getLocation();
54:       const dist = distanceInMeters(lat, lng, SCHOOL_LAT, SCHOOL_LNG);
55: 
56:       if (dist > MAX_DISTANCE_METERS) {
57:         setStatus("too_far");
58:         return;
59:       }
60: 
61:       const payload: Database["public"]["Tables"]["attendance_logs"]["Insert"] = {
62:         student_id: student.id,
63:         method: "QR",
64:         lat,
65:         lng,
66:         is_verified_location: true,
67:       };
68: 
69:       const { error } = await (supabase as any).from("attendance_logs").insert(payload);
70: 
71:       if (error) {
72:         if ((error as { code?: string }).code === "23505") {
73:           setStudentName(student.full_name);
74:           setStatus("already");
75:           return;
76:         }
77:         setErrorMsg("שגיאה ברישום נוכחות");
78:         setStatus("error");
79:         return;
80:       }
81: 
82:       setStudentName(student.full_name);
83:       setStatus("success");
84:     } catch {
85:       setStatus("no_location");
86:     }
87:   };
88: 
89:   useEffect(() => {
90:     const run = async () => {
91:       if (deviceId) {
92:         const { data: student } = await supabase
93:           .from("students")
94:           .select("id, full_name, group_name, device_id")
95:           .eq("device_id", deviceId)
96:           .single();
97: 
98:         if (student) {
99:           await attemptCheckin(student as Student);
100:           return;
101:         }
102: 
103:         localStorage.removeItem(DEVICE_KEY);
104:       }
105: 
106:       const { data, error } = await supabase
107:         .from("students")
108:         .select("id, full_name, group_name, device_id")
109:         .order("full_name");
110: 
111:       if (error || !data) {
112:         setErrorMsg("לא ניתן לטעון רשימת חניכים");
113:         setStatus("error");
114:         return;
115:       }
116: 
117:       setStudents(data as Student[]);
118:       setStatus("choose");
119:     };
120: 
121:     run();
122:   }, [deviceId]);
123: 
124:   const handleChoose = async (student: Student) => {
125:     if (student.device_id) {
126:       setErrorMsg("החניך כבר משויך למכשיר אחר");
127:       setStatus("error");
128:       return;
129:     }
130: 
131:     try {
132:       const id =
133:         window.crypto?.randomUUID?.() ??
134:         Date.now().toString() + "-" + Math.random().toString(16).slice(2);
135: 
136:       const { error: updateError } = await supabase
137:         .from("students")
138:         .update({ device_id: id })
139:         .eq("id", student.id);
140: 
141:       if (updateError) {
142:         setErrorMsg("לא ניתן לשייך את המכשיר");
143:         setStatus("error");
144:         return;
145:       }
146: 
147:       localStorage.setItem(DEVICE_KEY, id);
148:       await attemptCheckin(student);
149:     } catch {
150:       setErrorMsg("שגיאה כללית");
151:       setStatus("error");
152:     }
153:   };
154: 
155:   const filteredStudents = students.filter((student) =>
156:     student.full_name.toLowerCase().includes(search.trim().toLowerCase())
157:   );
158: 
159:   return (
160:     <main className="min-h-screen flex items-center justify-center p-6 text-center">
161:       <div className="max-w-md bg-white shadow rounded-2xl p-6 space-y-4 w-full">
162:         {status === "loading" && <p>טוען...</p>}
163: 
164:         {status === "success" && (
165:           <p className="text-lg font-semibold">
166:             שלום {studentName}, נוכחותך נקלטה בהצלחה
167:           </p>
168:         )}
169: 
170:         {status === "already" && (
171:           <p className="text-lg font-semibold">
172:             שלום {studentName}, נוכחותך כבר נרשמה היום
173:           </p>
174:         )}
175: 
176:         {status === "too_far" && (
177:           <p className="text-lg text-red-600">אינך נמצא בקרבת בית הספר</p>
178:         )}
179: 
180:         {status === "no_location" && (
181:           <p className="text-lg text-red-600">לא ניתן לגשת למיקום המכשיר</p>
182:         )}
183: 
184:         {status === "error" && (
185:           <p className="text-lg text-red-600">{errorMsg || "שגיאה"}</p>
186:         )}
187: 
188:         {status === "choose" && (
189:           <div className="space-y-3 text-right">
190:             <div>
191:               <p className="text-lg font-semibold">בחר/י את שמך</p>
192:               <p className="text-sm text-slate-500">בחר פעם אחת בלבד</p>
193:             </div>
194:             <input
195:               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
196:               placeholder="חיפוש לפי שם"
197:               value={search}
198:               onChange={(e) => setSearch(e.target.value)}
199:             />
200:             <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
201:               {filteredStudents.length === 0 && (
202:                 <p className="p-4 text-sm text-slate-500">אין תוצאות</p>
203:               )}
204:               {filteredStudents.map((student) => (
205:                 <button
206:                   key={student.id}
207:                   className={
208:                     "w-full px-4 py-3 text-right hover:bg-slate-50 " +
209:                     (student.device_id ? "opacity-50 cursor-not-allowed" : "")
210:                   }
211:                   onClick={() => handleChoose(student)}
212:                   disabled={!!student.device_id}
213:                 >
214:                   <div className="font-medium">{student.full_name}</div>
215:                   <div className="text-slate-500 text-sm">{student.group_name}</div>
216:                 </button>
217:               ))}
218:             </div>
219:           </div>
220:         )}
221:       </div>
222:     </main>
223:   );
224: }
```
