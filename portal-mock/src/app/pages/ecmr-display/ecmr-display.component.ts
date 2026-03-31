import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ECMRParserService } from '../../core/services/ecmr-parser.service';
import { ECMRData } from '../../core/models/ecmr.model';
import { POCDisplayComponent } from './poc-display.component';

type DisplayVersion = 'pilot' | 'poc';

@Component({
  selector: 'app-ecmr-display',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, POCDisplayComponent],
  templateUrl: './ecmr-display.component.html',
  styleUrl: './ecmr-display.component.css'
})
export class ECMRDisplayComponent implements OnInit {
  ecmrData: ECMRData | null = null;
  xmlContent: string = '';
  error: string | null = null;
  loading: boolean = true;
  version: DisplayVersion = 'poc';

  constructor(
    private route: ActivatedRoute,
    private parserService: ECMRParserService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const xmlBase64 = params['data'];
      this.loading = true;
      
      if (!xmlBase64) {
        this.error = 'No data parameter provided';
        this.loading = false;
        return;
      }

      try {
        // Decode base64 XML with proper UTF-8 handling for Croatian characters
        // atob() returns a binary string, we need to convert it to UTF-8
        const binaryString = atob(xmlBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        // Use TextDecoder to properly decode UTF-8
        const decoder = new TextDecoder('utf-8');
        this.xmlContent = decoder.decode(bytes);
        
        // Debug: check XML content
        console.log('XML content length:', this.xmlContent.length);
        console.log('XML content preview:', this.xmlContent.substring(0, 200));
        // Check for Croatian characters
        const croatianTest = this.xmlContent.match(/[čćšđžČĆŠĐŽ]/);
        console.log('Croatian characters found:', croatianTest ? 'Yes' : 'No');
        
        if (!this.xmlContent || this.xmlContent.trim().length === 0) {
          this.error = 'Empty XML content';
          this.loading = false;
          return;
        }
        
        // Parse XML to ECMR data model
        this.ecmrData = this.parserService.parseXML(this.xmlContent);
        
        // Debug: log parsed data
        console.log('Parsed eCMR data:', this.ecmrData);
        console.log('Consignment items count:', this.ecmrData?.consignmentItems?.length || 0);
        if (this.ecmrData?.consignmentItems && this.ecmrData.consignmentItems.length > 0) {
          console.log('First item:', this.ecmrData.consignmentItems[0]);
        }
        
        if (!this.ecmrData) {
          this.error = 'Failed to parse XML data';
        }
      } catch (error: any) {
        console.error('Error parsing XML:', error);
        this.error = error?.message || 'Error parsing XML: ' + String(error);
      } finally {
        this.loading = false;
      }
    });
  }

  formatParty(party: any): string {
    return this.parserService.formatParty(party);
  }

  formatLocation(location: any): string {
    return this.parserService.formatLocation(location);
  }

  formatCurrency(amount: string | undefined, currency: string | undefined): string {
    return this.parserService.formatCurrency(amount, currency);
  }

  formatTariff(tariff: any): string {
    if (!tariff) return '';
    const parts: string[] = [];
    if (tariff.appliedAmount && tariff.currency) {
      parts.push(this.formatCurrency(tariff.appliedAmount, tariff.currency));
    }
    if (tariff.calculationBasisCode) {
      if (parts.length > 0) {
        parts.push(`(${tariff.calculationBasisCode})`);
      } else {
        parts.push(tariff.calculationBasisCode);
      }
    }
    return parts.join(' ');
  }

  switchToPOC(): void {
    this.version = 'poc';
  }

  switchToPilot(): void {
    this.version = 'pilot';
  }

  // ADR helper methods
  hasTemperatureRequirements(adrData: any): boolean {
    if (!adrData || !adrData.adrItems) return false;
    return adrData.adrItems.some((item: any) => item.controlTemperature || item.emergencyTemperature);
  }

  getFirstControlTemperature(adrData: any): string | null {
    if (!adrData || !adrData.adrItems) return null;
    const item = adrData.adrItems.find((item: any) => item.controlTemperature);
    return item ? item.controlTemperature : null;
  }

  getFirstEmergencyTemperature(adrData: any): string | null {
    if (!adrData || !adrData.adrItems) return null;
    const item = adrData.adrItems.find((item: any) => item.emergencyTemperature);
    return item ? item.emergencyTemperature : null;
  }
}

