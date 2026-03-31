import { Party, Location, PostalAddress, ServiceCharge } from './ecmrTypes';

export function formatAddress(address: PostalAddress | undefined): string {
  if (!address) return '';
  const parts: string[] = [];
  if (address.buildingNumber) parts.push(address.buildingNumber);
  if (address.streetName) parts.push(address.streetName);
  if (address.postcode) parts.push(address.postcode);
  if (address.cityName) parts.push(address.cityName);
  const line1 = parts.join(' ');
  const line2 = address.countrySubDivisionName || '';
  return line2 ? `${line1}\n${line2}` : line1;
}

// Alias for internal use in parser
export function formatAddressString(address: PostalAddress): string {
  return formatAddress(address);
}

export function formatParty(party: Party | undefined): string {
  if (!party) return '';
  const address = formatAddress(party.postalAddress);
  if (party.name) {
    return address ? `${address}\n${party.name}` : party.name;
  }
  return address;
}

export function formatLocation(location: Location | undefined): string {
  if (!location) return '';
  const address = formatAddress(location.postalAddress);
  if (location.name) {
    return address ? `${address}\n${location.name}` : location.name;
  }
  return address;
}

export function formatCurrency(amount: string | undefined, currency: string | undefined): string {
  if (!amount) return '';
  return currency ? `${amount} ${currency}` : amount;
}

export function formatTariff(tariff: ServiceCharge | undefined): string {
  if (!tariff) return '';
  const parts: string[] = [];
  if (tariff.appliedAmount && tariff.currency) {
    parts.push(formatCurrency(tariff.appliedAmount, tariff.currency));
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

