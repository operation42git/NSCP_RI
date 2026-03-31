import { Component, useEffect, useMemo, useState, type ReactNode, type ErrorInfo } from "react";
import type { IdentifiersResponse } from "@/mock-efti/types";
import {
  buildIdentifierMapSeries,
  GATE_COUNTRIES,
} from "@/mock-efti/mock-efti-api";

let mapModuleReady = false;
let mapModuleFailed = false;
let HighchartsRef: typeof import("highcharts") | null = null;
let HighchartsReactRef: typeof import("highcharts-react-official").default | null = null;

async function loadHighchartsMap() {
  if (mapModuleReady || mapModuleFailed) return;
  try {
    const [hc, hcMap, hcReact] = await Promise.all([
      import("highcharts"),
      import("highcharts/modules/map"),
      import("highcharts-react-official"),
    ]);
    HighchartsRef = hc.default ?? hc;
    HighchartsReactRef = hcReact.default;
    const init = (hcMap.default ?? hcMap) as unknown as (h: unknown) => void;
    init(HighchartsRef);
    mapModuleReady = true;
  } catch (err) {
    console.warn("Highcharts map module failed to load:", err);
    mapModuleFailed = true;
  }
}

interface Props {
  result: IdentifiersResponse | null;
}

class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("EuropeMapChart render error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[320px] flex items-center justify-center bg-[#fff8e1] border border-[#e2c275] rounded-lg text-sm text-[#b45309]">
          Karta nije dostupna
        </div>
      );
    }
    return this.props.children;
  }
}

export default function EuropeMapChart({ result }: Props) {
  const [topology, setTopology] = useState<unknown>(null);
  const [ready, setReady] = useState(mapModuleReady);
  const [failed, setFailed] = useState(mapModuleFailed);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await loadHighchartsMap();
      if (cancelled) return;

      if (mapModuleFailed) {
        setFailed(true);
        return;
      }
      setReady(true);

      try {
        const res = await fetch("/maps/custom_europa.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setTopology(json);
      } catch (err) {
        console.warn("Failed to load map topology:", err);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const options = useMemo((): Record<string, unknown> | null => {
    if (!ready || !topology || !HighchartsRef) return null;
    return {
      chart: { map: topology },
      title: { text: "eFTI" },
      credits: { enabled: false },
      legend: { enabled: true },
      series: buildIdentifierMapSeries(GATE_COUNTRIES, result),
    };
  }, [topology, result, ready]);

  if (failed) {
    return (
      <div className="h-[320px] flex items-center justify-center bg-[#fff8e1] border border-[#e2c275] rounded-lg text-sm text-[#b45309]">
        Karta nije dostupna
      </div>
    );
  }

  if (!options || !HighchartsRef || !HighchartsReactRef) {
    return (
      <div className="h-[320px] flex items-center justify-center bg-[#f7f9fd] border border-[#e2e8f2] rounded-lg text-sm text-[#6b7a8d]">
        Učitavanje karte…
      </div>
    );
  }

  const HCReact = HighchartsReactRef;

  return (
    <MapErrorBoundary>
      <div className="map min-h-[320px] border border-[#e2e8f2] rounded-lg overflow-hidden bg-white">
        <HCReact
          highcharts={HighchartsRef}
          constructorType="mapChart"
          options={options}
          containerProps={{ style: { height: "100%", minHeight: 320 } }}
        />
      </div>
    </MapErrorBoundary>
  );
}
