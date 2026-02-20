"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Row = {
  timestamp: string;
  students: {
    full_name: string;
    group_name: string;
    mashov_id: string;
  } | null;
};

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("attendance_logs")
      .select("timestamp, students(full_name, group_name, mashov_id)")
      .gte("timestamp", today + "T00:00:00")
      .lte("timestamp", today + "T23:59:59");

    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  const handleLogin = async () => {
    await supabase.auth.signInWithPassword({ email, password });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white shadow rounded-2xl p-6 space-y-4">
          <h1 className="text-xl font-semibold text-center">כניסת צוות</h1>
          <Input
            type="email"
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={handleLogin} className="w-full">
            התחבר
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">דוח נוכחות יומי</h1>
        <Button variant="outline" onClick={handleLogout}>
          התנתק
        </Button>
      </div>

      {loading && <p>טוען נתונים...</p>}

      <table className="w-full border bg-white rounded-lg overflow-hidden">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-3 text-right">שם תלמיד</th>
            <th className="p-3 text-right">קבוצה</th>
            <th className="p-3 text-right">שעה</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              <td className="p-3">{row.students?.full_name}</td>
              <td className="p-3">{row.students?.group_name}</td>
              <td className="p-3">
                {new Date(row.timestamp).toLocaleTimeString("he-IL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
