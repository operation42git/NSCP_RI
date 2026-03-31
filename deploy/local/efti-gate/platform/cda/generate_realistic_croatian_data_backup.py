"""
Fixed version of generate_minimal_xml that uses ElementTree to modify template XML
This ensures schema compliance by using a working template and only replacing values
"""

from xml.etree.ElementTree import parse, tostring
from xml.dom import minidom
import os

def format_datetime(dt_str, format_id='203'):
    """Format datetime string to eFTI format (YYYYMMDDHHmm)"""
    from datetime import datetime
    try:
        if 'T' in dt_str:
            dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        else:
            dt = datetime.strptime(dt_str, '%Y-%m-%d %H:%M')
        
        if format_id == '203':  # YYYYMMDDHHmm
            return dt.strftime('%Y%m%d%H%M')
        elif format_id == '102':  # YYYYMMDD
            return dt.strftime('%Y%m%d')
        else:
            return dt.strftime('%Y%m%d%H%M')
    except:
        return dt_str

def generate_minimal_xml(data, dataset_uuid):
    """
    Generate minimal XML from JSON data file using ElementTree
    
    Uses a working XML template and replaces only specified fields.
    This ensures schema compliance and correct element ordering.
    """
    # Use working template
    template_file = '648f1295-6df2-4a39-a28c-b7c762950a2a.xml'
    if not os.path.exists(template_file):
        template_file = '12345678-ab12-4ab6-8999-123456789abc.xml'
    
    if not os.path.exists(template_file):
        raise FileNotFoundError(f"Template file not found: {template_file}")
    
    # Parse template XML
    tree = parse(template_file)
    root = tree.getroot()
    
    ns = '{http://efti.eu/v1/consignment/common}'
    
    # Helper to find first element and update text
    def update_text(parent, tag, value):
        for elem in parent.findall(f'.//{ns}{tag}'):
            elem.text = str(value)
            return True
        return False
    
    # Helper to find element under specific parent
    def find_in_parent(parent_tag, child_tag):
        for parent in root.findall(f'.//{ns}{parent_tag}'):
            child = parent.find(f'{ns}{child_tag}')
            if child is not None:
                return child
        return None
    
    # CMR Field 1: Consignor
    if 'consignor' in data:
        consignor = root.find(f'{ns}consignor')
        if consignor is not None:
            if 'name' in data['consignor']:
                update_text(consignor, 'name', data['consignor']['name'])
            if 'address' in data['consignor']:
                addr = data['consignor']['address']
                postal = consignor.find(f'{ns}postalAddress')
                if postal is not None:
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
                tax_reg = consignor.find(f'{ns}taxRegistration')
                if tax_reg is not None:
                    tax_id_elem = tax_reg.find(f'{ns}id')
                    if tax_id_elem is not None:
                        tax_id_elem.text = data['consignor']['tax_id']
    
    # CMR Field 2: Consignee
    if 'consignee' in data:
        consignee = root.find(f'{ns}consignee')
        if consignee is not None:
            if 'name' in data['consignee']:
                update_text(consignee, 'name', data['consignee']['name'])
            if 'address' in data['consignee']:
                addr = data['consignee']['address']
                postal = consignee.find(f'{ns}postalAddress')
                if postal is not None:
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
                tax_reg = consignee.find(f'{ns}taxRegistration')
                if tax_reg is not None:
                    tax_id_elem = tax_reg.find(f'{ns}id')
                    if tax_id_elem is not None:
                        tax_id_elem.text = data['consignee']['tax_id']
    
    # CMR Field 3: Delivery Location
    if 'delivery_location' in data:
        delivery = root.find(f'{ns}consigneeReceiptLocation')
        if delivery is not None:
            dl = data['delivery_location']
            if 'name' in dl:
                update_text(delivery, 'name', dl['name'])
            if 'address' in dl:
                addr = dl['address']
                postal = delivery.find(f'{ns}postalAddress')
                if postal is not None:
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
    
    # CMR Field 4: Pickup
    if 'pickup' in data:
        pickup_data = data['pickup']
        if 'datetime' in pickup_data:
            dt_elem = root.find(f'{ns}carrierAcceptanceDateTime')
            if dt_elem is not None:
                dt_elem.text = format_datetime(pickup_data['datetime'])
        if 'location' in pickup_data:
            pickup_loc = root.find(f'{ns}carrierAcceptanceLocation')
            if pickup_loc is not None:
                loc = pickup_data['location']
                if 'city' in loc:
                    update_text(pickup_loc, 'name', loc['city'])
                postal = pickup_loc.find(f'{ns}postalAddress')
                if postal is not None:
                    if 'street' in loc:
                        update_text(postal, 'streetName', loc['street'])
                    if 'building_number' in loc:
                        update_text(postal, 'buildingNumber', loc['building_number'])
                    if 'postcode' in loc:
                        update_text(postal, 'postcode', loc['postcode'])
                    if 'city' in loc:
                        update_text(postal, 'cityName', loc['city'])
                    if 'country' in loc:
                        update_text(postal, 'countryCode', loc['country'])
    
    # CMR Field 16: Carrier
    if 'carrier' in data:
        carrier = root.find(f'{ns}carrier')
        if carrier is not None:
            carrier_data = data['carrier']
            if 'name' in carrier_data:
                update_text(carrier, 'name', carrier_data['name'])
            if 'address' in carrier_data:
                addr = carrier_data['address']
                postal = carrier.find(f'{ns}postalAddress')
                if postal is not None:
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
            if 'tax_id' in carrier_data:
                tax_reg = carrier.find(f'{ns}taxRegistration')
                if tax_reg is not None:
                    tax_id_elem = tax_reg.find(f'{ns}id')
                    if tax_id_elem is not None:
                        tax_id_elem.text = carrier_data['tax_id']
    
    # CMR Fields 6-12: Goods
    if 'goods' in data:
        goods_data = data['goods']
        item = root.find(f'{ns}includedConsignmentItem')
        if item is not None:
            if 'marks' in goods_data:
                marks = item.find(f'{ns}shippingMarks')
                if marks is not None:
                    update_text(marks, 'markingText', goods_data['marks'])
            if 'package_count' in goods_data:
                update_text(item, 'goodsUnitQuantity', goods_data['package_count'])
            if 'packaging_description' in goods_data:
                update_text(item, 'description', goods_data['packaging_description'])
            if 'nature' in goods_data:
                nature = item.find(f'{ns}natureIdentificationTransportCargo')
                if nature is not None:
                    update_text(nature, 'description', goods_data['nature'])
            if 'hs_code' in goods_data:
                update_text(item, 'harmonizedCommodityCode', goods_data['hs_code'])
        
        if 'gross_weight' in goods_data:
            weight_elem = root.find(f'{ns}grossWeight')
            if weight_elem is not None:
                weight_elem.text = str(goods_data['gross_weight'].get('value', 0))
                weight_elem.set('unitId', goods_data['gross_weight'].get('unit', 'KGM'))
        
        if 'volume' in goods_data:
            volume_elem = root.find(f'{ns}grossVolume')
            if volume_elem is not None:
                volume_elem.text = str(goods_data['volume'].get('value', 0))
                volume_elem.set('unitId', goods_data['volume'].get('unit', 'MTQ'))
    
    # CMR Field 13: Sender Instructions
    if 'sender_instructions' in data:
        update_text(root, 'consignorProvidedInformationText', data['sender_instructions'])
    
    # CMR Field 14: COD
    if 'cod_amount' in data:
        cod_elem = root.find(f'{ns}cODAmount')
        if cod_elem is not None:
            cod_elem.text = str(data['cod_amount'].get('value', 0))
            cod_elem.set('currencyId', data['cod_amount'].get('currency', 'EUR'))
    
    # CMR Fields 15, 19, 27, 28: Payment and Tariff
    if 'freight_payment' in data or 'payment_party' in data or 'tariff' in data:
        service_charge = root.find(f'{ns}applicableServiceCharge')
        if service_charge is not None:
            if 'freight_payment' in data:
                update_text(service_charge, 'paymentArrangementCode', data['freight_payment'])
            if 'payment_party' in data:
                update_text(service_charge, 'payingPartyRoleCode', data['payment_party'])
            if 'tariff' in data:
                if 'basis' in data['tariff']:
                    basis = data['tariff']['basis'].lower()
                    basis_map = {
                        'per_km': 'DISTANCE',
                        'per_kmeter': 'DISTANCE',
                        'distance': 'DISTANCE',
                        'weight': 'WEIGHT',
                        'flat_rate': 'FLAT_RATE',
                        'per_pallet': 'PER_PALLET',
                        'per_package': 'PER_PACKAGE'
                    }
                    basis_code = basis_map.get(basis, basis.upper().replace('_', '_'))
                    update_text(service_charge, 'calculationBasisCode', basis_code)
                if 'amount' in data['tariff']:
                    amt_elem = service_charge.find(f'{ns}appliedAmount')
                    if amt_elem is not None:
                        amt_elem.text = str(data['tariff']['amount'].get('value', 0))
                        amt_elem.set('currencyId', data['tariff']['amount'].get('currency', 'EUR'))
    
    # CMR Field 20: Special Agreements
    if 'special_agreements' in data:
        update_text(root, 'contractTermsText', data['special_agreements'])
    
    # CMR Fields 25-26: Vehicle
    if 'vehicle' in data:
        vehicle_data = data['vehicle']
        transport_movement = root.find(f'{ns}mainCarriageTransportMovement')
        if transport_movement is not None:
            if 'id' in vehicle_data:
                transport_means = transport_movement.find(f'{ns}usedTransportMeans')
                if transport_means is not None:
                    update_text(transport_means, 'id', vehicle_data['id'])
                    if ' ' in vehicle_data['id']:
                        country_code = vehicle_data['id'].split()[0]
                        reg_country = transport_means.find(f'{ns}registrationCountry')
                        if reg_country is not None:
                            update_text(reg_country, 'code', country_code)
            if 'trailer_id' in vehicle_data:
                equipment = root.find(f'{ns}usedTransportEquipment')
                if equipment is not None:
                    update_text(equipment, 'id', vehicle_data['trailer_id'])
            if 'model' in vehicle_data:
                equipment = root.find(f'{ns}usedTransportEquipment')
                if equipment is not None:
                    update_text(equipment, 'categoryCode', vehicle_data['model'])
    
    # CMR Field 21: Issue Date & Location
    if 'issue_date' in data or 'issue_location' in data:
        assoc_docs = root.findall(f'{ns}associatedDocument')
        if assoc_docs:
            assoc_doc = assoc_docs[0]
            if 'issue_date' in data:
                issue_dt = assoc_doc.find(f'{ns}formattedIssueDateTime')
                if issue_dt is not None:
                    issue_dt.text = format_datetime(data['issue_date'], '205')
            if 'issue_location' in data:
                issue_loc = assoc_doc.find(f'{ns}issueLocation')
                if issue_loc is not None:
                    loc_data = data['issue_location']
                    if 'city' in loc_data:
                        update_text(issue_loc, 'name', loc_data['city'])
                    postal = issue_loc.find(f'{ns}postalAddress')
                    if postal is not None:
                        if 'street' in loc_data:
                            update_text(postal, 'streetName', loc_data['street'])
                        elif 'city' in loc_data:
                            # Ensure streetName exists (required by schema order)
                            street_elem = postal.find(f'{ns}streetName')
                            if street_elem is None:
                                from xml.etree.ElementTree import Element
                                street_elem = Element(f'{ns}streetName')
                                postal.insert(0, street_elem)  # Insert at beginning (before buildingNumber)
                            street_elem.text = loc_data['city']
                        if 'city' in loc_data:
                            update_text(postal, 'cityName', loc_data['city'])
                        if 'country' in loc_data:
                            update_text(postal, 'countryCode', loc_data['country'])
    
    # CMR Field 5: Attached Documents
    if 'attached_documents' in data and len(data['attached_documents']) > 0:
        doc = data['attached_documents'][0]
        assoc_docs = root.findall(f'{ns}associatedDocument')
        if assoc_docs:
            assoc_doc = assoc_docs[0]
            if 'id' in doc:
                doc_id_elem = assoc_doc.find(f'{ns}id')
                if doc_id_elem is not None:
                    doc_id_elem.text = doc['id']
            if 'type' in doc:
                clause = assoc_doc.find(f'{ns}contractualClause')
                if clause is not None:
                    update_text(clause, 'contentText', doc['type'])
    
    # CMR Field: eCMR identifier
    if 'ecmr_identifier' in data:
        assoc_docs = root.findall(f'{ns}associatedDocument')
        if assoc_docs:
            doc_id_elem = assoc_docs[0].find(f'{ns}id')
            if doc_id_elem is not None:
                doc_id_elem.text = data['ecmr_identifier']
    
    # Convert to XML string
    xml_str = tostring(root, encoding='unicode')
    
    # Pretty print
    dom = minidom.parseString(xml_str)
    pretty_xml = dom.toprettyxml(indent='  ', encoding='utf-8').decode('utf-8')
    
    return pretty_xml

