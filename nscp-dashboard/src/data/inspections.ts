export type InspectionStatus = "U tijeku" | "Završena";

/** Logged-in inspector (mock — replace with auth/session in production) */
export const CURRENT_USER = "Marko Horvat";

export type InspectionListScope = "mine" | "all";

export interface Inspection {
  id: string;
  vozilo: string;
  ruta: string;
  razlog: string;
  lokacija: string;
  inspektor: string;
  datum: string;
  status: InspectionStatus;
  badges?: string[];
}

export const INSPECTIONS: Inspection[] = [
  {
    id: "INS-2024-0418",
    vozilo: "ZG-1234-AB",
    ruta: "Zagreb → Split",
    razlog: "Redovna kontrola",
    lokacija: "A1, km 142, Bosiljevo",
    inspektor: CURRENT_USER,
    datum: "18.04.2024.",
    status: "Završena",
    badges: ["ADR"],
  },
  {
    id: "INS-2024-0417",
    vozilo: "ST-5678-CD",
    ruta: "Split → Rijeka",
    razlog: "Ciljana inspekcija",
    lokacija: "D8, Makarska",
    inspektor: "Ana Kovačević",
    datum: "17.04.2024.",
    status: "Završena",
  },
  {
    id: "INS-2024-0416",
    vozilo: "RI-9012-EF",
    ruta: "Rijeka → Varaždin",
    razlog: "Prometna nesreća",
    lokacija: "A6, km 45, Kikovica",
    inspektor: "Ivan Babić",
    datum: "16.04.2024.",
    status: "U tijeku",
    badges: ["ADR"],
  },
  {
    id: "INS-2024-0415",
    vozilo: "OS-3456-GH",
    ruta: "Osijek → Zagreb",
    razlog: "Redovna kontrola",
    lokacija: "A5, km 78, Đakovo",
    inspektor: CURRENT_USER,
    datum: "15.04.2024.",
    status: "Završena",
  },
  {
    id: "INS-2024-0414",
    vozilo: "DU-7890-IJ",
    ruta: "Dubrovnik → Mostar",
    razlog: "Žalba",
    lokacija: "Dubrovnik Luka, Gat 3",
    inspektor: "Ana Kovačević",
    datum: "14.04.2024.",
    status: "U tijeku",
  },
  {
    id: "INS-2024-0413",
    vozilo: "ZD-2345-KL",
    ruta: "Zadar → Zagreb",
    razlog: "Ciljana inspekcija",
    lokacija: "A1, km 234, Gornja Ploča",
    inspektor: "Ivan Babić",
    datum: "13.04.2024.",
    status: "Završena",
  },
  {
    id: "INS-2024-0412",
    vozilo: "ZG-6789-MN",
    ruta: "Zagreb → Varaždin",
    razlog: "Redovna kontrola",
    lokacija: "A4, km 12, Sesvete",
    inspektor: CURRENT_USER,
    datum: "12.04.2024.",
    status: "Završena",
  },
  {
    id: "INS-2024-0411",
    vozilo: "PU-1122-OP",
    ruta: "Pula → Rijeka",
    razlog: "Prometna nesreća",
    lokacija: "A8, km 33, Kanfanar",
    inspektor: "Ana Kovačević",
    datum: "11.04.2024.",
    status: "U tijeku",
    badges: ["ADR"],
  },
  {
    id: "INS-2024-0410",
    vozilo: "KA-3344-QR",
    ruta: "Karlovac → Sisak",
    razlog: "Redovna kontrola",
    lokacija: "D36, km 8, Karlovac",
    inspektor: "Ivan Babić",
    datum: "10.04.2024.",
    status: "U tijeku",
  },
  {
    id: "INS-2024-0409",
    vozilo: "VZ-5566-ST",
    ruta: "Varaždin → Zagreb",
    razlog: "Žalba",
    lokacija: "A4, km 67, Zlatar",
    inspektor: CURRENT_USER,
    datum: "09.04.2024.",
    status: "Završena",
  },
  {
    id: "INS-2024-0408",
    vozilo: "ZG-7788-UV",
    ruta: "Zagreb → Sisak",
    razlog: "Ciljana inspekcija",
    lokacija: "A11, km 22, Velika Gorica",
    inspektor: "Ana Kovačević",
    datum: "08.04.2024.",
    status: "Završena",
  },
  {
    id: "INS-2024-0407",
    vozilo: "BJ-9900-WX",
    ruta: "Bjelovar → Zagreb",
    razlog: "Redovna kontrola",
    lokacija: "D43, km 14, Garešnica",
    inspektor: CURRENT_USER,
    datum: "07.04.2024.",
    status: "Završena",
  },
];
