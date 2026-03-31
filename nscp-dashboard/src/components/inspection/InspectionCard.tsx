import { useState } from "react";

interface Note {
  id: number;
  text: string;
  timestamp: string;
}

interface Props {
  isNew: boolean;
  inspectionId: string;
  inspectionStarted?: boolean;
  onStartInspection?: () => void;
}

const fieldCls =
  "border border-[#cfd8e6] rounded-lg px-3 py-2.5 text-sm bg-white text-[#1d2a3a] focus:outline-none focus:ring-2 focus:ring-[#002d74]/20 focus:border-[#002d74]";

const INITIAL_NOTES: Note[] = [
  { id: 1, text: "Vozač predočio CMR dokumentaciju. Potrebna dodatna provjera ADR certifikata.", timestamp: "15.11.2024. 08:55" },
  { id: 2, text: "Kontaktiran dispečer prijevoznika radi potvrde rute.", timestamp: "15.11.2024. 09:12" },
];

export default function InspectionCard({ isNew, inspectionId, inspectionStarted, onStartInspection }: Props) {
  const statusLabel = "U tijeku";
  const actionLabel = isNew && !inspectionStarted ? "Pokreni inspekciju" : "Završi inspekciju";
  const handleAction = () => {
    if (isNew && !inspectionStarted && onStartInspection) {
      onStartInspection();
    }
  };

  const [notes, setNotes] = useState<Note[]>(isNew ? [] : INITIAL_NOTES);
  const [newNote, setNewNote] = useState("");

  const addNote = () => {
    const trimmed = newNote.trim();
    if (!trimmed) return;
    const now = new Date();
    const ts = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getFullYear()}. ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setNotes((prev) => [...prev, { id: Date.now(), text: trimmed, timestamp: ts }]);
    setNewNote("");
  };

  const removeNote = (id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="bg-white border border-[#dde2ea] rounded-xl shadow-[0_2px_12px_rgba(0,45,116,0.09)] overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#fff8e1] text-[#b45309]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fb8c00]" />
            {statusLabel}
          </span>
          <button onClick={handleAction} className="px-4 py-2 text-sm font-medium rounded-md bg-[#002d74] text-white hover:bg-[#1a4a9e] transition-colors whitespace-nowrap">
            {actionLabel}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Službenik", value: "Marko Horvat" },
            { label: "Nadležno tijelo", value: "Državni inspektorat" },
            { label: "Datum početka", value: isNew ? "—" : "15.11.2024. 08:42" },
            { label: "Broj pretraga", value: isNew ? "0" : "3" },
          ].map((m) => (
            <div key={m.label} className="bg-[#f7f9fd] border border-[#e2e8f2] rounded-lg px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold mb-1">
                {m.label}
              </div>
              <div className="text-[15px] font-semibold text-[#1d2a3a]">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#5f6f86]">Razlog inspekcije</label>
            <select className={fieldCls}>
              <option>Granična kontrola</option>
              <option>Ciljana provjera</option>
              <option>Nasumična provjera</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#5f6f86]">Status inspekcije</label>
            <select className={fieldCls}>
              <option>U tijeku</option>
              <option>Završena</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#5f6f86]">Lokacija</label>
            <input
              type="text"
              defaultValue={isNew ? "" : "Bregana (HR/SI)"}
              placeholder="Unesite lokaciju inspekcije"
              className={fieldCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#5f6f86]">Referentna oznaka / broj predmeta</label>
            <input
              type="text"
              placeholder="Po potrebi unesite internu oznaku"
              className={fieldCls}
            />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-[12px] font-semibold text-[#5f6f86]">
              Bilješke inspekcije
              <span className="ml-1.5 text-[11px] font-normal text-[#9aa5b4]">({notes.length})</span>
            </label>

            {notes.length > 0 && (
              <div className="flex flex-col gap-2 mb-1">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-2 bg-[#f7f9fd] border border-[#e2e8f2] rounded-lg px-3 py-2.5 group"
                  >
                    <svg className="w-4 h-4 text-[#9aa5b4] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1d2a3a] leading-snug">{note.text}</p>
                      <p className="text-[11px] text-[#9aa5b4] mt-1">{note.timestamp}</p>
                    </div>
                    <button
                      onClick={() => removeNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#c5cdd8] hover:text-[#e53935] hover:bg-[#fce4ec] transition-all flex-shrink-0"
                      title="Ukloni bilješku"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addNote();
                  }
                }}
                placeholder="Unesite bilješku i pritisnite Enter ili kliknite Dodaj..."
                className={`${fieldCls} min-h-[60px] resize-vertical flex-1`}
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim()}
                className="self-end px-3 py-2.5 text-sm font-medium rounded-lg bg-[#002d74] text-white hover:bg-[#1a4a9e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                + Dodaj
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
