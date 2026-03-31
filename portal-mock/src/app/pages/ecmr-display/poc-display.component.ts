import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ECMRData } from '../../core/models/ecmr.model';
import { ECMRParserService } from '../../core/services/ecmr-parser.service';

interface DataGroup {
  id: string;
  name: string;
  cards: DataCard[];
}

interface DataCard {
  id: string;
  name: string;
  definition: string;
  subsections?: DataSubsection[];
  criticalFields: Field[];
  advancedFields: Field[];
  auditFields: Field[];
}

interface DataSubsection {
  id: string;
  name: string;
  criticalFields: Field[];
  advancedFields: Field[];
  auditFields: Field[];
}

interface Field {
  name: string;
  value?: string;
  definition?: string;
}

@Component({
  selector: 'app-poc-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poc-display.component.html',
  styleUrl: './poc-display.component.css'
})
export class POCDisplayComponent implements OnInit, OnChanges {
  @Input() ecmrData!: ECMRData;
  @Input() xmlContent: string = '';
  @Input() onSwitchToPilot!: () => void;

  expandedAdvanced: Set<string> = new Set();
  expandedAudit: Set<string> = new Set();
  expandedSubsection: Set<string> = new Set();
  activeCardId: string | null = null;
  dataGroups: DataGroup[] = [];
  loading: boolean = false;

  constructor(private parserService: ECMRParserService) {}

  ngOnInit(): void {
    this.updateDataGroups();
  }

  private expandAllSubsections(): void {
    // Expand subsections after data is loaded
    setTimeout(() => {
      this.dataGroups.forEach(group => {
        group.cards.forEach(card => {
          if (card.subsections) {
            card.subsections.forEach(subsection => {
              this.expandedSubsection.add(subsection.id);
            });
          }
        });
      });
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ecmrData'] && this.ecmrData) {
      this.updateDataGroups();
    }
  }

  updateDataGroups(): void {
    if (!this.ecmrData) {
      this.dataGroups = [];
      return;
    }

    this.dataGroups = [{
      id: 'poc-data',
      name: 'Podaci o pošiljci',
      cards: this.createPOCCards()
    }];
    
    // Expand all subsections to show critical fields
    this.expandAllSubsections();
  }

  private createPOCCards(): DataCard[] {
    return [
      this.createSummaryCard(),
      this.createGoodsCard(),
      this.createRouteCard(),
      this.createPartiesCard(),
      this.createVehicleCard(),
      this.createDocumentsCard(),
      this.createAuthenticationCard(),
      this.createAuditCard()
    ];
  }

  // 1. Pregled pošiljke (Summary)
  private createSummaryCard(): DataCard {
    return {
      id: 'pregled-posiljke',
      name: 'Pregled pošiljke',
      definition: 'Osnovni pregled podataka o pošiljci',
      criticalFields: [
        { name: 'Opis robe', value: this.getGoodsDescription() },
        { name: 'Datum i vrijeme prihvaćanja', value: this.ecmrData.carrierAcceptanceDateTime },
        { name: 'Bruto masa', value: this.formatWeight() },
        { name: 'Bruto volumen', value: this.formatVolume() },
        { name: 'Način prijevoza', value: this.getTransportMode() }
      ],
      advancedFields: [
        { name: 'Dodatni datumi i vremenski zapisi', value: this.getAdditionalDates() },
        { name: 'Pomoćni identifikatori pošiljke', value: this.ecmrData.ecmrId },
        { name: 'Dodatne mjere', value: this.getAdditionalMeasures() }
      ],
      auditFields: [
        { name: 'Vrijeme kreiranja skupa podataka', value: undefined },
        { name: 'Vrijeme zadnje izmjene skupa podataka', value: undefined },
        { name: 'Izvor podataka', value: 'EO / Platforma' },
        { name: 'Status validacije', value: undefined }
      ]
    };
  }

  // 2. Roba i teret (Goods)
  private createGoodsCard(): DataCard {
    const firstItem = this.ecmrData.consignmentItems?.[0];
    return {
      id: 'roba-i-teret',
      name: 'Roba i teret',
      definition: 'Detaljni podaci o robi i teretu',
      criticalFields: [
        { name: 'Opis robe', value: this.getGoodsDescription() },
        { name: 'Kod vrste robe', value: firstItem?.natureOfGoods },
        { name: 'Indikator opasne robe', value: this.getHazardousIndicator() }
      ],
      advancedFields: [
        { name: 'Statistička klasifikacija robe', value: firstItem?.statisticNumber },
        { name: 'Vrsta pakiranja', value: firstItem?.packingDescription },
        { name: 'Broj paketa', value: firstItem?.numberOfPackages },
        { name: 'Oznake i brojevi', value: firstItem?.marksAndNumbers },
        { name: 'Posebni uvjeti prijevoza', value: this.ecmrData.specialInstructions }
      ],
      auditFields: [
        { name: 'Vrijeme zadnje izmjene opisa robe', value: undefined },
        { name: 'Izvor izmjene', value: 'EO / Sustav' }
      ]
    };
  }

  // 3. Ruta i događaji (Route and events)
  private createRouteCard(): DataCard {
    return {
      id: 'ruta-i-dogadaji',
      name: 'Ruta i događaji',
      definition: 'Lokacije i događaji na ruti prijevoza',
      subsections: [
        this.createPickupSubsection(),
        this.createLoadingSubsection(),
        this.createUnloadingSubsection(),
        this.createDeliverySubsection()
      ],
      criticalFields: [],
      advancedFields: [],
      auditFields: []
    };
  }

  private createPickupSubsection(): DataSubsection {
    const location = this.ecmrData.carrierAcceptanceLocation;
    return {
      id: 'pickup',
      name: 'Preuzimanje',
      criticalFields: [
        { name: 'Identifikator lokacije', value: location?.name },
        { name: 'Naziv lokacije', value: location?.name },
        { name: 'Grad', value: location?.postalAddress?.cityName },
        { name: 'Kod države', value: location?.postalAddress?.countryCode }
      ],
      advancedFields: [
        { name: 'Naziv ulice', value: location?.postalAddress?.streetName },
        { name: 'Kućni broj', value: location?.postalAddress?.buildingNumber },
        { name: 'Poštanski broj', value: location?.postalAddress?.postcode },
        { name: 'Regija', value: location?.postalAddress?.countrySubDivisionName },
        { name: 'Geografska širina', value: undefined },
        { name: 'Geografska dužina', value: undefined },
        { name: 'Ime kontakta', value: undefined },
        { name: 'Broj telefona kontakta', value: undefined },
        { name: 'Email adresa kontakta', value: undefined }
      ],
      auditFields: [
        { name: 'Izvor lokacijskih podataka', value: undefined },
        { name: 'Vrijeme zadnje promjene', value: undefined },
        { name: 'Prethodna vrijednost', value: undefined }
      ]
    };
  }

  private createLoadingSubsection(): DataSubsection {
    // Using carrier acceptance location as loading location
    const location = this.ecmrData.carrierAcceptanceLocation;
    return {
      id: 'loading',
      name: 'Utovar',
      criticalFields: [
        { name: 'Identifikator lokacije', value: location?.name },
        { name: 'Naziv lokacije', value: location?.name },
        { name: 'Grad', value: location?.postalAddress?.cityName },
        { name: 'Kod države', value: location?.postalAddress?.countryCode }
      ],
      advancedFields: [
        { name: 'Naziv ulice', value: location?.postalAddress?.streetName },
        { name: 'Kućni broj', value: location?.postalAddress?.buildingNumber },
        { name: 'Poštanski broj', value: location?.postalAddress?.postcode },
        { name: 'Regija', value: location?.postalAddress?.countrySubDivisionName }
      ],
      auditFields: [
        { name: 'Izvor lokacijskih podataka', value: undefined },
        { name: 'Vrijeme zadnje promjene', value: undefined }
      ]
    };
  }

  private createUnloadingSubsection(): DataSubsection {
    // Placeholder - would need additional data
    return {
      id: 'unloading',
      name: 'Istovar',
      criticalFields: [
        { name: 'Identifikator lokacije', value: undefined },
        { name: 'Naziv lokacije', value: undefined },
        { name: 'Grad', value: undefined },
        { name: 'Kod države', value: undefined }
      ],
      advancedFields: [],
      auditFields: []
    };
  }

  private createDeliverySubsection(): DataSubsection {
    const location = this.ecmrData.deliveryAddress;
    return {
      id: 'delivery',
      name: 'Isporuka',
      criticalFields: [
        { name: 'Identifikator lokacije', value: location?.name },
        { name: 'Naziv lokacije', value: location?.name },
        { name: 'Grad', value: location?.postalAddress?.cityName },
        { name: 'Kod države', value: location?.postalAddress?.countryCode }
      ],
      advancedFields: [
        { name: 'Naziv ulice', value: location?.postalAddress?.streetName },
        { name: 'Kućni broj', value: location?.postalAddress?.buildingNumber },
        { name: 'Poštanski broj', value: location?.postalAddress?.postcode },
        { name: 'Regija', value: location?.postalAddress?.countrySubDivisionName }
      ],
      auditFields: [
        { name: 'Izvor lokacijskih podataka', value: undefined },
        { name: 'Vrijeme zadnje promjene', value: undefined }
      ]
    };
  }

  // 4. Stranke i kontakti (Parties and contacts)
  private createPartiesCard(): DataCard {
    return {
      id: 'stranke-i-kontakti',
      name: 'Stranke i kontakti',
      definition: 'Podaci o svim strankama uključenim u prijevoz',
      subsections: [
        this.createConsignorSubsection(),
        this.createConsigneeSubsection(),
        this.createCarrierSubsection(),
        this.createOtherPartiesSubsection()
      ],
      criticalFields: [],
      advancedFields: [],
      auditFields: []
    };
  }

  private createConsignorSubsection(): DataSubsection {
    const party = this.ecmrData.consignor;
    return {
      id: 'consignor',
      name: 'Pošiljatelj',
      criticalFields: [
        { name: 'Naziv stranke', value: party?.name },
        { name: 'Identifikator stranke', value: undefined },
        { name: 'Ime kontakta', value: undefined },
        { name: 'Broj telefona kontakta', value: undefined },
        { name: 'Email adresa kontakta', value: undefined }
      ],
      advancedFields: [
        { name: 'Kod uloge', value: undefined },
        { name: 'Dodatni kontakti', value: undefined },
        { name: 'Alternativni komunikacijski kanali', value: undefined }
      ],
      auditFields: [
        { name: 'Povijest izmjena kontakt podataka', value: undefined },
        { name: 'Izvor izmjene', value: undefined }
      ]
    };
  }

  private createConsigneeSubsection(): DataSubsection {
    const party = this.ecmrData.consignee;
    return {
      id: 'consignee',
      name: 'Primatelj',
      criticalFields: [
        { name: 'Naziv stranke', value: party?.name },
        { name: 'Identifikator stranke', value: undefined },
        { name: 'Ime kontakta', value: undefined },
        { name: 'Broj telefona kontakta', value: undefined },
        { name: 'Email adresa kontakta', value: undefined }
      ],
      advancedFields: [
        { name: 'Kod uloge', value: undefined },
        { name: 'Dodatni kontakti', value: undefined }
      ],
      auditFields: [
        { name: 'Povijest izmjena kontakt podataka', value: undefined },
        { name: 'Izvor izmjene', value: undefined }
      ]
    };
  }

  private createCarrierSubsection(): DataSubsection {
    const party = this.ecmrData.carrier;
    return {
      id: 'carrier',
      name: 'Prijevoznik',
      criticalFields: [
        { name: 'Naziv stranke', value: party?.name },
        { name: 'Identifikator stranke', value: undefined },
        { name: 'Ime kontakta', value: undefined },
        { name: 'Broj telefona kontakta', value: undefined },
        { name: 'Email adresa kontakta', value: undefined }
      ],
      advancedFields: [
        { name: 'Kod uloge', value: undefined },
        { name: 'Dodatni kontakti', value: undefined }
      ],
      auditFields: [
        { name: 'Povijest izmjena kontakt podataka', value: undefined },
        { name: 'Izvor izmjene', value: undefined }
      ]
    };
  }

  private createOtherPartiesSubsection(): DataSubsection {
    const party = this.ecmrData.followingCarrier;
    return {
      id: 'other-parties',
      name: 'Ostale stranke',
      criticalFields: [
        { name: 'Naziv stranke', value: party?.name },
        { name: 'Identifikator stranke', value: undefined }
      ],
      advancedFields: [],
      auditFields: []
    };
  }

  // 5. Vozilo i oprema (Vehicle and equipment)
  private createVehicleCard(): DataCard {
    return {
      id: 'vozilo-i-oprema',
      name: 'Vozilo i oprema',
      definition: 'Podaci o vozilu i transportnoj opremi',
      criticalFields: [
        { name: 'Identifikator transportnog sredstva', value: this.ecmrData.vehicleNumber },
        { name: 'Država registracije', value: undefined },
        { name: 'Identifikator transportne opreme', value: this.ecmrData.trailerNumber }
      ],
      advancedFields: [
        { name: 'Vrsta transportne opreme', value: this.ecmrData.vehicleModel },
        { name: 'Tehničke oznake / dodatni opisi', value: undefined }
      ],
      auditFields: [
        { name: 'Povijest promjene registracije', value: undefined },
        { name: 'Vrijeme zadnje izmjene', value: undefined }
      ]
    };
  }

  // 6. Dokumenti i reference (Documents and references)
  private createDocumentsCard(): DataCard {
    return {
      id: 'dokumenti-i-reference',
      name: 'Dokumenti i reference',
      definition: 'Transportni dokumenti i reference',
      criticalFields: [
        { name: 'Vrsta transportnog dokumenta', value: 'eCMR' },
        { name: 'Identifikator transportnog dokumenta', value: this.ecmrData.ecmrId },
        { name: 'URI transportnog dokumenta', value: undefined }
      ],
      advancedFields: [
        { name: 'Identifikacijska shema', value: undefined },
        { name: 'Izdavajuća agencija', value: undefined },
        { name: 'Dodatne reference', value: this.ecmrData.annexedDocuments?.join(', ') }
      ],
      auditFields: [
        { name: 'Status dostupnosti dokumenta', value: undefined },
        { name: 'Evidencija pristupa dokumentu', value: undefined }
      ]
    };
  }

  // 7. Potvrde i autentifikacija (Confirmations and authentication)
  private createAuthenticationCard(): DataCard {
    return {
      id: 'potvrde-i-autentifikacija',
      name: 'Potvrde i autentifikacija',
      definition: 'Potvrde i autentifikacija dokumenta',
      criticalFields: [
        { name: 'Identifikator potvrđujuće stranke', value: undefined },
        { name: 'Naziv potvrđujuće stranke', value: undefined },
        { name: 'Kod izjave', value: undefined }
      ],
      advancedFields: [
        { name: 'Metoda autentifikacije', value: undefined },
        { name: 'Identifikacijska shema', value: undefined },
        { name: 'Izdavajuća agencija', value: undefined }
      ],
      auditFields: [
        { name: 'Vrijeme validacije', value: undefined },
        { name: 'Rezultat validacije', value: undefined },
        { name: 'Status integriteta potpisa', value: undefined }
      ]
    };
  }

  // 8. Audit i tehnička meta (Audit and technical metadata)
  private createAuditCard(): DataCard {
    return {
      id: 'audit-i-tehnicka-meta',
      name: 'Audit i tehnička meta',
      definition: 'Audit podaci i tehnička metapodaci',
      criticalFields: [
        { name: 'Verzija skupa podataka', value: undefined },
        { name: 'Vrijeme kreiranja skupa podataka', value: undefined },
        { name: 'Vrijeme zadnje izmjene skupa podataka', value: undefined },
        { name: 'Izvor podataka', value: 'EO / Platforma' },
        { name: 'Status validacije', value: undefined }
      ],
      advancedFields: [
        { name: 'Korelacijski / Zahtjev ID', value: undefined },
        { name: 'Tehnički statusi razmjene', value: undefined }
      ],
      auditFields: [
        { name: 'Evidencija pristupa', value: undefined },
        { name: 'Evidencija izvoza / preuzimanja', value: undefined },
        { name: 'Hash / dokaz neizmjenjivosti', value: undefined }
      ]
    };
  }

  // Helper methods
  private getGoodsDescription(): string | undefined {
    const items = this.ecmrData.consignmentItems;
    if (!items || items.length === 0) return undefined;
    return items.map(item => item.natureOfGoods || item.packingDescription).filter(Boolean).join(', ') || undefined;
  }

  private formatWeight(): string | undefined {
    if (!this.ecmrData.totalGrossWeight) return undefined;
    return `${this.ecmrData.totalGrossWeight}${this.ecmrData.totalGrossWeightUnit ? ' ' + this.ecmrData.totalGrossWeightUnit : ''}`;
  }

  private formatVolume(): string | undefined {
    if (!this.ecmrData.totalVolume) return undefined;
    return `${this.ecmrData.totalVolume}${this.ecmrData.totalVolumeUnit ? ' ' + this.ecmrData.totalVolumeUnit : ''}`;
  }

  private getTransportMode(): string | undefined {
    // Would need to extract from XML or additional fields
    return 'Cestovni';
  }

  private getAdditionalDates(): string | undefined {
    const dates: string[] = [];
    if (this.ecmrData.issueDate) dates.push(`Datum izdavanja: ${this.ecmrData.issueDate}`);
    return dates.length > 0 ? dates.join(', ') : undefined;
  }

  private getAdditionalMeasures(): string | undefined {
    const measures: string[] = [];
    if (this.ecmrData.consignmentItems) {
      const totalPackages = this.ecmrData.consignmentItems.reduce((sum, item) => 
        sum + (parseInt(item.numberOfPackages || '0', 10) || 0), 0);
      if (totalPackages > 0) measures.push(`Ukupno paketa: ${totalPackages}`);
    }
    return measures.length > 0 ? measures.join(', ') : undefined;
  }

  private getHazardousIndicator(): string | undefined {
    // Would need to check from goods data
    return undefined;
  }

  toggleAdvanced(cardId: string): void {
    if (this.expandedAdvanced.has(cardId)) {
      this.expandedAdvanced.delete(cardId);
    } else {
      this.expandedAdvanced.add(cardId);
    }
  }

  toggleAudit(cardId: string): void {
    if (this.expandedAudit.has(cardId)) {
      this.expandedAudit.delete(cardId);
    } else {
      this.expandedAudit.add(cardId);
    }
  }

  toggleSubsection(subsectionId: string): void {
    if (this.expandedSubsection.has(subsectionId)) {
      this.expandedSubsection.delete(subsectionId);
    } else {
      this.expandedSubsection.add(subsectionId);
    }
  }

  scrollToCard(cardId: string): void {
    this.activeCardId = cardId;
    const element = document.getElementById(`card-${cardId}`);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}
