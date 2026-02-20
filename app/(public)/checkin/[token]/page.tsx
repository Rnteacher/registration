"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckinTokenRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/checkin");
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p>טוען...</p>
    </main>
  );
}
