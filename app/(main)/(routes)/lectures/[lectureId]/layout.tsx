export default function LectureDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {children}
    </div>
  );
}
