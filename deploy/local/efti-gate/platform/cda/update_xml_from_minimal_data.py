#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple script to update ONLY the exact fields from minimal data JSON in a working XML.
Only updates text values - doesn't create/remove elements.
"""

import json
import os
import sys
import uuid
from xml.etree.ElementTree import parse, tostring, Element
from xml.dom import minidom
from datetime import datetime

def update_xml_from_minimal_data(normal_xml_file, data_file, output_uuid=None):
    """Update only the exact fields from JSON - simple text replacements"""
    
    if not os.path.exists(normal_xml_file):
        print(f"Error: Normal XML file not found: {normal_xml_file}")
        sys.exit(1)
    
    if not os.path.exists(data_file):
        print(f"Error: Data file not found: {data_file}")
        sys.exit(1)
    
    if output_uuid is None:
        output_uuid = str(uuid.uuid4())
    
    print(f"Reading data file: {data_file}...")
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loading working XML: {normal_xml_file}...")
    tree = parse(normal_xml_file)
    root = tree.getroot()
    
    ns = '{http://efti.eu/v1/consignment/common}'
    
    def update_text(parent, tag, value):
        """Update text of first matching element"""
        # Use findall to get all matches, but only update the first one
        elems = parent.findall(f'.//{ns}{tag}')
        if elems:
            elems[0].text = str(value)
            return True
        return False
    
    def format_datetime(dt_str):
        """Format to YYYYMMDDHHMM+HHMM (format 205)"""
        try:
            dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            # Get timezone offset
            if dt.tzinfo:
                offset = dt.utcoffset()
                hours = int(offset.total_seconds() // 3600)
                minutes = int((offset.total_seconds() % 3600) // 60)
                sign = '+' if hours >= 0 else '-'
                return dt.strftime(f'%Y%m%d%H%M{sign}{abs(hours):02d}{minutes:02d}')
            else:
                return dt.strftime('%Y%m%d%H%M+0000')
        except:
            return dt_str
    
    print("Updating only the fields from JSON...")
    
    # 1. ECMR Identifier
    if 'ecmr_identifier' in data:
        assoc_doc = root.find(f'{ns}associatedDocument')
        if assoc_doc is not None:
            id_elem = assoc_doc.find(f'{ns}id')
            if id_elem is not None:
                id_elem.text = data['ecmr_identifier']
    
    # 2. Issue date
    if 'issue_date' in data:
        assoc_doc = root.find(f'{ns}associatedDocument')
        if assoc_doc is not None:
            formatted_elem = assoc_doc.find(f'{ns}formattedIssueDateTime')
            if formatted_elem is not None:
                formatted_elem.text = format_datetime(data['issue_date'])
    
    # 3. Issue location
    if 'issue_location' in data:
        assoc_doc = root.find(f'{ns}associatedDocument')
        if assoc_doc is not None:
            issue_loc = assoc_doc.find(f'{ns}issueLocation')
            if issue_loc is not None:
                if 'city' in data['issue_location']:
                    update_text(issue_loc, 'cityName', data['issue_location']['city'])
                if 'country' in data['issue_location']:
                    postal = issue_loc.find(f'{ns}postalAddress')
                    if postal is not None:
                        update_text(postal, 'countryCode', data['issue_location']['country'])
    
    # 4. Consignor
    if 'consignor' in data:
        consignor = root.find(f'{ns}consignor')
        if consignor is not None:
            if 'name' in data['consignor']:
                # Update ALL name elements recursively to ensure display shows correct value everywhere
                # XSLT reads $party/efti:name (first direct child), but update all to be safe
                all_names = consignor.findall(f'.//{ns}name')  # All nested name elements
                if all_names:
                    for name_elem in all_names:
                        name_elem.text = data['consignor']['name']
                # Ensure at least one direct child name exists
                direct_names = consignor.findall(f'{ns}name')
                if not direct_names:
                    name_elem = Element(f'{ns}name')
                    name_elem.text = data['consignor']['name']
                    consignor.insert(0, name_elem)
            if 'address' in data['consignor']:
                postal = consignor.find(f'{ns}postalAddress')
                if postal is not None:
                    addr = data['consignor']['address']
                    if 'street' in addr:
                        update_text(postal, 'streetName', addr['street'])
                    if 'building_number' in addr:
                        update_text(postal, 'buildingNumber', addr['building_number'])
                    if 'postcode' in addr:
                        update_text(postal, 'postcode', addr['postcode'])
                    if 'city' in addr:
                        update_text(postal, 'cityName', addr['city'])
                    if 'country' in addr:
                        update_text(postal, 'countryCode', addr['country'])
            if 'tax_id' in data['consignor']:
                # Tax ID is in taxRegistration/id, update first one or create if needed
                tax_regs = consignor.findall(f'{ns}taxRegistration')
                if tax_regs:
                    tax_id = tax_regs[0].find(f'{ns}id')
                    if tax_id is not None:
                        tax_id.text = data['consignor']['tax_id']
                else:
                    # Create taxRegistration if it doesn't exist
                    tax_reg = Element(f'{ns}taxRegistration')
                    tax_id_elem = Element(f'{ns}id')
                    tax_id_elem.text = data['consignor']['tax_id']
                    tax_reg.append(tax_id_elem)
                    consignor.append(tax_reg)
    
    # 5. Consignee
    if 'consignee' in data:
        consignee = root.find(f'{ns}consignee')
        if consignee is not None:
            if 'name' in data['consignee']:
                # Update ALL name elements recursively to ensure display shows correct value everywhere
                # XSLT reads $party/efti:name (first direct child), but update all to be safe
                all_names = consignee.findall(f'.//{ns}name')  # All nested name elements
                if all_names:
                    for name_elem in all_names:
                        name_elem.text = data['consignee']['name']
                # Ensure at least one direct child name exists
                direct_names = consignee.findall(f'{ns}name')
                if not direct_names:
                    name_elem = Element(f'{ns}name')
                    name_elem.text = data['consignee']['name']
                    consignee.insert(0, name_elem)
            if 'address' in data['consignee']:
                postal = consignee.find(f'{ns}postalAddress')
                if postal is not None:
                    addr = data['consignee']['address']
                    if 'street' in addr:
                        update_text(postal, 'streetName', addr['street'])
                    if 'building_number' in addr:
                        update_text(postal, 'buildingNumber', addr['building_number'])
                    if 'postcode' in addr:
                        update_text(postal, 'postcode', addr['postcode'])
                    if 'city' in addr:
                        update_text(postal, 'cityName', addr['city'])
                    if 'country' in addr:
                        update_text(postal, 'countryCode', addr['country'])
            if 'tax_id' in data['consignee']:
                # Tax ID is in taxRegistration/id, update first one or create if needed
                tax_regs = consignee.findall(f'{ns}taxRegistration')
                if tax_regs:
                    tax_id = tax_regs[0].find(f'{ns}id')
                    if tax_id is not None:
                        tax_id.text = data['consignee']['tax_id']
                else:
                    # Create taxRegistration if it doesn't exist
                    tax_reg = Element(f'{ns}taxRegistration')
                    tax_id_elem = Element(f'{ns}id')
                    tax_id_elem.text = data['consignee']['tax_id']
                    tax_reg.append(tax_id_elem)
                    consignee.append(tax_reg)
    
    # 6. Delivery location (Field 3: consigneeReceiptLocation)
    if 'delivery_location' in data:
        delivery = root.find(f'{ns}consigneeReceiptLocation')
        if delivery is not None:
            if 'name' in data['delivery_location']:
                update_text(delivery, 'name', data['delivery_location']['name'])
            if 'address' in data['delivery_location']:
                postal = delivery.find(f'{ns}postalAddress')
                if postal is not None:
                    addr = data['delivery_location']['address']
                    if 'street' in addr:
                        update_text(postal, 'streetName', addr['street'])
                    if 'building_number' in addr:
                        update_text(postal, 'buildingNumber', addr['building_number'])
                    if 'postcode' in addr:
                        update_text(postal, 'postcode', addr['postcode'])
                    if 'city' in addr:
                        update_text(postal, 'cityName', addr['city'])
                    if 'country' in addr:
                        update_text(postal, 'countryCode', addr['country'])
    
    # 7. Pickup datetime and location (Field 4: carrierAcceptanceDateTime and carrierAcceptanceLocation)
    if 'pickup' in data:
        if 'datetime' in data['pickup']:
            update_text(root, 'carrierAcceptanceDateTime', format_datetime(data['pickup']['datetime']))
        if 'location' in data['pickup']:
            location = root.find(f'{ns}carrierAcceptanceLocation')
            if location is not None:
                addr = data['pickup']['location']
                if 'city' in addr:
                    update_text(location, 'cityName', addr['city'])
                if 'street' in addr:
                    postal = location.find(f'{ns}postalAddress')
                    if postal is not None:
                        update_text(postal, 'streetName', addr['street'])
                if 'building_number' in addr:
                    postal = location.find(f'{ns}postalAddress')
                    if postal is not None:
                        update_text(postal, 'buildingNumber', addr['building_number'])
                if 'postcode' in addr:
                    postal = location.find(f'{ns}postalAddress')
                    if postal is not None:
                        update_text(postal, 'postcode', addr['postcode'])
                if 'country' in addr:
                    postal = location.find(f'{ns}postalAddress')
                    if postal is not None:
                        update_text(postal, 'countryCode', addr['country'])
    
    # 8. Carrier
    if 'carrier' in data:
        carrier = root.find(f'{ns}carrier')
        if carrier is not None:
            if 'name' in data['carrier']:
                # Update ALL name elements recursively to ensure display shows correct value everywhere
                # XSLT reads $party/efti:name (first direct child), but update all to be safe
                all_names = carrier.findall(f'.//{ns}name')  # All nested name elements
                if all_names:
                    for name_elem in all_names:
                        name_elem.text = data['carrier']['name']
                # Ensure at least one direct child name exists
                direct_names = carrier.findall(f'{ns}name')
                if not direct_names:
                    name_elem = Element(f'{ns}name')
                    name_elem.text = data['carrier']['name']
                    carrier.insert(0, name_elem)
            if 'address' in data['carrier']:
                postal = carrier.find(f'{ns}postalAddress')
                if postal is not None:
                    addr = data['carrier']['address']
                    if 'street' in addr:
                        update_text(postal, 'streetName', addr['street'])
                    if 'building_number' in addr:
                        update_text(postal, 'buildingNumber', addr['building_number'])
                    if 'postcode' in addr:
                        update_text(postal, 'postcode', addr['postcode'])
                    if 'city' in addr:
                        update_text(postal, 'cityName', addr['city'])
                    if 'country' in addr:
                        update_text(postal, 'countryCode', addr['country'])
            if 'tax_id' in data['carrier']:
                # Tax ID is in taxRegistration/id, update first one or create if needed
                tax_regs = carrier.findall(f'{ns}taxRegistration')
                if tax_regs:
                    tax_id = tax_regs[0].find(f'{ns}id')
                    if tax_id is not None:
                        tax_id.text = data['carrier']['tax_id']
                else:
                    # Create taxRegistration if it doesn't exist
                    tax_reg = Element(f'{ns}taxRegistration')
                    tax_id_elem = Element(f'{ns}id')
                    tax_id_elem.text = data['carrier']['tax_id']
                    tax_reg.append(tax_id_elem)
                    carrier.append(tax_reg)
    
    # 9. Carrier reservations (Field 18: not found in XSLT, might not exist)
    # Skipping as it's not mapped in the display
    
    # 10. Goods - fields are in includedConsignmentItem (Fields 6-12)
    if 'goods' in data:
        # Find first includedConsignmentItem
        item = root.find(f'{ns}includedConsignmentItem')
        if item is not None:
            # Field 6: Marks and numbers (in transportDangerousGoods/dangerousGoodsLogisticsPackage/shippingMarks)
            if 'marks' in data['goods']:
                # Marks go inside transportDangerousGoods, so create/update that first
                dangerous = item.find(f'{ns}transportDangerousGoods')
                if dangerous is None:
                    dangerous = Element(f'{ns}transportDangerousGoods')
                    item.append(dangerous)
                # Find or create dangerousGoodsLogisticsPackage
                package = dangerous.find(f'{ns}dangerousGoodsLogisticsPackage')
                if package is None:
                    package = Element(f'{ns}dangerousGoodsLogisticsPackage')
                    dangerous.append(package)
                # Find or create shippingMarks
                marks = package.find(f'{ns}shippingMarks')
                if marks is None:
                    marks = Element(f'{ns}shippingMarks')
                    package.insert(0, marks)
                marking_text = marks.find(f'{ns}markingText')
                if marking_text is None:
                    marking_text = Element(f'{ns}markingText')
                    marks.append(marking_text)
                marking_text.text = data['goods']['marks']
            
            # Field 7: Package quantity
            if 'package_count' in data['goods']:
                qty = item.find(f'{ns}goodsUnitQuantity')
                if qty is not None:
                    qty.text = str(data['goods']['package_count'])
            
            # Field 8: Packaging description
            if 'packaging_description' in data['goods']:
                dimensions = item.find(f'{ns}dimensions')
                if dimensions is not None:
                    desc = dimensions.find(f'{ns}description')
                    if desc is not None:
                        desc.text = data['goods']['packaging_description']
            
            # Field 9: Nature of goods (properShippingName)
            # Field 10: HS code (hazardClassificationID) - must come BEFORE properShippingName!
            if 'nature' in data['goods'] or 'hs_code' in data['goods']:
                dangerous = item.find(f'{ns}transportDangerousGoods')
                if dangerous is None:
                    dangerous = Element(f'{ns}transportDangerousGoods')
                    item.append(dangerous)
                
                # Field 10: HS code - insert before properShippingName
                # Note: hazardClassificationID has maxLength 7, so skip if value is too long
                if 'hs_code' in data['goods']:
                    hs_code = str(data['goods']['hs_code'])
                    if len(hs_code) <= 7:  # Schema constraint: maxLength 7
                        hazard_id = dangerous.find(f'{ns}hazardClassificationID')
                        if hazard_id is None:
                            hazard_id = Element(f'{ns}hazardClassificationID')
                            # Insert before properShippingName if it exists
                            shipping_name = dangerous.find(f'{ns}properShippingName')
                            if shipping_name is not None:
                                idx = list(dangerous).index(shipping_name)
                                dangerous.insert(idx, hazard_id)
                            else:
                                dangerous.append(hazard_id)
                        hazard_id.text = hs_code
                    else:
                        print(f"  Warning: HS code '{hs_code}' is too long (max 7 chars), skipping hazardClassificationID update")
                
                # Field 9: Nature of goods - insert after hazardClassificationID
                if 'nature' in data['goods']:
                    shipping_name = dangerous.find(f'{ns}properShippingName')
                    if shipping_name is None:
                        shipping_name = Element(f'{ns}properShippingName')
                        # Insert after hazardClassificationID if it exists
                        hazard_id = dangerous.find(f'{ns}hazardClassificationID')
                        if hazard_id is not None:
                            idx = list(dangerous).index(hazard_id) + 1
                            dangerous.insert(idx, shipping_name)
                        else:
                            dangerous.append(shipping_name)
                    shipping_name.text = data['goods']['nature']
            
            # Field 11: Gross weight - only at root level, NOT in includedConsignmentItem
            # (The XSLT shows grossWeight in the table, but it's from transportDangerousGoods/grossWeight if it exists)
            # For now, just update root level
            if 'gross_weight' in data['goods']:
                root_weight = root.find(f'{ns}grossWeight')
                if root_weight is not None:
                    root_weight.text = str(data['goods']['gross_weight']['value'])
                    root_weight.set('unitId', data['goods']['gross_weight']['unit'])
            
            # Field 12: Volume (in item AND root level for totals)
            if 'volume' in data['goods']:
                volume = item.find(f'{ns}grossVolume')
                if volume is not None:
                    volume.text = str(data['goods']['volume']['value'])
                    volume.set('unitId', data['goods']['volume']['unit'])
                # Also update root level for totals
                root_volume = root.find(f'{ns}grossVolume')
                if root_volume is not None:
                    root_volume.text = str(data['goods']['volume']['value'])
                    root_volume.set('unitId', data['goods']['volume']['unit'])
    
    # 11. Sender instructions (Field 13: consignorProvidedBorderClearanceInstructions/description or consignorProvidedInformationText)
    if 'sender_instructions' in data:
        instructions = root.find(f'{ns}consignorProvidedBorderClearanceInstructions')
        if instructions is not None:
            desc = instructions.find(f'{ns}description')
            if desc is not None:
                desc.text = data['sender_instructions']
        else:
            # Try consignorProvidedInformationText
            info_text = root.find(f'{ns}consignorProvidedInformationText')
            if info_text is not None:
                info_text.text = data['sender_instructions']
    
    # 12. COD amount (Field 14: cODAmount with capital O)
    if 'cod_amount' in data:
        cod = root.find(f'{ns}cODAmount')
        if cod is not None:
            cod.text = str(data['cod_amount']['value'])
            cod.set('currencyId', data['cod_amount']['currency'])
    
    # 13. Freight payment
    if 'freight_payment' in data:
        update_text(root, 'freightPaymentArrangementCode', data['freight_payment'])
    
    # 14. Payment party (in applicableServiceCharge)
    if 'payment_party' in data:
        service_charge = root.find(f'{ns}applicableServiceCharge')
        if service_charge is not None:
            update_text(service_charge, 'payingPartyRoleCode', data['payment_party'])
    
    # 15. Special agreements (Field 20: contractTermsText)
    if 'special_agreements' in data:
        contract_terms = root.find(f'{ns}contractTermsText')
        if contract_terms is not None:
            contract_terms.text = data['special_agreements']
    
    # 16. Vehicle (Fields 25-26: vehicle ID, trailer ID, and model)
    if 'vehicle' in data:
        transport = root.find(f'{ns}mainCarriageTransportMovement')
        if transport is not None:
            transport_means = transport.find(f'{ns}usedTransportMeans')
            if transport_means is not None:
                if 'id' in data['vehicle']:
                    # Vehicle ID is in <id> element
                    id_elem = transport_means.find(f'{ns}id')
                    if id_elem is not None:
                        id_elem.text = data['vehicle']['id']
        # Trailer equipment is at root level, not in transport movement
        if 'trailer_id' in data['vehicle']:
            equipment = root.find(f'{ns}usedTransportEquipment')
            if equipment is not None:
                # Trailer ID is in <id> element
                id_elem = equipment.find(f'{ns}id')
                if id_elem is not None:
                    id_elem.text = data['vehicle']['trailer_id']
                # Note: Vehicle model cannot be stored in categoryCode as it's an enumeration
                # The XSLT uses categoryCode for display, but it only accepts specific codes
                # (AE, AM, BPO, BPP, BPQ, BPR, BPX, BR, BX, CN, DPL, RF, RR, SM, SW, TE, TN, T1-T14, DV, GT, CT, NT)
                # So we skip updating model text
                if 'model' in data['vehicle']:
                    print(f"  Warning: Vehicle model '{data['vehicle']['model']}' cannot be stored in categoryCode (enumeration field), skipping")
    
    # 17. Tariff (Field 15/20: applicableServiceCharge)
    if 'tariff' in data:
        service_charge = root.find(f'{ns}applicableServiceCharge')
        if service_charge is not None:
            if 'basis' in data['tariff']:
                # Convert per_km to PER_KM
                basis_code = data['tariff']['basis'].upper().replace('_', '_')
                update_text(service_charge, 'calculationBasisCode', basis_code)
            if 'amount' in data['tariff']:
                # Find appliedAmount with matching currency
                amounts = service_charge.findall(f'{ns}appliedAmount')
                for amount in amounts:
                    if amount.get('currencyId') == data['tariff']['amount']['currency']:
                        amount.text = str(data['tariff']['amount']['value'])
                        break
                # If no matching currency found, update first one
                if amounts and not any(a.get('currencyId') == data['tariff']['amount']['currency'] for a in amounts):
                    amounts[0].text = str(data['tariff']['amount']['value'])
                    amounts[0].set('currencyId', data['tariff']['amount']['currency'])
    
    # 18. Signatures (Fields 22-24: authoritativeSignatoryPerson/name)
    if 'signatures' in data:
        # Consignor signature (Field 22)
        if 'consignor' in data['signatures']:
            consignor = root.find(f'{ns}consignor')
            if consignor is not None:
                signatory = consignor.find(f'{ns}authoritativeSignatoryPerson')
                if signatory is None:
                    signatory = Element(f'{ns}authoritativeSignatoryPerson')
                    consignor.append(signatory)
                # Use company name for the signature display
                if 'company' in data['signatures']['consignor']:
                    name_elem = signatory.find(f'{ns}name')
                    if name_elem is None:
                        name_elem = Element(f'{ns}name')
                        signatory.append(name_elem)
                    name_elem.text = data['signatures']['consignor']['company']
        
        # Carrier signature (Field 23)
        if 'carrier' in data['signatures']:
            carrier = root.find(f'{ns}carrier')
            if carrier is not None:
                signatory = carrier.find(f'{ns}authoritativeSignatoryPerson')
                if signatory is None:
                    signatory = Element(f'{ns}authoritativeSignatoryPerson')
                    carrier.append(signatory)
                # Use company name for the signature display
                if 'company' in data['signatures']['carrier']:
                    name_elem = signatory.find(f'{ns}name')
                    if name_elem is None:
                        name_elem = Element(f'{ns}name')
                        signatory.append(name_elem)
                    name_elem.text = data['signatures']['carrier']['company']
        
        # Consignee signature (Field 24)
        if 'consignee' in data['signatures']:
            consignee = root.find(f'{ns}consignee')
            if consignee is not None:
                signatory = consignee.find(f'{ns}authoritativeSignatoryPerson')
                if signatory is None:
                    signatory = Element(f'{ns}authoritativeSignatoryPerson')
                    consignee.append(signatory)
                # Use company name for the signature display
                if 'company' in data['signatures']['consignee']:
                    name_elem = signatory.find(f'{ns}name')
                    if name_elem is None:
                        name_elem = Element(f'{ns}name')
                        signatory.append(name_elem)
                    name_elem.text = data['signatures']['consignee']['company']
    
    # Write output
    xml_str = tostring(root, encoding='utf-8').decode('utf-8')
    dom = minidom.parseString(xml_str)
    pretty_xml = dom.toprettyxml(indent='  ', encoding='utf-8').decode('utf-8')
    
    output_file = f'{output_uuid}.xml'
    print(f"Writing updated XML to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(pretty_xml)
    
    print(f"\nDone! Updated XML created: {output_file}")
    print(f"Dataset UUID: {output_uuid}")
    print(f"Use this UUID when registering the dataset in ROI.")
    
    return output_uuid

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python update_xml_from_minimal_data.py <normal_xml_file> <data_json_file> [output_uuid]")
        print("\nExample:")
        print("  python update_xml_from_minimal_data.py 69022a3b-26d3-46f9-9282-d11617ff4afe.xml example_minimal_data.json")
        sys.exit(1)
    
    normal_xml = sys.argv[1]
    data_file = sys.argv[2]
    output_uuid = sys.argv[3] if len(sys.argv) > 3 else None
    
    update_xml_from_minimal_data(normal_xml, data_file, output_uuid)
