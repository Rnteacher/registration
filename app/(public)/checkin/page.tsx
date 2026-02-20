### D:\Projects\Goose\mashov-bridge\app\(public)\checkin\page.tsx
```
1: ### D:\Projects\Goose\mashov-bridge\app\(public)\checkin\page.tsx
2: ```
3: 1: "use client";
4: 2: 
5: 3: import { useEffect, useMemo, useState } from "react";
6: 4: import { supabase } from "@/lib/supabase/client";
7: 5: import { distanceInMeters, SCHOOL_LAT, SCHOOL_LNG } from "@/lib/geo";
8: 6: import type { Database } from "@/types/supabase";
9: 7: 
10: 8: const DEVICE_KEY = "mashov_device_id";
11: 9: const MAX_DISTANCE_METERS = 150;
12: 10: 
13: 11: type Student = {
14: 12:   id: string;
15: 13:   full_name: string;
16: 14:   group_name: string;
17: 15:   device_id: string | null;
18: 16: };
19: 17: 
20: 18: type Status =
21: 19:   | "loading"
22: 20:   | "choose"
23: 21:   | "success"
24: 22:   | "error"
25: 23:   | "already"
26: 24:   | "no_location"
27: 25:   | "too_far";
28: 26: 
29: 27: export default function CheckinPage() {
30: 28:   const [status, setStatus] = useState<Status>("loading");
31: 29:   const [students, setStudents] = useState<Student[]>([]);
32: 30:   const [studentName, setStudentName] = useState("");
33: 31:   const [errorMsg, setErrorMsg] = useState("");
34: 32:   const [search, setSearch] = useState("");
35: 33: 
36: 34:   const deviceId = useMemo(() => {
37: 35:     if (typeof window === "undefined") return null;
38: 36:     return localStorage.getItem(DEVICE_KEY);
39: 37:   }, []);
40: 38: 
41: 39:   const getLocation = () =>
42: 40:     new Promise<{ lat: number; lng: number }>((resolve, reject) => {
43: 41:       if (!navigator.geolocation) {
44: 42:         reject(new Error("no_geo"));
45: 43:         return;
46: 44:       }
47: 45:       navigator.geolocation.getCurrentPosition(
48: 46:         (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
49: 47:         () => reject(new Error("no_geo"))
50: 48:       );
51: 49:     });
52: 50: 
53: 51:   const attemptCheckin = async (student: Student) => {
54: 52:     try {
55: 53:       const { lat, lng } = await getLocation();
56: 54:       const dist = distanceInMeters(lat, lng, SCHOOL_LAT, SCHOOL_LNG);
57: 55: 
58: 56:       if (dist > MAX_DISTANCE_METERS) {
59: 57:         setStatus("too_far");
60: 58:         return;
61: 59:       }
62: 60: 
63: 61:       const payload: Database["public"]["Tables"]["attendance_logs"]["Insert"] = {
64: 62:         student_id: student.id,
65: 63:         method: "QR",
66: 64:         lat,
67: 65:         lng,
68: 66:         is_verified_location: true,
69: 67:       };
70: 68: 
71: 69:       const { error } = await (supabase as any).from("attendance_logs").insert(payload);
72: 70: 
73: 71:       if (error) {
74: 72:         if ((error as { code?: string }).code === "23505") {
75: 73:           setStudentName(student.full_name);
76: 74:           setStatus("already");
77: 75:           return;
78: 76:         }
79: 77:         setErrorMsg("שגיאה ברישום נוכחות");
80: 78:         setStatus("error");
81: 79:         return;
82: 80:       }
83: 81: 
84: 82:       setStudentName(student.full_name);
85: 83:       setStatus("success");
86: 84:     } catch {
87: 85:       setStatus("no_location");
88: 86:     }
89: 87:   };
90: 88: 
91: 89:   useEffect(() => {
92: 90:     const run = async () => {
93: 91:       if (deviceId) {
94: 92:         const { data: student } = await supabase
95: 93:           .from("students")
96: 94:           .select("id, full_name, group_name, device_id")
97: 95:           .eq("device_id", deviceId)
98: 96:           .single();
99: 97: 
100: 98:         if (student) {
101: 99:           await attemptCheckin(student as Student);
102: 100:           return;
103: 101:         }
104: 102: 
105: 103:         localStorage.removeItem(DEVICE_KEY);
106: 104:       }
107: 105: 
108: 106:       const { data, error } = await supabase
109: 107:         .from("students")
110: 108:         .select("id, full_name, group_name, device_id")
111: 109:         .order("full_name");
112: 110: 
113: 111:       if (error || !data) {
114: 112:         setErrorMsg("לא ניתן לטעון רשימת חניכים");
115: 113:         setStatus("error");
116: 114:         return;
117: 115:       }
118: 116: 
119: 117:       setStudents(data as Student[]);
120: 118:       setStatus("choose");
121: 119:     };
122: 120: 
123: 121:     run();
124: 122:   }, [deviceId]);
125: 123: 
126: 124:   const handleChoose = async (student: Student) => {
127: 125:     if (student.device_id) {
128: 126:       setErrorMsg("החניך כבר משויך למכשיר אחר");
129: 127:       setStatus("error");
130: 128:       return;
131: 129:     }
132: 130: 
133: 131:     try {
134: 132:       const id =
135: 133:         window.crypto?.randomUUID?.() ??
136: 134:         Date.now().toString() + "-" + Math.random().toString(16).slice(2);
137: 135: 
138: 136:       const { error: updateError } = await supabase
139: 137:         .from("students")
140: 138:         .update({ device_id: id })
141: 139:         .eq("id", student.id);
142: 140: 
143: 141:       if (updateError) {
144: 142:         setErrorMsg("לא ניתן לשייך את המכשיר");
145: 143:         setStatus("error");
146: 144:         return;
147: 145:       }
148: 146: 
149: 147:       localStorage.setItem(DEVICE_KEY, id);
150: 148:       await attemptCheckin(student);
151: 149:     } catch {
152: 150:       setErrorMsg("שגיאה כללית");
153: 151:       setStatus("error");
154: 152:     }
155: 153:   };
156: 154: 
157: 155:   const filteredStudents = students.filter((student) =>
158: 156:     student.full_name.toLowerCase().includes(search.trim().toLowerCase())
159: 157:   );
160: 158: 
161: 159:   return (
162: 160:     <main className="min-h-screen flex items-center justify-center p-6 text-center">
163: 161:       <div className="max-w-md bg-white shadow rounded-2xl p-6 space-y-4 w-full">
164: 162:         {status === "loading" && <p>טוען...</p>}
165: 163: 
166: 164:         {status === "success" && (
167: 165:           <p className="text-lg font-semibold">
168: 166:             שלום {studentName}, נוכחותך נקלטה בהצלחה
169: 167:           </p>
170: 168:         )}
171: 169: 
172: 170:         {status === "already" && (
173: 171:           <p className="text-lg font-semibold">
174: 172:             שלום {studentName}, נוכחותך כבר נרשמה היום
175: 173:           </p>
176: 174:         )}
177: 175: 
178: 176:         {status === "too_far" && (
179: 177:           <p className="text-lg text-red-600">אינך נמצא בקרבת בית הספר</p>
180: 178:         )}
181: 179: 
182: 180:         {status === "no_location" && (
183: 181:           <p className="text-lg text-red-600">לא ניתן לגשת למיקום המכשיר</p>
184: 182:         )}
185: 183: 
186: 184:         {status === "error" && (
187: 185:           <p className="text-lg text-red-600">{errorMsg || "שגיאה"}</p>
188: 186:         )}
189: 187: 
190: 188:         {status === "choose" && (
191: 189:           <div className="space-y-3 text-right">
192: 190:             <div>
193: 191:               <p className="text-lg font-semibold">בחר/י את שמך</p>
194: 192:               <p className="text-sm text-slate-500">בחר פעם אחת בלבד</p>
195: 193:             </div>
196: 194:             <input
197: 195:               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
198: 196:               placeholder="חיפוש לפי שם"
199: 197:               value={search}
200: 198:               onChange={(e) => setSearch(e.target.value)}
201: 199:             />
202: 200:             <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
203: 201:               {filteredStudents.length === 0 && (
204: 202:                 <p className="p-4 text-sm text-slate-500">אין תוצאות</p>
205: 203:               )}
206: 204:               {filteredStudents.map((student) => (
207: 205:                 <button
208: 206:                   key={student.id}
209: 207:                   className={
210: 208:                     "w-full px-4 py-3 text-right hover:bg-slate-50 " +
211: 209:                     (student.device_id ? "opacity-50 cursor-not-allowed" : "")
212: 210:                   }
213: 211:                   onClick={() => handleChoose(student)}
214: 212:                   disabled={!!student.device_id}
215: 213:                 >
216: 214:                   <div className="font-medium">{student.full_name}</div>
217: 215:                   <div className="text-slate-500 text-sm">{student.group_name}</div>
218: 216:                 </button>
219: 217:               ))}
220: 218:             </div>
221: 219:           </div>
222: 220:         )}
223: 221:       </div>
224: 222:     </main>
225: 223:   );
226: 224: }
227: ```
228: 
229: ### D:\Projects\Goose\mashov-bridge\app\(public)\checkin\page.tsx
230: ```
231: 1: "use client";
232: 2: 
233: 3: import { useEffect, useMemo, useState } from "react";
234: 4: import { supabase } from "@/lib/supabase/client";
235: 5: import { distanceInMeters, SCHOOL_LAT, SCHOOL_LNG } from "@/lib/geo";
236: 6: import type { Database } from "@/types/supabase";
237: 7: 
238: 8: const DEVICE_KEY = "mashov_device_id";
239: 9: const MAX_DISTANCE_METERS = 150;
240: 10: 
241: 11: type Student = {
242: 12:   id: string;
243: 13:   full_name: string;
244: 14:   group_name: string;
245: 15:   device_id: string | null;
246: 16: };
247: 17: 
248: 18: type Status =
249: 19:   | "loading"
250: 20:   | "choose"
251: 21:   | "success"
252: 22:   | "error"
253: 23:   | "already"
254: 24:   | "no_location"
255: 25:   | "too_far";
256: 26: 
257: 27: export default function CheckinPage() {
258: 28:   const [status, setStatus] = useState<Status>("loading");
259: 29:   const [students, setStudents] = useState<Student[]>([]);
260: 30:   const [studentName, setStudentName] = useState("");
261: 31:   const [errorMsg, setErrorMsg] = useState("");
262: 32:   const [search, setSearch] = useState("");
263: 33: 
264: 34:   const deviceId = useMemo(() => {
265: 35:     if (typeof window === "undefined") return null;
266: 36:     return localStorage.getItem(DEVICE_KEY);
267: 37:   }, []);
268: 38: 
269: 39:   const getLocation = () =>
270: 40:     new Promise<{ lat: number; lng: number }>((resolve, reject) => {
271: 41:       if (!navigator.geolocation) {
272: 42:         reject(new Error("no_geo"));
273: 43:         return;
274: 44:       }
275: 45:       navigator.geolocation.getCurrentPosition(
276: 46:         (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
277: 47:         () => reject(new Error("no_geo"))
278: 48:       );
279: 49:     });
280: 50: 
281: 51:   const attemptCheckin = async (student: Student) => {
282: 52:     try {
283: 53:       const { lat, lng } = await getLocation();
284: 54:       const dist = distanceInMeters(lat, lng, SCHOOL_LAT, SCHOOL_LNG);
285: 55: 
286: 56:       if (dist > MAX_DISTANCE_METERS) {
287: 57:         setStatus("too_far");
288: 58:         return;
289: 59:       }
290: 60: 
291: 61:       const payload: Database["public"]["Tables"]["attendance_logs"]["Insert"] = {
292: 62:         student_id: student.id,
293: 63:         method: "QR",
294: 64:         lat,
295: 65:         lng,
296: 66:         is_verified_location: true,
297: 67:       };
298: 68: 
299: 69:       const { error } = await (supabase as any).from("attendance_logs").insert(payload);
300: 70: 
301: 71:       if (error) {
302: 72:         if ((error as { code?: string }).code === "23505") {
303: 73:           setStudentName(student.full_name);
304: 74:           setStatus("already");
305: 75:           return;
306: 76:         }
307: 77:         setErrorMsg("שגיאה ברישום נוכחות");
308: 78:         setStatus("error");
309: 79:         return;
310: 80:       }
311: 81: 
312: 82:       setStudentName(student.full_name);
313: 83:       setStatus("success");
314: 84:     } catch {
315: 85:       setStatus("no_location");
316: 86:     }
317: 87:   };
318: 88: 
319: 89:   useEffect(() => {
320: 90:     const run = async () => {
321: 91:       if (deviceId) {
322: 92:         const { data: student } = await supabase
323: 93:           .from("students")
324: 94:           .select("id, full_name, group_name, device_id")
325: 95:           .eq("device_id", deviceId)
326: 96:           .single();
327: 97: 
328: 98:         if (student) {
329: 99:           await attemptCheckin(student as Student);
330: 100:           return;
331: 101:         }
332: 102: 
333: 103:         localStorage.removeItem(DEVICE_KEY);
334: 104:       }
335: 105: 
336: 106:       const { data, error } = await supabase
337: 107:         .from("students")
338: 108:         .select("id, full_name, group_name, device_id")
339: 109:         .order("full_name");
340: 110: 
341: 111:       if (error || !data) {
342: 112:         setErrorMsg("לא ניתן לטעון רשימת חניכים");
343: 113:         setStatus("error");
344: 114:         return;
345: 115:       }
346: 116: 
347: 117:       setStudents(data as Student[]);
348: 118:       setStatus("choose");
349: 119:     };
350: 120: 
351: 121:     run();
352: 122:   }, [deviceId]);
353: 123: 
354: 124:   const handleChoose = async (student: Student) => {
355: 125:     if (student.device_id) {
356: 126:       setErrorMsg("החניך כבר משויך למכשיר אחר");
357: 127:       setStatus("error");
358: 128:       return;
359: 129:     }
360: 130: 
361: 131:     try {
362: 132:       const id =
363: 133:         window.crypto?.randomUUID?.() ??
364: 134:         Date.now().toString() + "-" + Math.random().toString(16).slice(2);
365: 135: 
366: 136:       const { error: updateError } = await supabase
367: 137:         .from("students")
368: 138:         .update({ device_id: id })
369: 139:         .eq("id", student.id);
370: 140: 
371: 141:       if (updateError) {
372: 142:         setErrorMsg("לא ניתן לשייך את המכשיר");
373: 143:         setStatus("error");
374: 144:         return;
375: 145:       }
376: 146: 
377: 147:       localStorage.setItem(DEVICE_KEY, id);
378: 148:       await attemptCheckin(student);
379: 149:     } catch {
380: 150:       setErrorMsg("שגיאה כללית");
381: 151:       setStatus("error");
382: 152:     }
383: 153:   };
384: 154: 
385: 155:   const filteredStudents = students.filter((student) =>
386: 156:     student.full_name.toLowerCase().includes(search.trim().toLowerCase())
387: 157:   );
388: 158: 
389: 159:   return (
390: 160:     <main className="min-h-screen flex items-center justify-center p-6 text-center">
391: 161:       <div className="max-w-md bg-white shadow rounded-2xl p-6 space-y-4 w-full">
392: 162:         {status === "loading" && <p>טוען...</p>}
393: 163: 
394: 164:         {status === "success" && (
395: 165:           <p className="text-lg font-semibold">
396: 166:             שלום {studentName}, נוכחותך נקלטה בהצלחה
397: 167:           </p>
398: 168:         )}
399: 169: 
400: 170:         {status === "already" && (
401: 171:           <p className="text-lg font-semibold">
402: 172:             שלום {studentName}, נוכחותך כבר נרשמה היום
403: 173:           </p>
404: 174:         )}
405: 175: 
406: 176:         {status === "too_far" && (
407: 177:           <p className="text-lg text-red-600">אינך נמצא בקרבת בית הספר</p>
408: 178:         )}
409: 179: 
410: 180:         {status === "no_location" && (
411: 181:           <p className="text-lg text-red-600">לא ניתן לגשת למיקום המכשיר</p>
412: 182:         )}
413: 183: 
414: 184:         {status === "error" && (
415: 185:           <p className="text-lg text-red-600">{errorMsg || "שגיאה"}</p>
416: 186:         )}
417: 187: 
418: 188:         {status === "choose" && (
419: 189:           <div className="space-y-3 text-right">
420: 190:             <div>
421: 191:               <p className="text-lg font-semibold">בחר/י את שמך</p>
422: 192:               <p className="text-sm text-slate-500">בחר פעם אחת בלבד</p>
423: 193:             </div>
424: 194:             <input
425: 195:               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
426: 196:               placeholder="חיפוש לפי שם"
427: 197:               value={search}
428: 198:               onChange={(e) => setSearch(e.target.value)}
429: 199:             />
430: 200:             <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
431: 201:               {filteredStudents.length === 0 && (
432: 202:                 <p className="p-4 text-sm text-slate-500">אין תוצאות</p>
433: 203:               )}
434: 204:               {filteredStudents.map((student) => (
435: 205:                 <button
436: 206:                   key={student.id}
437: 207:                   className={
438: 208:                     "w-full px-4 py-3 text-right hover:bg-slate-50 " +
439: 209:                     (student.device_id ? "opacity-50 cursor-not-allowed" : "")
440: 210:                   }
441: 211:                   onClick={() => handleChoose(student)}
442: 212:                   disabled={!!student.device_id}
443: 213:                 >
444: 214:                   <div className="font-medium">{student.full_name}</div>
445: 215:                   <div className="text-slate-500 text-sm">{student.group_name}</div>
446: 216:                 </button>
447: 217:               ))}
448: 218:             </div>
449: 219:           </div>
450: 220:         )}
451: 221:       </div>
452: 222:     </main>
453: 223:   );
454: 224: }
455: ```
```

### D:\Projects\Goose\mashov-bridge\app\(public)\checkin\page.tsx
```
1: ### D:\Projects\Goose\mashov-bridge\app\(public)\checkin\page.tsx
2: ```
3: 1: "use client";
4: 2: 
5: 3: import { useEffect, useMemo, useState } from "react";
6: 4: import { supabase } from "@/lib/supabase/client";
7: 5: import { distanceInMeters, SCHOOL_LAT, SCHOOL_LNG } from "@/lib/geo";
8: 6: import type { Database } from "@/types/supabase";
9: 7: 
10: 8: const DEVICE_KEY = "mashov_device_id";
11: 9: const MAX_DISTANCE_METERS = 150;
12: 10: 
13: 11: type Student = {
14: 12:   id: string;
15: 13:   full_name: string;
16: 14:   group_name: string;
17: 15:   device_id: string | null;
18: 16: };
19: 17: 
20: 18: type Status =
21: 19:   | "loading"
22: 20:   | "choose"
23: 21:   | "success"
24: 22:   | "error"
25: 23:   | "already"
26: 24:   | "no_location"
27: 25:   | "too_far";
28: 26: 
29: 27: export default function CheckinPage() {
30: 28:   const [status, setStatus] = useState<Status>("loading");
31: 29:   const [students, setStudents] = useState<Student[]>([]);
32: 30:   const [studentName, setStudentName] = useState("");
33: 31:   const [errorMsg, setErrorMsg] = useState("");
34: 32:   const [search, setSearch] = useState("");
35: 33: 
36: 34:   const deviceId = useMemo(() => {
37: 35:     if (typeof window === "undefined") return null;
38: 36:     return localStorage.getItem(DEVICE_KEY);
39: 37:   }, []);
40: 38: 
41: 39:   const getLocation = () =>
42: 40:     new Promise<{ lat: number; lng: number }>((resolve, reject) => {
43: 41:       if (!navigator.geolocation) {
44: 42:         reject(new Error("no_geo"));
45: 43:         return;
46: 44:       }
47: 45:       navigator.geolocation.getCurrentPosition(
48: 46:         (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
49: 47:         () => reject(new Error("no_geo"))
50: 48:       );
51: 49:     });
52: 50: 
53: 51:   const attemptCheckin = async (student: Student) => {
54: 52:     try {
55: 53:       const { lat, lng } = await getLocation();
56: 54:       const dist = distanceInMeters(lat, lng, SCHOOL_LAT, SCHOOL_LNG);
57: 55: 
58: 56:       if (dist > MAX_DISTANCE_METERS) {
59: 57:         setStatus("too_far");
60: 58:         return;
61: 59:       }
62: 60: 
63: 61:       const payload: Database["public"]["Tables"]["attendance_logs"]["Insert"] = {
64: 62:         student_id: student.id,
65: 63:         method: "QR",
66: 64:         lat,
67: 65:         lng,
68: 66:         is_verified_location: true,
69: 67:       };
70: 68: 
71: 69:       const { error } = await (supabase as any).from("attendance_logs").insert(payload);
72: 70: 
73: 71:       if (error) {
74: 72:         if ((error as { code?: string }).code === "23505") {
75: 73:           setStudentName(student.full_name);
76: 74:           setStatus("already");
77: 75:           return;
78: 76:         }
79: 77:         setErrorMsg("שגיאה ברישום נוכחות");
80: 78:         setStatus("error");
81: 79:         return;
82: 80:       }
83: 81: 
84: 82:       setStudentName(student.full_name);
85: 83:       setStatus("success");
86: 84:     } catch {
87: 85:       setStatus("no_location");
88: 86:     }
89: 87:   };
90: 88: 
91: 89:   useEffect(() => {
92: 90:     const run = async () => {
93: 91:       if (deviceId) {
94: 92:         const { data: student } = await supabase
95: 93:           .from("students")
96: 94:           .select("id, full_name, group_name, device_id")
97: 95:           .eq("device_id", deviceId)
98: 96:           .single();
99: 97: 
100: 98:         if (student) {
101: 99:           await attemptCheckin(student as Student);
102: 100:           return;
103: 101:         }
104: 102: 
105: 103:         localStorage.removeItem(DEVICE_KEY);
106: 104:       }
107: 105: 
108: 106:       const { data, error } = await supabase
109: 107:         .from("students")
110: 108:         .select("id, full_name, group_name, device_id")
111: 109:         .order("full_name");
112: 110: 
113: 111:       if (error || !data) {
114: 112:         setErrorMsg("לא ניתן לטעון רשימת חניכים");
115: 113:         setStatus("error");
116: 114:         return;
117: 115:       }
118: 116: 
119: 117:       setStudents(data as Student[]);
120: 118:       setStatus("choose");
121: 119:     };
122: 120: 
123: 121:     run();
124: 122:   }, [deviceId]);
125: 123: 
126: 124:   const handleChoose = async (student: Student) => {
127: 125:     if (student.device_id) {
128: 126:       setErrorMsg("החניך כבר משויך למכשיר אחר");
129: 127:       setStatus("error");
130: 128:       return;
131: 129:     }
132: 130: 
133: 131:     try {
134: 132:       const id =
135: 133:         window.crypto?.randomUUID?.() ??
136: 134:         Date.now().toString() + "-" + Math.random().toString(16).slice(2);
137: 135: 
138: 136:       const { error: updateError } = await supabase
139: 137:         .from("students")
140: 138:         .update({ device_id: id })
141: 139:         .eq("id", student.id);
142: 140: 
143: 141:       if (updateError) {
144: 142:         setErrorMsg("לא ניתן לשייך את המכשיר");
145: 143:         setStatus("error");
146: 144:         return;
147: 145:       }
148: 146: 
149: 147:       localStorage.setItem(DEVICE_KEY, id);
150: 148:       await attemptCheckin(student);
151: 149:     } catch {
152: 150:       setErrorMsg("שגיאה כללית");
153: 151:       setStatus("error");
154: 152:     }
155: 153:   };
156: 154: 
157: 155:   const filteredStudents = students.filter((student) =>
158: 156:     student.full_name.toLowerCase().includes(search.trim().toLowerCase())
159: 157:   );
160: 158: 
161: 159:   return (
162: 160:     <main className="min-h-screen flex items-center justify-center p-6 text-center">
163: 161:       <div className="max-w-md bg-white shadow rounded-2xl p-6 space-y-4 w-full">
164: 162:         {status === "loading" && <p>טוען...</p>}
165: 163: 
166: 164:         {status === "success" && (
167: 165:           <p className="text-lg font-semibold">
168: 166:             שלום {studentName}, נוכחותך נקלטה בהצלחה
169: 167:           </p>
170: 168:         )}
171: 169: 
172: 170:         {status === "already" && (
173: 171:           <p className="text-lg font-semibold">
174: 172:             שלום {studentName}, נוכחותך כבר נרשמה היום
175: 173:           </p>
176: 174:         )}
177: 175: 
178: 176:         {status === "too_far" && (
179: 177:           <p className="text-lg text-red-600">אינך נמצא בקרבת בית הספר</p>
180: 178:         )}
181: 179: 
182: 180:         {status === "no_location" && (
183: 181:           <p className="text-lg text-red-600">לא ניתן לגשת למיקום המכשיר</p>
184: 182:         )}
185: 183: 
186: 184:         {status === "error" && (
187: 185:           <p className="text-lg text-red-600">{errorMsg || "שגיאה"}</p>
188: 186:         )}
189: 187: 
190: 188:         {status === "choose" && (
191: 189:           <div className="space-y-3 text-right">
192: 190:             <div>
193: 191:               <p className="text-lg font-semibold">בחר/י את שמך</p>
194: 192:               <p className="text-sm text-slate-500">בחר פעם אחת בלבד</p>
195: 193:             </div>
196: 194:             <input
197: 195:               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
198: 196:               placeholder="חיפוש לפי שם"
199: 197:               value={search}
200: 198:               onChange={(e) => setSearch(e.target.value)}
201: 199:             />
202: 200:             <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
203: 201:               {filteredStudents.length === 0 && (
204: 202:                 <p className="p-4 text-sm text-slate-500">אין תוצאות</p>
205: 203:               )}
206: 204:               {filteredStudents.map((student) => (
207: 205:                 <button
208: 206:                   key={student.id}
209: 207:                   className={
210: 208:                     "w-full px-4 py-3 text-right hover:bg-slate-50 " +
211: 209:                     (student.device_id ? "opacity-50 cursor-not-allowed" : "")
212: 210:                   }
213: 211:                   onClick={() => handleChoose(student)}
214: 212:                   disabled={!!student.device_id}
215: 213:                 >
216: 214:                   <div className="font-medium">{student.full_name}</div>
217: 215:                   <div className="text-slate-500 text-sm">{student.group_name}</div>
218: 216:                 </button>
219: 217:               ))}
220: 218:             </div>
221: 219:           </div>
222: 220:         )}
223: 221:       </div>
224: 222:     </main>
225: 223:   );
226: 224: }
227: ```
228: 
229: ### D:\Projects\Goose\mashov-bridge\app\(public)\checkin\page.tsx
230: ```
231: 1: "use client";
232: 2: 
233: 3: import { useEffect, useMemo, useState } from "react";
234: 4: import { supabase } from "@/lib/supabase/client";
235: 5: import { distanceInMeters, SCHOOL_LAT, SCHOOL_LNG } from "@/lib/geo";
236: 6: import type { Database } from "@/types/supabase";
237: 7: 
238: 8: const DEVICE_KEY = "mashov_device_id";
239: 9: const MAX_DISTANCE_METERS = 150;
240: 10: 
241: 11: type Student = {
242: 12:   id: string;
243: 13:   full_name: string;
244: 14:   group_name: string;
245: 15:   device_id: string | null;
246: 16: };
247: 17: 
248: 18: type Status =
249: 19:   | "loading"
250: 20:   | "choose"
251: 21:   | "success"
252: 22:   | "error"
253: 23:   | "already"
254: 24:   | "no_location"
255: 25:   | "too_far";
256: 26: 
257: 27: export default function CheckinPage() {
258: 28:   const [status, setStatus] = useState<Status>("loading");
259: 29:   const [students, setStudents] = useState<Student[]>([]);
260: 30:   const [studentName, setStudentName] = useState("");
261: 31:   const [errorMsg, setErrorMsg] = useState("");
262: 32:   const [search, setSearch] = useState("");
263: 33: 
264: 34:   const deviceId = useMemo(() => {
265: 35:     if (typeof window === "undefined") return null;
266: 36:     return localStorage.getItem(DEVICE_KEY);
267: 37:   }, []);
268: 38: 
269: 39:   const getLocation = () =>
270: 40:     new Promise<{ lat: number; lng: number }>((resolve, reject) => {
271: 41:       if (!navigator.geolocation) {
272: 42:         reject(new Error("no_geo"));
273: 43:         return;
274: 44:       }
275: 45:       navigator.geolocation.getCurrentPosition(
276: 46:         (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
277: 47:         () => reject(new Error("no_geo"))
278: 48:       );
279: 49:     });
280: 50: 
281: 51:   const attemptCheckin = async (student: Student) => {
282: 52:     try {
283: 53:       const { lat, lng } = await getLocation();
284: 54:       const dist = distanceInMeters(lat, lng, SCHOOL_LAT, SCHOOL_LNG);
285: 55: 
286: 56:       if (dist > MAX_DISTANCE_METERS) {
287: 57:         setStatus("too_far");
288: 58:         return;
289: 59:       }
290: 60: 
291: 61:       const payload: Database["public"]["Tables"]["attendance_logs"]["Insert"] = {
292: 62:         student_id: student.id,
293: 63:         method: "QR",
294: 64:         lat,
295: 65:         lng,
296: 66:         is_verified_location: true,
297: 67:       };
298: 68: 
299: 69:       const { error } = await (supabase as any).from("attendance_logs").insert(payload);
300: 70: 
301: 71:       if (error) {
302: 72:         if ((error as { code?: string }).code === "23505") {
303: 73:           setStudentName(student.full_name);
304: 74:           setStatus("already");
305: 75:           return;
306: 76:         }
307: 77:         setErrorMsg("שגיאה ברישום נוכחות");
308: 78:         setStatus("error");
309: 79:         return;
310: 80:       }
311: 81: 
312: 82:       setStudentName(student.full_name);
313: 83:       setStatus("success");
314: 84:     } catch {
315: 85:       setStatus("no_location");
316: 86:     }
317: 87:   };
318: 88: 
319: 89:   useEffect(() => {
320: 90:     const run = async () => {
321: 91:       if (deviceId) {
322: 92:         const { data: student } = await supabase
323: 93:           .from("students")
324: 94:           .select("id, full_name, group_name, device_id")
325: 95:           .eq("device_id", deviceId)
326: 96:           .single();
327: 97: 
328: 98:         if (student) {
329: 99:           await attemptCheckin(student as Student);
330: 100:           return;
331: 101:         }
332: 102: 
333: 103:         localStorage.removeItem(DEVICE_KEY);
334: 104:       }
335: 105: 
336: 106:       const { data, error } = await supabase
337: 107:         .from("students")
338: 108:         .select("id, full_name, group_name, device_id")
339: 109:         .order("full_name");
340: 110: 
341: 111:       if (error || !data) {
342: 112:         setErrorMsg("לא ניתן לטעון רשימת חניכים");
343: 113:         setStatus("error");
344: 114:         return;
345: 115:       }
346: 116: 
347: 117:       setStudents(data as Student[]);
348: 118:       setStatus("choose");
349: 119:     };
350: 120: 
351: 121:     run();
352: 122:   }, [deviceId]);
353: 123: 
354: 124:   const handleChoose = async (student: Student) => {
355: 125:     if (student.device_id) {
356: 126:       setErrorMsg("החניך כבר משויך למכשיר אחר");
357: 127:       setStatus("error");
358: 128:       return;
359: 129:     }
360: 130: 
361: 131:     try {
362: 132:       const id =
363: 133:         window.crypto?.randomUUID?.() ??
364: 134:         Date.now().toString() + "-" + Math.random().toString(16).slice(2);
365: 135: 
366: 136:       const { error: updateError } = await supabase
367: 137:         .from("students")
368: 138:         .update({ device_id: id })
369: 139:         .eq("id", student.id);
370: 140: 
371: 141:       if (updateError) {
372: 142:         setErrorMsg("לא ניתן לשייך את המכשיר");
373: 143:         setStatus("error");
374: 144:         return;
375: 145:       }
376: 146: 
377: 147:       localStorage.setItem(DEVICE_KEY, id);
378: 148:       await attemptCheckin(student);
379: 149:     } catch {
380: 150:       setErrorMsg("שגיאה כללית");
381: 151:       setStatus("error");
382: 152:     }
383: 153:   };
384: 154: 
385: 155:   const filteredStudents = students.filter((student) =>
386: 156:     student.full_name.toLowerCase().includes(search.trim().toLowerCase())
387: 157:   );
388: 158: 
389: 159:   return (
390: 160:     <main className="min-h-screen flex items-center justify-center p-6 text-center">
391: 161:       <div className="max-w-md bg-white shadow rounded-2xl p-6 space-y-4 w-full">
392: 162:         {status === "loading" && <p>טוען...</p>}
393: 163: 
394: 164:         {status === "success" && (
395: 165:           <p className="text-lg font-semibold">
396: 166:             שלום {studentName}, נוכחותך נקלטה בהצלחה
397: 167:           </p>
398: 168:         )}
399: 169: 
400: 170:         {status === "already" && (
401: 171:           <p className="text-lg font-semibold">
402: 172:             שלום {studentName}, נוכחותך כבר נרשמה היום
403: 173:           </p>
404: 174:         )}
405: 175: 
406: 176:         {status === "too_far" && (
407: 177:           <p className="text-lg text-red-600">אינך נמצא בקרבת בית הספר</p>
408: 178:         )}
409: 179: 
410: 180:         {status === "no_location" && (
411: 181:           <p className="text-lg text-red-600">לא ניתן לגשת למיקום המכשיר</p>
412: 182:         )}
413: 183: 
414: 184:         {status === "error" && (
415: 185:           <p className="text-lg text-red-600">{errorMsg || "שגיאה"}</p>
416: 186:         )}
417: 187: 
418: 188:         {status === "choose" && (
419: 189:           <div className="space-y-3 text-right">
420: 190:             <div>
421: 191:               <p className="text-lg font-semibold">בחר/י את שמך</p>
422: 192:               <p className="text-sm text-slate-500">בחר פעם אחת בלבד</p>
423: 193:             </div>
424: 194:             <input
425: 195:               className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
426: 196:               placeholder="חיפוש לפי שם"
427: 197:               value={search}
428: 198:               onChange={(e) => setSearch(e.target.value)}
429: 199:             />
430: 200:             <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
431: 201:               {filteredStudents.length === 0 && (
432: 202:                 <p className="p-4 text-sm text-slate-500">אין תוצאות</p>
433: 203:               )}
434: 204:               {filteredStudents.map((student) => (
435: 205:                 <button
436: 206:                   key={student.id}
437: 207:                   className={
438: 208:                     "w-full px-4 py-3 text-right hover:bg-slate-50 " +
439: 209:                     (student.device_id ? "opacity-50 cursor-not-allowed" : "")
440: 210:                   }
441: 211:                   onClick={() => handleChoose(student)}
442: 212:                   disabled={!!student.device_id}
443: 213:                 >
444: 214:                   <div className="font-medium">{student.full_name}</div>
445: 215:                   <div className="text-slate-500 text-sm">{student.group_name}</div>
446: 216:                 </button>
447: 217:               ))}
448: 218:             </div>
449: 219:           </div>
450: 220:         )}
451: 221:       </div>
452: 222:     </main>
453: 223:   );
454: 224: }
455: ```
```
