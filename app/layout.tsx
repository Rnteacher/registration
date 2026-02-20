import "./globals.css";

export const metadata = {
  title: "Mashov Bridge",
  description: "מערכת נוכחות לבית הספר",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
