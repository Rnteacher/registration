### D:\Projects\Goose\mashov-bridge\app\(public)\checkin\page.tsx
```
1: "use client";
2: 
3: import { useEffect, useMemo, useState } from "react";
4: import { supabase } from "@/lib/supabase/client";
5: import { distanceInMeters, SCHOOL_LAT, SCHOOL_LNG } from "@/lib/geo";
import type { Database } from "@/types/supabase";
6: 
7: const DEVICE_KEY = "mashov_device_id";
8: const MAX_DISTANCE_METERS = 150;
9: 
10: type Student = {
11:   id: string;
12:   full_name: string;
13:   group_name: string;
14:   device_id: string | null;
15: };
16: 
17: type Status =
18:   | "loading"
19:   | "choose"
20:   | "success"
21:   | "error"
22:   | "already"
23:   | "no_location"
24:   | "too_far";
25: 
26: export default function CheckinPage() {
27:   const [status, setStatus] = useState<Status>("loading");
28:   const [students, setStudents] = useState<Student[]>([]);
29:   const [studentName, setStudentName] = useState("");
30:   const [errorMsg, setErrorMsg] = useState("");
31:   const [search, setSearch] = useState("");
32: 
33:   const deviceId = useMemo(() => {
34:     if (typeof window === "undefined") return null;
35:     return localStorage.getItem(DEVICE_KEY);
36:   }, []);
37: 
38:   const getLocation = () =>
39:     new Promise<{ lat: number; lng: number }>((resolve, reject) => {
40:       if (!navigator.geolocation) {
41:         reject(new Error("no_geo"));
42:         return;
43:       }
44:       navigator.geolocation.getCurrentPosition(
45:         (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
46:         () => reject(new Error("no_geo"))
47:       );
48:     });
49: 
50:   const attemptCheckin = async (student: Student) => {
51:     try {
52:       const { lat, lng } = await getLocation();
53:       const dist = distanceInMeters(lat, lng, SCHOOL_LAT, SCHOOL_LNG);
54: 
55:       if (dist > MAX_DISTANCE_METERS) {
56:         setStatus("too_far");
57:         return;
58:       }
59: 
60:       const payload: Database["public"]["Tables"]["attendance_logs"]["Insert"] = {
        student_id: student.id,
        method: "QR",
        lat,
        lng,
        is_verified_location: true,
      };

      const { error } = await supabase.from("attendance_logs").insert(payload);
67: 
68:       if (error) {
69:         if (error.code === "23505") {
70:           setStudentName(student.full_name);
71:           setStatus("already");
72:           return;
73:         }
74:         setErrorMsg("שגיאה ברישום נוכחות");
75:         setStatus("error");
76:         return;
77:       }
78: 
79:       setStudentName(student.full_name);
80:       setStatus("success");
81:     } catch {
82:       setStatus("no_location");
83:     }
84:   };
85: 
86:   useEffect(() => {
87:     const run = async () => {
88:       if (deviceId) {
89:         const { data: student } = await supabase
90:           .from("students")
91:           .select("id, full_name, group_name, device_id")
92:           .eq("device_id", deviceId)
93:           .single();
94: 
95:         if (student) {
96:           await attemptCheckin(student as Student);
97:           return;
98:         }
99: 
100:         localStorage.removeItem(DEVICE_KEY);
101:       }
102: 
103:       const { data, error } = await supabase
104:         .from("students")
105:         .select("id, full_name, group_name, device_id")
106:         .order("full_name");
107: 
108:       if (error || !data) {
109:         setErrorMsg("לא ניתן לטעון רשימת חניכים");
110:         setStatus("error");
111:         return;
112:       }
113: 
114:       setStudents(data as Student[]);
115:       setStatus("choose");
116:     };
117: 
118:     run();
119:   }, [deviceId]);
120: 
121:   const handleChoose = async (student: Student) => {
122:     if (student.device_id) {
123:       setErrorMsg("החניך כבר משויך למכשיר אחר");
124:       setStatus("error");
125:       return;
126:     }
127: 
128:     try {
129:       const id =
130:         window.crypto?.randomUUID?.() ??
131:         Date.now().toString() + "-" + Math.random().toString(16).slice(2);
132: 
133:       const { error: updateError } = await supabase
134:         .from("students")
135:         .update({ device_id: id })
136:         .eq("id", student.id);
137: 
138:       if (updateError) {
139:         setErrorMsg("לא ניתן לשייך את המכשיר");
140:         setStatus("error");
141:         return;
142:       }
143: 
144:       localStorage.setItem(DEVICE_KEY, id);
145:       await attemptCheckin(student);
146:     } catch {
147:       setErrorMsg("שגיאה כללית");
148:       setStatus("error");
149:     }
150:   };
151: 
152:   const filteredStudents = students.filter((student) =>
153:     student.full_name.toLowerCase().includes(search.trim().toLowerCase())
154:   );
155: 
156:   return (
157:     <main className="min-h-screen flex items-center justify-center p-6 text-center">
158:       <div className="max-w-md bg-white shadow rounded-2xl p-6 space-y-4 w-full">
159:         {status === "loading" && <p>טוען...</p>}
160: 
161:         {status === "success" && (
162:           <p className="text-lg font-semibold">
163:             שלום {studentName}, נוכחותך נקלטה בהצלחה
164:           </p>
165:         )}
166: 
167:         {status === "already" && (
168:           <p className="text-lg font-semibold">
169:             שלום {studentName}, נוכחותך כבר נרשמה היום
170:           </p>
171:         )}
172: 
173:         {status === "too_far" && (
174:           <p className="text-lg text-red-600">אינך נמצא בקרבת בית הספר</p>
175:         )}
176: 
177:         {status === "no_location" && (
178:           <p className="text-lg text-red-600">לא ניתן לגשת למיקום המכשיר</p>
179:         )}
180: 
181:         {status === "error" && (
182:           <p className="text-lg text-red-600">{errorMsg || "שגיאה"}</p>
183:         )}
184: 
185:         {status === "choose" && (
186:           <div className="space-y-3 text-right">
187:             <div>
188:               <p className="text-lg font-semibold">בחר/י את שמך</p>
189:               <p className="text-sm text-slate-500">בחר פעם אחת בלבד</p>
190:             </div>
191:             <input
192:               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
193:               placeholder="חיפוש לפי שם"
194:               value={search}
195:               onChange={(e) => setSearch(e.target.value)}
196:             />
197:             <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
198:               {filteredStudents.length === 0 && (
199:                 <p className="p-4 text-sm text-slate-500">אין תוצאות</p>
200:               )}
201:               {filteredStudents.map((student) => (
202:                 <button
203:                   key={student.id}
204:                   className={
205:                     "w-full px-4 py-3 text-right hover:bg-slate-50 " +
206:                     (student.device_id ? "opacity-50 cursor-not-allowed" : "")
207:                   }
208:                   onClick={() => handleChoose(student)}
209:                   disabled={!!student.device_id}
210:                 >
211:                   <div className="font-medium">{student.full_name}</div>
212:                   <div className="text-slate-500 text-sm">{student.group_name}</div>
213:                 </button>
214:               ))}
215:             </div>
216:           </div>
217:         )}
218:       </div>
219:     </main>
220:   );
221: }
```

### D:\Projects\Goose\mashov-bridge\app\(public)\checkin\page.tsx
```
1: "use client";
2: 
3: import { useEffect, useMemo, useState } from "react";
4: import { supabase } from "@/lib/supabase/client";
5: import { distanceInMeters, SCHOOL_LAT, SCHOOL_LNG } from "@/lib/geo";
6: 
7: const DEVICE_KEY = "mashov_device_id";
8: const MAX_DISTANCE_METERS = 150;
9: 
10: type Student = {
11:   id: string;
12:   full_name: string;
13:   group_name: string;
14:   device_id: string | null;
15: };
16: 
17: type Status =
18:   | "loading"
19:   | "choose"
20:   | "success"
21:   | "error"
22:   | "already"
23:   | "no_location"
24:   | "too_far";
25: 
26: export default function CheckinPage() {
27:   const [status, setStatus] = useState<Status>("loading");
28:   const [students, setStudents] = useState<Student[]>([]);
29:   const [studentName, setStudentName] = useState("");
30:   const [errorMsg, setErrorMsg] = useState("");
31:   const [search, setSearch] = useState("");
32: 
33:   const deviceId = useMemo(() => {
34:     if (typeof window === "undefined") return null;
35:     return localStorage.getItem(DEVICE_KEY);
36:   }, []);
37: 
38:   const getLocation = () =>
39:     new Promise<{ lat: number; lng: number }>((resolve, reject) => {
40:       if (!navigator.geolocation) {
41:         reject(new Error("no_geo"));
42:         return;
43:       }
44:       navigator.geolocation.getCurrentPosition(
45:         (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
46:         () => reject(new Error("no_geo"))
47:       );
48:     });
49: 
50:   const attemptCheckin = async (student: Student) => {
51:     try {
52:       const { lat, lng } = await getLocation();
53:       const dist = distanceInMeters(lat, lng, SCHOOL_LAT, SCHOOL_LNG);
54: 
55:       if (dist > MAX_DISTANCE_METERS) {
56:         setStatus("too_far");
57:         return;
58:       }
59: 
60:       const { error } = await supabase.from("attendance_logs").insert({
61:         student_id: student.id,
62:         method: "QR",
63:         lat,
64:         lng,
65:         is_verified_location: true,
66:       });
67: 
68:       if (error) {
69:         if (error.code === "23505") {
70:           setStudentName(student.full_name);
71:           setStatus("already");
72:           return;
73:         }
74:         setErrorMsg("שגיאה ברישום נוכחות");
75:         setStatus("error");
76:         return;
77:       }
78: 
79:       setStudentName(student.full_name);
80:       setStatus("success");
81:     } catch {
82:       setStatus("no_location");
83:     }
84:   };
85: 
86:   useEffect(() => {
87:     const run = async () => {
88:       if (deviceId) {
89:         const { data: student } = await supabase
90:           .from("students")
91:           .select("id, full_name, group_name, device_id")
92:           .eq("device_id", deviceId)
93:           .single();
94: 
95:         if (student) {
96:           await attemptCheckin(student as Student);
97:           return;
98:         }
99: 
100:         localStorage.removeItem(DEVICE_KEY);
101:       }
102: 
103:       const { data, error } = await supabase
104:         .from("students")
105:         .select("id, full_name, group_name, device_id")
106:         .order("full_name");
107: 
108:       if (error || !data) {
109:         setErrorMsg("לא ניתן לטעון רשימת חניכים");
110:         setStatus("error");
111:         return;
112:       }
113: 
114:       setStudents(data as Student[]);
115:       setStatus("choose");
116:     };
117: 
118:     run();
119:   }, [deviceId]);
120: 
121:   const handleChoose = async (student: Student) => {
122:     if (student.device_id) {
123:       setErrorMsg("החניך כבר משויך למכשיר אחר");
124:       setStatus("error");
125:       return;
126:     }
127: 
128:     try {
129:       const id =
130:         window.crypto?.randomUUID?.() ??
131:         Date.now().toString() + "-" + Math.random().toString(16).slice(2);
132: 
133:       const { error: updateError } = await supabase
134:         .from("students")
135:         .update({ device_id: id })
136:         .eq("id", student.id);
137: 
138:       if (updateError) {
139:         setErrorMsg("לא ניתן לשייך את המכשיר");
140:         setStatus("error");
141:         return;
142:       }
143: 
144:       localStorage.setItem(DEVICE_KEY, id);
145:       await attemptCheckin(student);
146:     } catch {
147:       setErrorMsg("שגיאה כללית");
148:       setStatus("error");
149:     }
150:   };
151: 
152:   const filteredStudents = students.filter((student) =>
153:     student.full_name.toLowerCase().includes(search.trim().toLowerCase())
154:   );
155: 
156:   return (
157:     <main className="min-h-screen flex items-center justify-center p-6 text-center">
158:       <div className="max-w-md bg-white shadow rounded-2xl p-6 space-y-4 w-full">
159:         {status === "loading" && <p>טוען...</p>}
160: 
161:         {status === "success" && (
162:           <p className="text-lg font-semibold">
163:             שלום {studentName}, נוכחותך נקלטה בהצלחה
164:           </p>
165:         )}
166: 
167:         {status === "already" && (
168:           <p className="text-lg font-semibold">
169:             שלום {studentName}, נוכחותך כבר נרשמה היום
170:           </p>
171:         )}
172: 
173:         {status === "too_far" && (
174:           <p className="text-lg text-red-600">אינך נמצא בקרבת בית הספר</p>
175:         )}
176: 
177:         {status === "no_location" && (
178:           <p className="text-lg text-red-600">לא ניתן לגשת למיקום המכשיר</p>
179:         )}
180: 
181:         {status === "error" && (
182:           <p className="text-lg text-red-600">{errorMsg || "שגיאה"}</p>
183:         )}
184: 
185:         {status === "choose" && (
186:           <div className="space-y-3 text-right">
187:             <div>
188:               <p className="text-lg font-semibold">בחר/י את שמך</p>
189:               <p className="text-sm text-slate-500">בחר פעם אחת בלבד</p>
190:             </div>
191:             <input
192:               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
193:               placeholder="חיפוש לפי שם"
194:               value={search}
195:               onChange={(e) => setSearch(e.target.value)}
196:             />
197:             <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
198:               {filteredStudents.length === 0 && (
199:                 <p className="p-4 text-sm text-slate-500">אין תוצאות</p>
200:               )}
201:               {filteredStudents.map((student) => (
202:                 <button
203:                   key={student.id}
204:                   className={
205:                     "w-full px-4 py-3 text-right hover:bg-slate-50 " +
206:                     (student.device_id ? "opacity-50 cursor-not-allowed" : "")
207:                   }
208:                   onClick={() => handleChoose(student)}
209:                   disabled={!!student.device_id}
210:                 >
211:                   <div className="font-medium">{student.full_name}</div>
212:                   <div className="text-slate-500 text-sm">{student.group_name}</div>
213:                 </button>
214:               ))}
215:             </div>
216:           </div>
217:         )}
218:       </div>
219:     </main>
220:   );
221: }
```
