export default function DegradedModeBanner({ reason }: { reason?: string }) {
  if (!reason) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-[#ffe0b2] bg-[#fff8e1] px-3 py-2.5">
      <svg className="w-4 h-4 text-[#e65100] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <div>
        <p className="text-[11px] font-semibold text-[#e65100]">Djelomični podaci</p>
        <p className="text-[11px] text-[#bf360c] leading-snug">{reason}</p>
      </div>
    </div>
  );
}
