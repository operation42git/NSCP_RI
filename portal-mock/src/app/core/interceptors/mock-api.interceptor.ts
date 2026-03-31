import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse
} from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {

  private pollCount: Record<string, number> = {};
  private requestCounter = 0;
  private sampleXmlBase64: string | null = null;

  private readonly MOCK_IDENTIFIERS_COMPLETE = {
    requestId: '',
    status: 'COMPLETE',
    errorCode: '',
    errorDescription: '',
    identifiers: [
      {
        gateIndicator: 'HR',
        status: 'COMPLETE',
        errorCode: '',
        errorDescription: '',
        consignments: [
          {
            id: 1,
            gateId: 'croatia',
            datasetId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
            platformId: 'croatia eFTI platform',
            carrierAcceptanceDatetime: '2026-03-15T08:00:00+01:00',
            deliveryEventActualOccurrenceDatetime: '2026-03-17T14:30:00+01:00',
            mainCarriageTransportMovement: [
              {
                id: 1,
                schemeAgencyId: 'HR-REG',
                modeCode: 3,
                dangerousGoodsIndicator: 'true',
                registrationCountryCode: 'HR'
              }
            ],
            usedTransportEquipment: [
              {
                id: 1,
                sequenceNumber: 1,
                schemeAgencyId: 'ZG-1234-AB',
                registrationCountryCode: 'HR',
                categoryCode: 'TRUCK',
                carriedTransportEquipment: [
                  { id: 1, sequenceNumber: 1, schemeAgencyId: 'ZG-T-5678' }
                ]
              }
            ]
          },
          {
            id: 2,
            gateId: 'croatia',
            datasetId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
            platformId: 'croatia eFTI platform',
            carrierAcceptanceDatetime: '2026-03-10T06:30:00+01:00',
            deliveryEventActualOccurrenceDatetime: '2026-03-12T18:00:00+01:00',
            mainCarriageTransportMovement: [
              {
                id: 2,
                schemeAgencyId: 'HR-REG',
                modeCode: 3,
                dangerousGoodsIndicator: 'false',
                registrationCountryCode: 'HR'
              }
            ],
            usedTransportEquipment: [
              {
                id: 2,
                sequenceNumber: 1,
                schemeAgencyId: 'RI-5432-CD',
                registrationCountryCode: 'HR',
                categoryCode: 'VAN',
                carriedTransportEquipment: []
              }
            ]
          }
        ]
      },
      {
        gateIndicator: 'AT',
        status: 'COMPLETE',
        errorCode: '',
        errorDescription: '',
        consignments: [
          {
            id: 3,
            gateId: 'austria',
            datasetId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
            platformId: 'austria eFTI platform',
            carrierAcceptanceDatetime: '2026-03-14T07:00:00+01:00',
            deliveryEventActualOccurrenceDatetime: '2026-03-15T16:45:00+01:00',
            mainCarriageTransportMovement: [
              {
                id: 3,
                schemeAgencyId: 'AT-REG',
                modeCode: 3,
                dangerousGoodsIndicator: 'false',
                registrationCountryCode: 'AT'
              }
            ],
            usedTransportEquipment: [
              {
                id: 3,
                sequenceNumber: 1,
                schemeAgencyId: 'W-98765-X',
                registrationCountryCode: 'AT',
                categoryCode: 'TRUCK',
                carriedTransportEquipment: [
                  { id: 2, sequenceNumber: 1, schemeAgencyId: 'W-T-4321' }
                ]
              }
            ]
          }
        ]
      },
      {
        gateIndicator: 'SI',
        status: 'COMPLETE',
        errorCode: '',
        errorDescription: '',
        consignments: [
          {
            id: 4,
            gateId: 'slovenia',
            datasetId: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
            platformId: 'slovenia eFTI platform',
            carrierAcceptanceDatetime: '2026-03-13T09:15:00+01:00',
            deliveryEventActualOccurrenceDatetime: '2026-03-14T11:30:00+01:00',
            mainCarriageTransportMovement: [
              {
                id: 4,
                schemeAgencyId: 'SI-REG',
                modeCode: 3,
                dangerousGoodsIndicator: 'false',
                registrationCountryCode: 'SI'
              }
            ],
            usedTransportEquipment: [
              {
                id: 4,
                sequenceNumber: 1,
                schemeAgencyId: 'LJ-2233-MB',
                registrationCountryCode: 'SI',
                categoryCode: 'TRUCK',
                carriedTransportEquipment: []
              }
            ]
          }
        ]
      },
      {
        gateIndicator: 'DE',
        status: 'TIMEOUT',
        errorCode: 'TIMEOUT',
        errorDescription: 'Gate did not respond within the configured timeout period',
        consignments: []
      }
    ]
  };

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = req.url;

    if (req.method === 'POST' && url.includes('/api/control/identifiers')) {
      return this.handleIdentifiersPost(req);
    }

    if (req.method === 'GET' && url.includes('/api/control/identifiers')) {
      return this.handleIdentifiersGet(req);
    }

    if (req.method === 'POST' && url.includes('/api/control/uil/follow-up')) {
      return this.handleNotePost();
    }

    if (req.method === 'POST' && url.includes('/api/control/uil')) {
      return this.handleUilPost(req);
    }

    if (req.method === 'GET' && url.includes('/api/control/uil')) {
      return this.handleUilGet(req);
    }

    return next.handle(req);
  }

  private handleIdentifiersPost(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    const requestId = 'mock-id-' + (++this.requestCounter);
    this.pollCount[requestId] = 0;

    const body = {
      requestId,
      status: 'PENDING',
      errorCode: '',
      errorDescription: ''
    };

    return of(new HttpResponse({ status: 200, body })).pipe(delay(300));
  }

  private handleIdentifiersGet(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    const requestId = this.extractParam(req.url, 'requestId');
    if (!requestId) {
      return of(new HttpResponse({ status: 400, body: { error: 'Missing requestId' } }));
    }

    this.pollCount[requestId] = (this.pollCount[requestId] || 0) + 1;

    if (this.pollCount[requestId] < 3) {
      const body = {
        requestId,
        status: 'PENDING',
        errorCode: '',
        errorDescription: '',
        identifiers: [
          { gateIndicator: 'HR', status: 'PENDING', errorCode: '', errorDescription: '', consignments: [] },
          { gateIndicator: 'AT', status: 'PENDING', errorCode: '', errorDescription: '', consignments: [] },
          { gateIndicator: 'SI', status: 'PENDING', errorCode: '', errorDescription: '', consignments: [] },
          { gateIndicator: 'DE', status: 'PENDING', errorCode: '', errorDescription: '', consignments: [] }
        ]
      };
      return of(new HttpResponse({ status: 200, body })).pipe(delay(200));
    }

    const body = { ...this.MOCK_IDENTIFIERS_COMPLETE, requestId };
    return of(new HttpResponse({ status: 200, body })).pipe(delay(200));
  }

  private handleUilPost(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    const requestId = 'mock-uil-' + (++this.requestCounter);
    this.pollCount[requestId] = 0;

    const body = {
      requestId,
      status: 'PENDING',
      errorCode: '',
      errorDescription: ''
    };

    return of(new HttpResponse({ status: 202, body })).pipe(delay(300));
  }

  private handleUilGet(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    const requestId = this.extractParam(req.url, 'requestId');
    if (!requestId) {
      return of(new HttpResponse({ status: 400, body: { error: 'Missing requestId' } }));
    }

    this.pollCount[requestId] = (this.pollCount[requestId] || 0) + 1;

    if (this.pollCount[requestId] < 2) {
      const body = {
        requestId,
        status: 'PENDING',
        errorCode: '',
        errorDescription: '',
        data: null
      };
      return of(new HttpResponse({ status: 200, body })).pipe(delay(200));
    }

    if (!this.sampleXmlBase64) {
      this.sampleXmlBase64 = this.buildSampleXmlBase64();
    }

    const body = {
      requestId,
      status: 'COMPLETE',
      errorCode: '',
      errorDescription: '',
      data: this.sampleXmlBase64
    };

    return of(new HttpResponse({ status: 200, body })).pipe(delay(200));
  }

  private handleNotePost(): Observable<HttpEvent<any>> {
    const body = { status: 'ok', message: 'Follow-up note recorded' };
    return of(new HttpResponse({ status: 202, body })).pipe(delay(200));
  }

  private extractParam(url: string, param: string): string | null {
    try {
      const u = new URL(url, 'http://localhost');
      return u.searchParams.get(param);
    } catch {
      const match = url.match(new RegExp('[?&]' + param + '=([^&]+)'));
      return match ? decodeURIComponent(match[1]) : null;
    }
  }

  private buildSampleXmlBase64(): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<consignment xmlns="http://efti.eu/v1/consignment/common">
    <applicableServiceCharge>
        <appliedAmount currencyId="EUR">1250.00</appliedAmount>
        <calculationBasisCode>WEIGHT</calculationBasisCode>
        <payingPartyRoleCode>CONSIGNOR</payingPartyRoleCode>
        <paymentArrangementCode>PREPAID</paymentArrangementCode>
    </applicableServiceCharge>
    <associatedDocument>
        <formattedIssueDateTime formatId="205">20260315</formattedIssueDateTime>
        <id schemeAgencyId="HR-REG">eCMR-2026-00142</id>
        <issueLocation>
            <name>Zagreb Distribution Center</name>
            <postalAddress>
                <buildingNumber>22</buildingNumber>
                <streetName>Radnicka cesta</streetName>
                <postcode>10000</postcode>
                <cityName>Zagreb</cityName>
                <countryCode>HR</countryCode>
            </postalAddress>
        </issueLocation>
        <issuer>
            <authoritativeSignatoryPerson>
                <name>Ivan Horvat</name>
            </authoritativeSignatoryPerson>
        </issuer>
        <typeCode>eCMR</typeCode>
    </associatedDocument>
    <carrierAcceptanceDateTime>2026-03-15T08:00:00+01:00</carrierAcceptanceDateTime>
    <carrierAcceptanceLocation>
        <name>Zagreb Cargo Terminal</name>
        <postalAddress>
            <buildingNumber>1</buildingNumber>
            <streetName>Jankomir</streetName>
            <postcode>10090</postcode>
            <cityName>Zagreb</cityName>
            <countryCode>HR</countryCode>
        </postalAddress>
    </carrierAcceptanceLocation>
    <carrier>
        <name>Trans-Europa Logistics d.o.o.</name>
        <postalAddress>
            <buildingNumber>45</buildingNumber>
            <streetName>Slavonska avenija</streetName>
            <postcode>10000</postcode>
            <cityName>Zagreb</cityName>
            <countryCode>HR</countryCode>
        </postalAddress>
        <authoritativeSignatoryPerson>
            <name>Marko Petrovic</name>
        </authoritativeSignatoryPerson>
    </carrier>
    <connectingCarrier>
        <name>Alpine Freight GmbH</name>
        <postalAddress>
            <buildingNumber>12</buildingNumber>
            <streetName>Industriestrasse</streetName>
            <postcode>1100</postcode>
            <cityName>Wien</cityName>
            <countryCode>AT</countryCode>
        </postalAddress>
    </connectingCarrier>
    <consignee>
        <name>Bavarian Auto Parts GmbH</name>
        <postalAddress>
            <buildingNumber>88</buildingNumber>
            <streetName>Ingolstadter Strasse</streetName>
            <postcode>80939</postcode>
            <cityName>Munich</cityName>
            <countryCode>DE</countryCode>
        </postalAddress>
        <authoritativeSignatoryPerson>
            <name>Klaus Weber</name>
        </authoritativeSignatoryPerson>
    </consignee>
    <consigneeReceiptLocation>
        <name>Munich Warehouse B7</name>
        <postalAddress>
            <buildingNumber>88</buildingNumber>
            <streetName>Ingolstadter Strasse</streetName>
            <postcode>80939</postcode>
            <cityName>Munich</cityName>
            <countryCode>DE</countryCode>
        </postalAddress>
    </consigneeReceiptLocation>
    <consignor>
        <name>Adriatic Manufacturing d.o.o.</name>
        <postalAddress>
            <buildingNumber>7</buildingNumber>
            <streetName>Industrijska zona</streetName>
            <postcode>51000</postcode>
            <cityName>Rijeka</cityName>
            <countryCode>HR</countryCode>
        </postalAddress>
        <authoritativeSignatoryPerson>
            <name>Ana Kovacevic</name>
        </authoritativeSignatoryPerson>
    </consignor>
    <consignorProvidedBorderClearanceInstructions>
        <description>EU internal transport - no customs clearance required</description>
    </consignorProvidedBorderClearanceInstructions>
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
            <properShippingName>PAINT RELATED MATERIAL</properShippingName>
            <uNDGID>1263</uNDGID>
            <hazardClassificationID>3</hazardClassificationID>
            <hazardCategoryCode>II</hazardCategoryCode>
            <packagingDangerLevelCode>II</packagingDangerLevelCode>
            <tunnelRestrictionCode>D/E</tunnelRestrictionCode>
            <information>Flammable liquid, industrial paint components</information>
            <netWeight unitId="KGM">2400</netWeight>
            <dangerousGoodsLogisticsPackage>
                <itemQuantity>12</itemQuantity>
                <shippingMarks>
                    <markingText>ADR-HR-2026-A1</markingText>
                </shippingMarks>
            </dangerousGoodsLogisticsPackage>
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
            <id>ZG-1234-AB</id>
        </usedTransportMeans>
    </mainCarriageTransportMovement>
    <usedTransportEquipment>
        <categoryCode>TRAILER</categoryCode>
        <id>ZG-T-5678</id>
    </usedTransportEquipment>
</consignment>`;
    return btoa(unescape(encodeURIComponent(xml)));
  }
}
