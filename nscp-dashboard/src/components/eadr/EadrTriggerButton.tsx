/**
 * Compact CTA that appears next to the ADR indicator
 * in the OperativniSazetakCard header.
 */
export default function EadrTriggerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border-2 border-[#ef9a9a] text-[#c62828] bg-[#fff5f5] hover:bg-[#ffebee] hover:border-[#e57373] active:bg-[#ffcdd2] transition-colors whitespace-nowrap"
      title="Otvori eADR modul — provjera usklađenosti opasne robe"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      eADR
    </button>
  );
}
