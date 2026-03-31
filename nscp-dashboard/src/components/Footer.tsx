import akdLogo from "@/assets/logo-akd.png";
import euLogo from "@/assets/logo-eu.png";
import hrLogo from "@/assets/logo-hr-ministry.png";

export default function Footer() {
  return (
    <footer className="bg-[#f4f6f9]">
      <div className="h-[2px] bg-[#002d74]" />
      <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-center gap-0">
        <img
          src={akdLogo}
          alt="AKD"
          style={{ height: "90px", width: "auto", objectFit: "contain" }}
        />
        <div className="h-14 w-px bg-[#c8d0da] mx-8 flex-shrink-0" />
        <img
          src={euLogo}
          alt="Financira Europska unija NextGenerationEU"
          style={{ height: "90px", width: "auto", objectFit: "contain" }}
        />
        <div className="h-14 w-px bg-[#c8d0da] mx-8 flex-shrink-0" />
        <img
          src={hrLogo}
          alt="Republika Hrvatska — Ministarstvo mora, prometa i infrastrukture"
          style={{ height: "90px", width: "auto", objectFit: "contain" }}
        />
      </div>
    </footer>
  );
}
