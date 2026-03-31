import {Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router, RouterOutlet} from "@angular/router";
import {DatePipe, NgIf, NgFor, NgClass} from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { BootstrapIconsModule } from "ng-bootstrap-icons";
import { IconsModule } from "../../icons/icons.module";
import { Identifiers } from "../../core/models/identifiers.model";
import { LocalStorageService } from "../../core/services/local-storage.service";

@Component({
  selector: 'app-identifiers-display',
  standalone: true,
  templateUrl: './identifiers-display.component.html',
  imports: [
    RouterOutlet, NgFor, NgIf, NgClass, TranslateModule, BootstrapIconsModule, IconsModule,
    DatePipe
  ],
  styleUrl: './identifiers-display.component.css'
})
export class IdentifiersDisplayComponent implements OnInit {

  identifiers!: Identifiers;

  constructor(private route: ActivatedRoute, private localStorageService: LocalStorageService,
              private router: Router) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.identifiers = this.localStorageService.getIdentifiers(params['id']);
    });
  }

  goToUil() {
    this.router.navigate(['/uil'],
      { queryParams: { id: this.identifiers.datasetId, gate: this.identifiers.gateId, platform: this.identifiers.platformId } }
    );
  }

  getTransportModeName(modeCode: number): string {
    const modeNames: { [key: number]: string } = {
      1: 'Waterway',
      2: 'Railway',
      3: 'Road',
      4: 'Air'
    };
    return modeNames[modeCode] || `Mode ${modeCode}`;
  }

  getDangerousGoodsIndicator(): string {
    if (this.identifiers.mainCarriageTransportMovement && this.identifiers.mainCarriageTransportMovement.length > 0) {
      const ind = String(this.identifiers.mainCarriageTransportMovement[0].dangerousGoodsIndicator);
      if (ind === 'true') return 'YES';
      if (ind === 'false') return 'NO';
    }
    return 'N/A';
  }

  getDangerousGoodsClass(indicator: string | boolean): string {
    const ind = String(indicator);
    if (ind === 'true') return 'yes';
    if (ind === 'false') return 'no';
    return 'na';
  }

  getDangerousGoodsLabel(indicator: string | boolean): string {
    const ind = String(indicator);
    if (ind === 'true') return 'ADR';
    if (ind === 'false') return 'No';
    return 'N/A';
  }

  getMainTransportMode(): number | null {
    if (this.identifiers.mainCarriageTransportMovement && this.identifiers.mainCarriageTransportMovement.length > 0) {
      return this.identifiers.mainCarriageTransportMovement[0].modeCode;
    }
    return null;
  }

  getMainTransportCountry(): string | null {
    if (this.identifiers.mainCarriageTransportMovement && this.identifiers.mainCarriageTransportMovement.length > 0) {
      return this.identifiers.mainCarriageTransportMovement[0].registrationCountryCode;
    }
    return null;
  }

  getUsedEquipmentCount(): number {
    return this.identifiers.usedTransportEquipment?.length || 0;
  }

  getCarriedEquipmentCount(): number {
    let count = 0;
    this.identifiers.usedTransportEquipment?.forEach(equipment => {
      count += equipment.carriedTransportEquipment?.length || 0;
    });
    return count;
  }
}
