import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await (supabase as any)
    .from("attendance_logs")
    .select("timestamp, students(full_name, group_name, mashov_id)")
    .gte("timestamp", today + "T00:00:00")
    .lte("timestamp", today + "T23:59:59");

  return NextResponse.json({
    date: today,
    present:
      data?.map((row: any) => ({
        full_name: row.students?.full_name,
        mashov_id: row.students?.mashov_id,
        group_name: row.students?.group_name,
        time: new Date(row.timestamp).toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })) ?? [],
  });
}
