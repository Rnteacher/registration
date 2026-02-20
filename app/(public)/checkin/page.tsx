"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { distanceInMeters, SCHOOL_LAT, SCHOOL_LNG } from "@/lib/geo";
import type { Database } from "@/types/supabase";

const DEVICE_KEY = "mashov_device_id";
const MAX_DISTANCE_METERS = 150;

type Student = {
  id: string;
  full_name: string;
  group_name: string;
  device_id: string | null;
};

type Status =
  | "loading"
  | "choose"
  | "success"
  | "error"
  | "already"
  | "no_location"
  | "too_far";

export default function CheckinPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [students, setStudents] = useState<Student[]>([]);
  const [studentName, setStudentName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");

  const deviceId = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(DEVICE_KEY);
  }, []);

  const getLocation = () =>
    new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("no_geo"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject(new Error("no_geo"))
      );
    });

  const attemptCheckin = async (student: Student) => {
    try {
      const { lat, lng } = await getLocation();
      const dist = distanceInMeters(lat, lng, SCHOOL_LAT, SCHOOL_LNG);

      if (dist > MAX_DISTANCE_METERS) {
        setStatus("too_far");
        return;
      }

      const payload: Database["public"]["Tables"]["attendance_logs"]["Insert"] = {
        student_id: student.id,
        method: "QR",
        lat,
        lng,
        is_verified_location: true,
      };

      const { error } = await (supabase as any).from("attendance_logs").insert(payload);

      if (error) {
        if ((error as { code?: string }).code === "23505") {
          setStudentName(student.full_name);
          setStatus("already");
          return;
        }
        setErrorMsg("שגיאה ברישום נוכחות");
        setStatus("error");
        return;
      }

      setStudentName(student.full_name);
      setStatus("success");
    } catch {
      setStatus("no_location");
    }
  };

  useEffect(() => {
    const run = async () => {
      if (deviceId) {
        const { data: student } = await supabase
          .from("students")
          .select("id, full_name, group_name, device_id")
          .eq("device_id", deviceId)
          .single();

        if (student) {
          await attemptCheckin(student as Student);
          return;
        }

        localStorage.removeItem(DEVICE_KEY);
      }

      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, group_name, device_id")
        .order("full_name");

      if (error || !data) {
        setErrorMsg("לא ניתן לטעון רשימת חניכים");
        setStatus("error");
        return;
      }

      setStudents(data as Student[]);
      setStatus("choose");
    };

    run();
  }, [deviceId]);

  const handleChoose = async (student: Student) => {
    if (student.device_id) {
      setErrorMsg("החניך כבר משויך למכשיר אחר");
      setStatus("error");
      return;
    }

    try {
      const id =
        window.crypto?.randomUUID?.() ??
        Date.now().toString() + "-" + Math.random().toString(16).slice(2);

      const { error: updateError } = await supabase
        .from("students")
        .update({ device_id: id })
        .eq("id", student.id);

      if (updateError) {
        setErrorMsg("לא ניתן לשייך את המכשיר");
        setStatus("error");
        return;
      }

      localStorage.setItem(DEVICE_KEY, id);
      await attemptCheckin(student);
    } catch {
      setErrorMsg("שגיאה כללית");
      setStatus("error");
    }
  };

  const filteredStudents = students.filter((student) =>
    student.full_name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <main className="min-h-screen flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white shadow rounded-2xl p-6 space-y-4 w-full">
        {status === "loading" && <p>טוען...</p>}

        {status === "success" && (
          <p className="text-lg font-semibold">
            שלום {studentName}, נוכחותך נקלטה בהצלחה
          </p>
        )}

        {status === "already" && (
          <p className="text-lg font-semibold">
            שלום {studentName}, נוכחותך כבר נרשמה היום
          </p>
        )}

        {status === "too_far" && (
          <p className="text-lg text-red-600">אינך נמצא בקרבת בית הספר</p>
        )}

        {status === "no_location" && (
          <p className="text-lg text-red-600">לא ניתן לגשת למיקום המכשיר</p>
        )}

        {status === "error" && (
          <p className="text-lg text-red-600">{errorMsg || "שגיאה"}</p>
        )}

        {status === "choose" && (
          <div className="space-y-3 text-right">
            <div>
              <p className="text-lg font-semibold">בחר/י את שמך</p>
              <p className="text-sm text-slate-500">בחר פעם אחת בלבד</p>
            </div>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="חיפוש לפי שם"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-72 overflow-y-auto border rounded-lg divide-y">
              {filteredStudents.length === 0 && (
                <p className="p-4 text-sm text-slate-500">אין תוצאות</p>
              )}
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  className={
                    "w-full px-4 py-3 text-right hover:bg-slate-50 " +
                    (student.device_id ? "opacity-50 cursor-not-allowed" : "")
                  }
                  onClick={() => handleChoose(student)}
                  disabled={!!student.device_id}
                >
                  <div className="font-medium">{student.full_name}</div>
                  <div className="text-slate-500 text-sm">{student.group_name}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
