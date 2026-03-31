import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getHR01HardcodedData } from './hr01-data';

export interface HR01Field {
  id?: string;
  name: string;
  definition: string;
  level: number;
  group: string;
  category: 'critical' | 'advanced' | 'audit';
}

export interface HR01Card {
  id: string;
  name: string;
  definition: string;
  group: string;
  criticalFields: HR01Field[];
  advancedFields: HR01Field[];
  auditFields: HR01Field[];
}

export interface HR01Group {
  name: string;
  cards: HR01Card[];
}

@Injectable({
  providedIn: 'root'
})
export class HR01ParserService {
  private excelData: HR01Group[] | null = null;

  constructor(private http: HttpClient) {}

  async loadHR01Data(): Promise<HR01Group[]> {
    if (this.excelData) {
      return this.excelData;
    }

    // Use hardcoded data from HR01.txt
    try {
      this.excelData = getHR01HardcodedData();
      console.log('Loaded HR01 hardcoded data:', this.excelData.length, 'groups');
      return this.excelData;
    } catch (error) {
      console.error('Error loading HR01 hardcoded data:', error);
      return [];
    }

    // Fallback to Excel loading (commented out for now)
    /*
    try {
      // Load the Excel file
      const filePath = '/assets/HR01.xlsx';
      const arrayBuffer = await firstValueFrom(
        this.http.get(filePath, { responseType: 'arraybuffer' })
      );
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Parse the data
      this.excelData = this.parseExcelData(jsonData);
      return this.excelData;
    } catch (error) {
      console.error('Error loading HR01.xlsx:', error);
      return [];
    }
    */
  }

  private parseExcelData(data: any[]): HR01Group[] {
    if (!data || data.length === 0) return [];

    // Find header row by looking for common header keywords
    let headerRow = 0;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row.length > 7) {
        const firstCell = String(row[0] || '').toLowerCase();
        const levelCell = String(row[7] || '').toLowerCase();
        if (firstCell.includes('name') || levelCell.includes('level') || levelCell === '2') {
          headerRow = i;
          break;
        }
      }
    }

    // Column mapping (0-indexed)
    // Column H = index 7 (Level)
    // We need to find: Name, Definition, Level, Category columns
    const nameCol = 0; // Usually column A
    const definitionCol = this.findColumnIndex(data, headerRow, ['definition', 'opis', 'description']);
    const levelCol = 7; // Column H
    const categoryCol = this.findColumnIndex(data, headerRow, ['category', 'kategorija', 'type', 'tip']);

    const groups: Map<string, HR01Group> = new Map();
    const cards: Map<string, HR01Card> = new Map();
    let currentGroup = '';
    let currentCard: HR01Card | null = null;

    // Parse rows starting after header
    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const name = String(row[nameCol] || '').trim();
      const definition = String(row[definitionCol] || '').trim();
      const level = parseInt(String(row[levelCol] || '0'), 10) || 0;
      const categoryStr = categoryCol >= 0 ? String(row[categoryCol] || '').toLowerCase().trim() : '';

      if (!name || name === '') continue;

      // Level 2 indicates groups (main groups)
      if (level === 2) {
        currentGroup = name;
        if (!groups.has(currentGroup)) {
          groups.set(currentGroup, { name: currentGroup, cards: [] });
        }
        currentCard = null; // Reset card when new group starts
      } else if (level > 2 && currentGroup) {
        // Level > 2 indicates cards or fields within a group
        // Determine if this is a card (level 3) or field (level > 3)
        if (level === 3 || !currentCard) {
          // Create new card
          const cardId = this.slugify(name);
          if (!cards.has(cardId)) {
            currentCard = {
              id: cardId,
              name: name,
              definition: definition || `Podaci za ${name}`,
              group: currentGroup,
              criticalFields: [],
              advancedFields: [],
              auditFields: []
            };
            cards.set(cardId, currentCard);
            const group = groups.get(currentGroup);
            if (group) {
              group.cards.push(currentCard);
            }
          } else {
            currentCard = cards.get(cardId)!;
          }
        } else if (currentCard && level > 3) {
          // This is a field
          let category: 'critical' | 'advanced' | 'audit' = 'critical';
          
          // Determine category from Excel data or field name
          if (categoryStr.includes('audit') || name.toLowerCase().includes('audit')) {
            category = 'audit';
          } else if (categoryStr.includes('advanced') || categoryStr.includes('napredni') || 
                     name.toLowerCase().includes('advanced') || name.toLowerCase().includes('napredni')) {
            category = 'advanced';
          }

          const field: HR01Field = {
            name: name,
            definition: definition || '',
            level: level,
            group: currentGroup,
            category: category
          };

          if (category === 'critical') {
            currentCard.criticalFields.push(field);
          } else if (category === 'advanced') {
            currentCard.advancedFields.push(field);
          } else {
            currentCard.auditFields.push(field);
          }
        }
      }
    }

    return Array.from(groups.values());
  }

  private findColumnIndex(data: any[], headerRow: number, keywords: string[]): number {
    if (headerRow >= data.length) return -1;
    const header = data[headerRow];
    if (!header) return -1;

    for (let i = 0; i < header.length; i++) {
      const cell = String(header[i] || '').toLowerCase();
      if (keywords.some(keyword => cell.includes(keyword))) {
        return i;
      }
    }
    return 1; // Default to column B if not found
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  getGroups(): HR01Group[] {
    return this.excelData || [];
  }
}

