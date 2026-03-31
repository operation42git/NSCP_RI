/**
 * Client-side mock of portal-mock MockApiInterceptor behaviour.
 */
import type { IdentifiersResponse, IdentifiersSearchBody } from "./types";
import { getMockIdentifiersComplete } from "./mock-identifiers-complete";

/** Same country list as Angular IdentifiersSearchComponent.countries */
export const GATE_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
  "SE", "SY", "LI", "BO",
];

const pollCount: Record<string, number> = {};
let requestCounter = 0;
let sampleXmlBase64: string | null = null;

export function buildSampleXmlBase64(): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<consignment xmlns="http://efti.eu/v1/consignment/common">
    <applicableServiceCharge>
        <appliedAmount currencyId="EUR">1250.00</appliedAmount>
        <calculationBasisCode>WEIGHT</calculationBasisCode>
        <payingPartyRoleCode>CONSIGNOR</payingPartyRoleCode>
        <paymentArrangementCode>PREPAID</paymentArrangementCode>
    </applicableServiceCharge>
    <associatedDocument>
        <formattedIssueDateTime formatId="205">20260328</formattedIssueDateTime>
        <id schemeAgencyId="HR-REG">ZG-2026-00142</id>
        <uRI>https://efti-hr.gov.hr/docs/cmr/ZG-2026-00142</uRI>
        <issueLocation>
            <name>Zagreb</name>
            <postalAddress>
                <cityName>Zagreb</cityName>
                <countryCode>HR</countryCode>
            </postalAddress>
        </issueLocation>
        <issuer>
            <authoritativeSignatoryPerson>
                <name>Ivan Horvat</name>
            </authoritativeSignatoryPerson>
        </issuer>
        <typeCode>CMR</typeCode>
    </associatedDocument>
    <associatedDocument>
        <id>ADR_certifikat_vozilo</id>
        <typeCode>ATTACHMENT</typeCode>
        <attachedBinaryFile>
            <fileName>ADR_certifikat_vozilo.pdf</fileName>
            <mIMECode>application/pdf</mIMECode>
            <sizeMeasure>250880</sizeMeasure>
        </attachedBinaryFile>
    </associatedDocument>
    <associatedDocument>
        <id>PO-2026-0891</id>
        <typeCode>PURCHASE_ORDER</typeCode>
        <referenceTypeCode>Purchase Order</referenceTypeCode>
        <issuer>
            <name>Kemika d.o.o.</name>
        </issuer>
    </associatedDocument>
    <carrierAcceptanceDateTime>2026-03-15T08:00:00+01:00</carrierAcceptanceDateTime>
    <carrierAcceptanceLocation>
        <id schemeAgencyId="UN-LOCODE">HRZAG</id>
        <name>Skladište Zagreb-Istok</name>
        <postalAddress>
            <buildingNumber>80</buildingNumber>
            <streetName>Radnička cesta</streetName>
            <postcode>10000</postcode>
            <cityName>Zagreb</cityName>
            <countrySubDivisionName>Grad Zagreb</countrySubDivisionName>
            <countryCode>HR</countryCode>
        </postalAddress>
        <geographicalCoordinates>
            <latitudeMeasure>45.8141</latitudeMeasure>
            <longitudeMeasure>15.0921</longitudeMeasure>
        </geographicalCoordinates>
    </carrierAcceptanceLocation>
    <carrier>
        <id schemeAgencyId="OIB">11122233344</id>
        <name>Prijevoznička d.o.o.</name>
        <roleCode>Glavni prijevoznik</roleCode>
        <postalAddress>
            <buildingNumber>58</buildingNumber>
            <streetName>Vukovarska</streetName>
            <postcode>10000</postcode>
            <cityName>Zagreb</cityName>
            <countrySubDivisionName>Grad Zagreb</countrySubDivisionName>
            <countryCode>HR</countryCode>
        </postalAddress>
        <taxRegistration>
            <id schemeAgencyId="HR-PDV">HR11122233344</id>
        </taxRegistration>
        <specifiedContactPerson>
            <givenName>Marko</givenName>
            <familyName>Horvat</familyName>
            <telephoneNumber>+385 1 987 6543</telephoneNumber>
        </specifiedContactPerson>
        <agreedContract>
            <issueDateTime>15.03.2026.</issueDateTime>
            <duration>12 mjeseci</duration>
            <signingLocation>Zagreb</signingLocation>
        </agreedContract>
        <applicableLicence>
            <id schemeAgencyId="HR-MPPI">HR-LIC-2024-88831</id>
            <typeCode>Međunarodni prijevoz</typeCode>
        </applicableLicence>
        <confirmedDocumentAuthentication>
            <id>Potvrđeno</id>
        </confirmedDocumentAuthentication>
        <authoritativeSignatoryPerson>
            <name>Marko Horvat</name>
        </authoritativeSignatoryPerson>
    </carrier>
    <freightForwarder>
        <name>Cargo Express d.o.o.</name>
        <departmentName>Odjel za međunarodni transport</departmentName>
        <postalAddress>
            <buildingNumber>12</buildingNumber>
            <streetName>Hektorovićeva</streetName>
            <postcode>10000</postcode>
            <cityName>Zagreb</cityName>
            <countryCode>HR</countryCode>
        </postalAddress>
    </freightForwarder>
    <connectingCarrier>
        <id schemeAgencyId="DE-ST">445566778</id>
        <name>Spedition Huber GmbH</name>
        <postalAddress>
            <buildingNumber>22</buildingNumber>
            <streetName>Bahnhofstr.</streetName>
            <postcode>83022</postcode>
            <cityName>Rosenheim</cityName>
            <countrySubDivisionName>Bayern</countrySubDivisionName>
            <countryCode>DE</countryCode>
        </postalAddress>
        <applicableLicence>
            <id schemeAgencyId="EU-COMM">DE-LIC-2023-55421</id>
            <typeCode>Community licence</typeCode>
        </applicableLicence>
    </connectingCarrier>
    <consignee>
        <id schemeAgencyId="DE-USt">987654321</id>
        <name>Bavarian Auto Parts GmbH</name>
        <postalAddress>
            <buildingNumber>88</buildingNumber>
            <streetName>Ingolstadter Strasse</streetName>
            <postcode>80939</postcode>
            <cityName>Munich</cityName>
            <countrySubDivisionName>Bayern</countrySubDivisionName>
            <countryCode>DE</countryCode>
        </postalAddress>
        <taxRegistration>
            <id schemeAgencyId="DE-USt">DE987654321</id>
        </taxRegistration>
        <specifiedContactPerson>
            <givenName>Hans</givenName>
            <familyName>Mueller</familyName>
            <telephoneNumber>+49 89 123 4567</telephoneNumber>
            <faxNumber>+49 89 123 4500</faxNumber>
            <emailAddress>h.mueller@lager.de</emailAddress>
        </specifiedContactPerson>
        <authoritativeSignatoryPerson>
            <name>Klaus Weber</name>
        </authoritativeSignatoryPerson>
    </consignee>
    <consigneeReceiptLocation>
        <id schemeAgencyId="UN-LOCODE">DEMUC</id>
        <name>Lager München-Nord</name>
        <postalAddress>
            <buildingNumber>15</buildingNumber>
            <streetName>Industriestraße</streetName>
            <postcode>80939</postcode>
            <cityName>München</cityName>
            <countrySubDivisionName>Bayern</countrySubDivisionName>
            <countryCode>DE</countryCode>
        </postalAddress>
        <geographicalCoordinates>
            <latitudeMeasure>48.1951</latitudeMeasure>
            <longitudeMeasure>11.5521</longitudeMeasure>
        </geographicalCoordinates>
    </consigneeReceiptLocation>
    <consignor>
        <id schemeAgencyId="HR-OIB">12345678901</id>
        <name>Adriatic Manufacturing d.o.o.</name>
        <postalAddress>
            <buildingNumber>7</buildingNumber>
            <streetName>Industrijska zona</streetName>
            <postcode>51000</postcode>
            <cityName>Rijeka</cityName>
            <countrySubDivisionName>Primorsko-goranska</countrySubDivisionName>
            <countryCode>HR</countryCode>
            <postOfficeBox>P.P. 128</postOfficeBox>
        </postalAddress>
        <taxRegistration>
            <id schemeAgencyId="HR-PDV">HR12345678901</id>
        </taxRegistration>
        <specifiedContactPerson>
            <givenName>Ana</givenName>
            <familyName>Kovačević</familyName>
            <telephoneNumber>+385 51 234 567</telephoneNumber>
            <emailAddress>info@adriatic-mfg.hr</emailAddress>
        </specifiedContactPerson>
        <confirmedDocumentAuthentication>
            <statementCode>CONFIRMED</statementCode>
        </confirmedDocumentAuthentication>
        <authoritativeSignatoryPerson>
            <name>Ana Kovacevic</name>
        </authoritativeSignatoryPerson>
    </consignor>
    <contractTermsText>Standard CMR terms apply. Delivery within 48h of acceptance.</contractTermsText>
    <grossWeight unitId="KGM">4500</grossWeight>
    <grossVolume unitId="MTQ">18.5</grossVolume>
    <includedConsignmentItem>
        <goodsUnitQuantity>12</goodsUnitQuantity>
        <grossWeight unitId="KGM">2800</grossWeight>
        <grossVolume unitId="MTQ">11.2</grossVolume>
        <shippingMarks>
            <markingText>ADR-HR-2026-A1</markingText>
        </shippingMarks>
        <dimensions>
            <description>Industrial pallets 120x80cm</description>
        </dimensions>
        <transportDangerousGoods>
            <uNDGID>1090</uNDGID>
            <properShippingName>ACETONE</properShippingName>
            <technicalName>Propan-2-on</technicalName>
            <hazardClassificationID>3</hazardClassificationID>
            <hazardCategoryCode>II</hazardCategoryCode>
            <packagingDangerLevelCode>II</packagingDangerLevelCode>
            <tunnelRestrictionCode>D/E</tunnelRestrictionCode>
            <limitedQuantityCode>Ne</limitedQuantityCode>
            <information>Klasa 3, zapaljive tekućine</information>
            <regulatoryAuthorityName>UN</regulatoryAuthorityName>
            <grossWeight unitId="KGM">24500</grossWeight>
            <netWeight unitId="KGM">22800</netWeight>
            <grossVolume unitId="MTQ">28.9</grossVolume>
            <numberOfPackages>48</numberOfPackages>
            <labelCode>3</labelCode>
            <hazardCode>33</hazardCode>
            <density>0,79 kg/l</density>
            <meltingPoint>-95 °C</meltingPoint>
            <controlTemperature>35 °C</controlTemperature>
            <emergencyTemperature>40 °C</emergencyTemperature>
            <packagingTypeCode>1A1</packagingTypeCode>
            <packingDescription>Čelični bubanj</packingDescription>
        </transportDangerousGoods>
    </includedConsignmentItem>
    <includedConsignmentItem>
        <goodsUnitQuantity>8</goodsUnitQuantity>
        <grossWeight unitId="KGM">1700</grossWeight>
        <grossVolume unitId="MTQ">7.3</grossVolume>
        <shippingMarks>
            <markingText>GEN-HR-2026-B2</markingText>
        </shippingMarks>
        <dimensions>
            <description>Cardboard boxes on euro pallets</description>
        </dimensions>
    </includedConsignmentItem>
    <mainCarriageTransportMovement>
        <modeCode>3</modeCode>
        <usedTransportMeans>
            <id schemeAgencyId="VRN">ZG-1234-AB</id>
            <registrationCountry>
                <code>HR</code>
            </registrationCountry>
            <equipmentDescriptionText>Tegljač s poluprikolicom</equipmentDescriptionText>
            <ownerName>Prijevoznička d.o.o.</ownerName>
        </usedTransportMeans>
        <masterResponsiblePerson>
            <name>Ivan Kovačević</name>
            <id>HR-VOZ-2024-1122</id>
            <roleCode>Vozač/šef</roleCode>
        </masterResponsiblePerson>
        <loadingEvent>
            <requestedOccurrenceDateTime>28.03.2026. 04:00</requestedOccurrenceDateTime>
            <plannedOccurrenceDateTime>28.03.2026. 07:00</plannedOccurrenceDateTime>
            <actualOccurrenceDateTime>28.03.2026. 07:45</actualOccurrenceDateTime>
            <occurrenceLocation>
                <name>Terminal Zagreb</name>
            </occurrenceLocation>
            <certifyingParty>
                <name>Kamelia d.o.o.</name>
                <id>Licencija</id>
                <roleCode>Poluodpremnik/Špediter</roleCode>
            </certifyingParty>
        </loadingEvent>
        <unloadingEvent>
            <requestedOccurrenceDateTime>29.03.2026. 07:00</requestedOccurrenceDateTime>
            <plannedOccurrenceDateTime>29.03.2026. 08:00</plannedOccurrenceDateTime>
            <actualOccurrenceDateTime>29.03.2026. 07:45</actualOccurrenceDateTime>
            <occurrenceLocation>
                <name>Lager München-Nord</name>
            </occurrenceLocation>
            <certifyingParty>
                <name>Lager GmbH</name>
                <roleCode>Primatelj</roleCode>
            </certifyingParty>
        </unloadingEvent>
    </mainCarriageTransportMovement>
    <preCarriageTransportMovement>
        <modeCode>3</modeCode>
    </preCarriageTransportMovement>
    <usedTransportEquipment>
        <categoryCode>TRAILER</categoryCode>
        <id>ZG-T-5678</id>
    </usedTransportEquipment>
    <transshipmentLocation>
        <id schemeAgencyId="UN-LOCODE">ATSZG</id>
        <name>Salzburg Terminal</name>
    </transshipmentLocation>
    <deliveryTimeline>
        <requestedDateTime>28.03.2026. 16:00</requestedDateTime>
        <plannedDateTime>29.03.2026. 08:00</plannedDateTime>
        <actualDateTime>29.03.2026. 07:45</actualDateTime>
        <deliveryLocation>
            <id>DEMIC-LGR1</id>
            <name>Lager München-Nord</name>
        </deliveryLocation>
    </deliveryTimeline>
    <plannedPeriod>
        <startDateTime>29.03. 06:00</startDateTime>
        <endDateTime>29.03. 14:00</endDateTime>
        <duration>8 sati</duration>
        <maxDuration>12 sati</maxDuration>
    </plannedPeriod>
    <borderCrossing>
        <locationName>Spielfeld / Šentilj</locationName>
        <dateTime>28.03.2026. 22:15</dateTime>
    </borderCrossing>
    <consignorProvidedBorderClearanceInstructions>
        <description>Roba podliježe carinskom postupku T1. Prijaviti na carinskom uradu Spielfeld. Priložiti EUR1 potvrda o podrijetlu.</description>
    </consignorProvidedBorderClearanceInstructions>
</consignment>`;
  return btoa(unescape(encodeURIComponent(xml)));
}

function pendingIdentifiersResponse(requestId: string): IdentifiersResponse {
  const gates = ["HR", "AT", "SI", "DE"];
  return {
    requestId,
    status: "PENDING",
    errorCode: "",
    errorDescription: "",
    identifiers: gates.map((gateIndicator) => ({
      gateIndicator,
      status: "PENDING" as const,
      errorCode: "",
      errorDescription: "",
      consignments: [],
    })),
  };
}

export async function postIdentifiersSearch(
  _body: IdentifiersSearchBody
): Promise<{ requestId: string; status: string }> {
  await delay(300);
  const requestId = `mock-id-${++requestCounter}`;
  pollCount[requestId] = 0;
  return { requestId, status: "PENDING" };
}

export async function getIdentifiersResult(
  requestId: string
): Promise<IdentifiersResponse> {
  await delay(200);
  pollCount[requestId] = (pollCount[requestId] || 0) + 1;
  if (pollCount[requestId] < 3) {
    return pendingIdentifiersResponse(requestId);
  }
  return getMockIdentifiersComplete(requestId);
}

export async function postUilSearch(): Promise<{
  requestId: string;
  status: string;
}> {
  await delay(300);
  const requestId = `mock-uil-${++requestCounter}`;
  pollCount[requestId] = 0;
  return { requestId, status: "PENDING" };
}

export async function getUilResult(requestId: string): Promise<{
  requestId: string;
  status: string;
  errorCode?: string;
  errorDescription?: string;
  data: string | null;
}> {
  await delay(200);
  pollCount[requestId] = (pollCount[requestId] || 0) + 1;
  if (pollCount[requestId] < 2) {
    return {
      requestId,
      status: "PENDING",
      errorCode: "",
      errorDescription: "",
      data: null,
    };
  }
  if (!sampleXmlBase64) sampleXmlBase64 = buildSampleXmlBase64();
  return {
    requestId,
    status: "COMPLETE",
    errorCode: "",
    errorDescription: "",
    data: sampleXmlBase64,
  };
}

export async function postFollowUpNote(): Promise<{ status: string }> {
  await delay(200);
  return { status: "ok" };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Mirrors Angular IdentifiersSearchComponent.updateSeriesOption */
export function buildIdentifierMapSeries(
  countries: string[],
  result: IdentifiersResponse | null
) {
  const notCalled: [string, number][] = [];
  const inProgress: [string, number][] = [];
  const success: [string, number][] = [];
  const error: [string, number][] = [];
  const timeout: [string, number][] = [];

  countries.forEach((country) => {
    if (!result?.identifiers) {
      notCalled.push([country.toLowerCase(), 0]);
      return;
    }
    const foundRaw = result.identifiers.find((idt) => idt.gateIndicator === country);
    if (!foundRaw) {
      notCalled.push([country.toLowerCase(), 0]);
      return;
    }
    switch (foundRaw.status) {
      case "PENDING":
        inProgress.push([country.toLowerCase(), 0]);
        break;
      case "COMPLETE": {
        const countryResults =
          result.identifiers.filter((id) => id.gateIndicator === country) || [];
        const totalConsignments = countryResults.reduce(
          (sum, r) => sum + (r.consignments?.length || 0),
          0
        );
        success.push([country.toLowerCase(), totalConsignments]);
        break;
      }
      case "TIMEOUT":
        timeout.push([country.toLowerCase(), 0]);
        break;
      case "ERROR":
        error.push([country.toLowerCase(), 0]);
        break;
    }
  });

  return [
    { type: "map" as const, name: "Not called", allAreas: false, data: notCalled, color: "grey" },
    { type: "map" as const, name: "In Progress", allAreas: false, data: inProgress, color: "#003088" },
    { type: "map" as const, name: "Success", allAreas: false, data: success, color: "green" },
    { type: "map" as const, name: "Error", allAreas: false, data: error, color: "red" },
    { type: "map" as const, name: "Timeout", allAreas: false, data: timeout, color: "#ff9900" },
  ];
}
