import { useState, useMemo, useEffect } from "react";
import OperativniSazetakCard from "@/components/efti/OperativniSazetakCard";
import PosiljateljCard from "@/components/efti/PosiljateljCard";
import PrimateljCard from "@/components/efti/PrimateljCard";
import PrijevozniciCard from "@/components/efti/PrijevozniciCard";
import LokacijeIRutaCard from "@/components/efti/LokacijeIRutaCard";
import PrijevozCard from "@/components/efti/PrijevozCard";
import OpasnaRobaCard from "@/components/efti/OpasnaRobaCard";
import EadrPanel from "@/components/eadr/EadrPanel";
import type { EftiConsignment } from "@/types/efti";

export interface DatasetViewModel {
  datasetId: string;
  gateId: string;
  platformId: string;
  consignment: EftiConsignment;
  xml: string;
}

interface Props {
  model: DatasetViewModel;
  onShowXml?: () => void;
  onDownloadXml?: () => void;
  onNavigateEadrFull?: () => void;
  /** Incrementing counter — each bump opens the eADR panel (from sidebar) */
  eadrOpenRequest?: number;
}

function hasAdr(c: EftiConsignment): boolean {
  return (
    !!c.dangerousGoods?.uNDGID ||
    !!c.dangerousGoods?.hazardClassificationID ||
    c.mainCarriageTransportMovement?.dangerousGoodsIndicator === "true" ||
    c.includedConsignmentItem?.some((i) => !!i.transportDangerousGoods) === true
  );
}

export default function DatasetView({ model, onShowXml, onDownloadXml, onNavigateEadrFull, eadrOpenRequest }: Props) {
  const [eadrOpen, setEadrOpen] = useState(false);
  const adr = useMemo(() => hasAdr(model.consignment), [model.consignment]);

  useEffect(() => {
    if (eadrOpenRequest && eadrOpenRequest > 0 && adr) setEadrOpen(true);
  }, [eadrOpenRequest, adr]);

  const vehicleReg =
    model.consignment.mainCarriageTransportMovement?.usedTransportMeans?.id;
  const driverName =
    model.consignment.mainCarriageTransportMovement?.masterResponsiblePerson?.name;

  return (
    <div className="flex flex-col gap-6">
      <OperativniSazetakCard
        id="section-efti-sazetak"
        data={model.consignment}
        onShowXml={onShowXml}
        onDownloadXml={onDownloadXml}
        onOpenEadr={adr ? () => setEadrOpen(true) : undefined}
      />

      <PosiljateljCard
        id="section-efti-posiljatelj"
        party={model.consignment.consignor}
      />

      <PrimateljCard
        id="section-efti-primatelj"
        party={model.consignment.consignee}
      />

      <PrijevozniciCard
        id="section-efti-prijevoznici"
        carrier={model.consignment.carrier}
        freightForwarder={model.consignment.freightForwarder}
        connectingCarrier={model.consignment.connectingCarrier}
      />

      <LokacijeIRutaCard
        id="section-efti-lokacije"
        data={model.consignment}
      />

      <PrijevozCard
        id="section-efti-vozila"
        data={model.consignment}
      />

      <OpasnaRobaCard
        id="section-efti-regulatorno"
        data={model.consignment}
      />

      {adr && (
        <EadrPanel
          open={eadrOpen}
          onOpenChange={setEadrOpen}
          vehicleReg={vehicleReg}
          driverName={driverName}
          onOpenFullView={onNavigateEadrFull}
        />
      )}
    </div>
  );
}
