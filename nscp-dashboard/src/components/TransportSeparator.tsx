import separatorImg from "@/assets/transport-banner.png";

export default function TransportSeparator() {
  return (
    <div
      className="bg-white border-b border-[#e8edf4]"
      style={{
        height: "64px",
        backgroundImage: `url(${separatorImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center 48%",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
