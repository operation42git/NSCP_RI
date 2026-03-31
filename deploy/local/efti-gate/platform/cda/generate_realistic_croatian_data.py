#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprehensive script to replace ALL placeholder data with realistic Croatian data

Three modes available:
- NORMAL: Realistic normal consignment with regular goods, no dangerous goods
- ADR: Dangerous goods consignment with proper ADR information and regulations
- MINIMAL: Generate minimal XML with only specified fields from JSON data file
"""

import re
import random
import json
import os
from datetime import datetime, timedelta
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom import minidom

# Croatian company names
CROATIAN_COMPANIES = [
    "Hrvatska pošta d.o.o.", "INA d.d.", "Konzum d.d.", "Tisak d.o.o.", 
    "Podravka d.d.", "Kraš d.d.", "Pliva d.d.", "Ericsson Nikola Tesla d.d.",
    "Croatia Airlines d.d.", "Jadrolinija d.d.", "HŽ Cargo d.o.o.", 
    "Hrvatske šume d.o.o.", "Agrokor d.d.", "Atlantic Grupa d.d.",
    "Adris grupa d.d.", "Valamar Riviera d.d.", "Jadranka d.o.o.",
    "Zagrebačka banka d.d.", "Privredna banka Zagreb d.d.",
    "Transport d.o.o. Zagreb", "Logistika d.o.o. Rijeka", 
    "Prijevoz d.o.o. Split", "Dostava d.o.o. Osijek"
]

# Croatian first names
CROATIAN_FIRST_NAMES = [
    "Ivan", "Marko", "Josip", "Petar", "Ante", "Stjepan", "Mario", 
    "Tomislav", "Igor", "Zoran", "Davor", "Branko", "Dražen", "Hrvoje",
    "Ana", "Marija", "Ivana", "Petra", "Martina", "Jelena", "Katarina", 
    "Sandra", "Maja", "Nina", "Sanja", "Tatjana", "Vesna", "Mirjana"
]

# Croatian last names
CROATIAN_LAST_NAMES = [
    "Horvat", "Kovačević", "Babić", "Marić", "Novak", "Jurić", 
    "Knežević", "Vuković", "Marković", "Petrović", "Tomić", "Kovačić",
    "Pavić", "Matić", "Perić", "Božić", "Lovrić", "Vidović", "Radić"
]

# Croatian cities with their corresponding counties (županije) and postal codes
# Format: (city, county, postal_code)
CROATIAN_CITY_DATA = [
    ("Zagreb", "Grad Zagreb", "10000"),
    ("Rijeka", "Primorsko-goranska županija", "51000"),
    ("Split", "Splitsko-dalmatinska županija", "21000"),
    ("Osijek", "Osječko-baranjska županija", "31000"),
    ("Zadar", "Zadarska županija", "23000"),
    ("Pula", "Istarska županija", "52100"),
    ("Šibenik", "Šibensko-kninska županija", "22000"),
    ("Dubrovnik", "Dubrovačko-neretvanska županija", "20000"),
    ("Varaždin", "Varaždinska županija", "42000"),
    ("Karlovac", "Karlovačka županija", "47000"),
    ("Sisak", "Sisačko-moslavačka županija", "44000"),
    ("Velika Gorica", "Zagrebačka županija", "10410"),
    ("Bjelovar", "Bjelovarsko-bilogorska županija", "43000"),
    ("Koprivnica", "Koprivničko-križevačka županija", "48000"),
    ("Požega", "Požeško-slavonska županija", "34000"),
    ("Slavonski Brod", "Brodsko-posavska županija", "35000"),
    ("Đakovo", "Osječko-baranjska županija", "31400"),
    ("Vukovar", "Vukovarsko-srijemska županija", "32000"),
    ("Čakovec", "Međimurska županija", "40000"),
    ("Samobor", "Zagrebačka županija", "10430"),
    ("Vinkovci", "Vukovarsko-srijemska županija", "32100"),
    ("Kutina", "Sisačko-moslavačka županija", "44320"),
    ("Petrinja", "Sisačko-moslavačka županija", "44250"),
    ("Krapina", "Krapinsko-zagorska županija", "49000"),
    ("Gospić", "Ličko-senjska županija", "53000"),
    ("Virovitica", "Virovitičko-podravska županija", "33000"),
]

# Extract lists for backward compatibility
CROATIAN_CITIES = [city[0] for city in CROATIAN_CITY_DATA]
CROATIAN_COUNTIES = list(set([city[1] for city in CROATIAN_CITY_DATA]))
CROATIAN_POSTAL_CODES = [city[2] for city in CROATIAN_CITY_DATA]

# Create mapping dictionaries for realistic address generation
CITY_TO_COUNTY = {city[0]: city[1] for city in CROATIAN_CITY_DATA}
CITY_TO_POSTAL_CODE = {city[0]: city[2] for city in CROATIAN_CITY_DATA}

# Croatian street names
CROATIAN_STREETS = [
    "Ilica", "Radnička cesta", "Vukovarska", "Jadranska avenija", 
    "Zagrebačka", "Trg bana Jelačića", "Savska cesta", "Maksimirska", 
    "Dubrovačka", "Splitska", "Riječka", "Osječka", "Zadarska", 
    "Korzo", "Obala hrvatskog narodnog preporoda", "Strossmayerova", 
    "Jurišićeva", "Masarykova", "Petrinjska", "Gundulićeva", "Preradovićeva",
    "Heinzelova", "Vlaška", "Nova cesta", "Branimirova", "Držićeva"
]

# Normal goods descriptions (realistic transport goods - NON-DANGEROUS)
NORMAL_GOODS = [
    "Električni uređaji", "Namještaj", "Tekstilni proizvodi", "Hrana i piće",
    "Gradjevinski materijal", "Automobilske komponente",
    "Papir i kartonska ambalaža", "Plastični proizvodi", "Metalni proizvodi",
    "Mliječni proizvodi", "Voće i povrće", "Meso i mesni proizvodi",
    "Riba i morski plodovi", "Žitarice", "Kozmetika",
    "Odjeća i obuća", "Računala i elektronika", "Staklo i keramika",
    "Drvo i drvni proizvodi"
]

# ADR Dangerous Goods - UN codes with matching proper shipping names and descriptions
# Format: (UN_CODE, PROPER_SHIPPING_NAME_HR, DESCRIPTION_HR, HAZARD_CLASS, PACKING_GROUP)
ADR_DANGEROUS_GOODS = [
    ("UN1202", "Benzin", "Benzin, gorivo", "3", "II"),
    ("UN1203", "Dizel gorivo", "Dizel gorivo", "3", "III"),
    ("UN1263", "Aceton", "Aceton", "3", "II"),
    ("UN1950", "Kompresirani plin", "Kompresirani plin, N.O.S.", "2", "N/A"),
    ("UN2796", "Sumporna kiselina", "Sumporna kiselina", "8", "II"),
    ("UN1789", "Klorovodična kiselina", "Klorovodična kiselina", "8", "II"),
    ("UN3480", "Litij-ionske baterije", "Litij-ionske baterije", "9", "II"),
    ("UN1993", "Tekućine, zapaljive, N.O.S.", "Tekućine, zapaljive", "3", "III"),
    ("UN3082", "Tekućine, okoljno opasne, N.O.S.", "Tekućine, okoljno opasne", "9", "III"),
    ("UN3065", "Etanol", "Etanol", "3", "II"),
    ("UN3291", "Kemikalije, N.O.S.", "Kemikalije, N.O.S.", "9", "III"),
    ("UN3373", "Biološki materijal, kategorija B", "Biološki materijal", "6", "N/A"),
]

# For backward compatibility
CROATIAN_GOODS = NORMAL_GOODS

# Realistic contract terms
CONTRACT_TERMS = [
    "Standardni uvjeti prijevoza", "Uskladištenje na vlastitu odgovornost",
    "Osiguranje uključeno", "Dostava na adresu primatelja",
    "Plaćanje pri preuzimanju", "Povratna ambalaža obavezna"
]

# Realistic information texts
INFORMATION_TEXTS = [
    "Roba je pakirana prema standardima", "Potrebna pažljiva rukovanje",
    "Čuvati na suhom mjestu", "Roba osjetljiva na temperaturu",
    "Dostava u radnim danima", "Potrebna dokumentacija uz robu"
]

# Sender instructions matching goods types (avoid contradictions)
SENDER_INSTRUCTIONS_BY_GOODS = {
    "Tekstilni proizvodi": ["Čuvati suho", "Ne izlagati vlazi", "Standardno rukovanje"],
    "Električni uređaji": ["Fragilno", "Ne izlagati vlazi", "Čuvati suho"],
    "Namještaj": ["Ne naginjati", "Čuvati suho", "Pažljivo rukovanje"],
    "Hrana i piće": ["Temperatura kontrolirana", "Rok trajanja", "HACCP"],
    "Gradjevinski materijal": ["Težak teret", "Pažljivo pri istovarku"],
    "Automobilske komponente": ["Fragilno", "Osjetljivo na udarce"],
    "Mliječni proizvodi": ["Hlađeno", "Temperatura max 4°C", "HACCP"],
    "Voće i povrće": ["Svježe", "Ventilirano", "Temperatura kontrolirana"],
    "Meso i mesni proizvodi": ["Hlađeno", "Temperatura max 4°C", "HACCP"],
    "default": ["Standardno rukovanje", "Pažljivo rukovanje", "Bez posebnih zahtjeva"]
}

# Real truck and trailer models
TRUCK_MODELS = [
    "Mercedes-Benz Actros 1845", "Mercedes-Benz Actros 2545", "Mercedes-Benz Atego 1224",
    "MAN TGX 18.500", "MAN TGS 26.400", "MAN TGM 18.290",
    "Volvo FH 500", "Volvo FM 460", "Volvo FE 320",
    "Scania R450", "Scania S500", "Scania P320",
    "DAF XF 480", "DAF CF 450", "DAF LF 280",
    "Iveco Stralis 460", "Iveco Eurocargo 120", "Iveco S-Way 490",
    "Renault T High 520", "Renault D Wide 280", "Renault C 380"
]

TRAILER_MODELS = [
    "Schmitz Cargobull S.KO", "Schmitz Cargobull S.CS", "Schmitz Cargobull S.PR",
    "Krone Profi Liner", "Krone Cool Liner", "Krone Mega Liner",
    "Kögel Cargo", "Kögel Lightplus", "Kögel Cool",
    "Wielton NS3", "Wielton NW3", "Wielton PC3",
    "Schwarzmüller SPA 3/E", "Schwarzmüller RH125",
    "Fliegl SDS", "Fliegl SZS",
    "Tirsan Tridem", "Tirsan Mega"
]

# Payment party roles (excluding LOADER - not a valid payment party)
VALID_PAYMENT_PARTY_ROLES = ["CONSIGNOR", "CONSIGNEE", "CARRIER", "THIRD_PARTY"]

# Tariff calculation basis codes (excluding VOLUME for tariff display)
TARIFF_CALCULATION_BASIS = ["WEIGHT", "DISTANCE", "FLAT_RATE", "PER_PALLET", "PER_PACKAGE"]

# Transport company names (for carriers - distinct from banks and other entities)
TRANSPORT_COMPANIES = [
    "Transport d.o.o. Zagreb", "Logistika d.o.o. Rijeka", "Prijevoz d.o.o. Split", 
    "Dostava d.o.o. Osijek", "HŽ Cargo d.o.o.", "Intereuropa d.o.o.",
    "Lagermax d.o.o.", "Gebrüder Weiss d.o.o.", "DB Schenker d.o.o.",
    "DHL Express Croatia d.o.o.", "Kuehne + Nagel d.o.o.", "DSV Transport d.o.o."
]

# Non-transport companies (for consignors/consignees - production, retail, etc.)
NON_TRANSPORT_COMPANIES = [
    "Podravka d.d.", "Kraš d.d.", "Pliva d.d.", "Konzum d.d.", 
    "Adris grupa d.d.", "Atlantic Grupa d.d.", "Ledo d.d.",
    "Vindija d.d.", "Gavrilović d.o.o.", "Zvijezda d.d.",
    "Belupo d.d.", "Franck d.d.", "Dukat d.d."
]

def generate_croatian_phone():
    """Generate realistic Croatian phone number"""
    area_codes = ["1", "20", "21", "22", "23", "31", "32", "33", "34", "35", 
                  "40", "42", "43", "47", "48", "51", "52", "53"]
    area = random.choice(area_codes)
    number = f"+385 {area} {random.randint(100, 999)} {random.randint(100, 999)}"
    return number

def generate_croatian_email(name=None):
    """Generate realistic Croatian email"""
    if name:
        base = name.lower().replace(" ", ".").replace("č", "c").replace("ć", "c").replace("š", "s").replace("ž", "z").replace("đ", "d")
    else:
        first = random.choice(CROATIAN_FIRST_NAMES).lower()
        last = random.choice(CROATIAN_LAST_NAMES).lower()
        base = f"{first}.{last}"
    
    domains = ["gmail.com", "email.hr", "inet.hr", "t-com.hr", "zg.t-com.hr"]
    return f"{base}@{random.choice(domains)}"

def generate_realistic_id(prefix="HR"):
    """Generate realistic ID"""
    return f"{prefix}-{random.randint(100000, 999999)}"

# Realistic codes and identifiers
TRANSPORT_CODES = ["ROAD", "RAIL", "SEA", "AIR", "INLAND_WATERWAY"]
# Valid currency codes from the schema (HRK is not valid, Croatia uses EUR now)
CURRENCY_CODES = ["EUR", "USD", "GBP", "CHF", "JPY", "CNY", "BGN", "RON", "RSD", "HUF", "PLN", "CZK"]
# Valid unit codes - some fields have restrictions (e.g., only GRM, KGM, TNE)
UNIT_CODES = ["KGM", "GRM", "TNE", "MTR", "LTR", "PCE", "PKG"]
# For fields with strict enumeration (like weight measurements)
RESTRICTED_UNIT_CODES = ["GRM", "KGM", "TNE"]
ROLE_CODES = ["CONSIGNOR", "CONSIGNEE", "CARRIER", "DRIVER"]  # Removed LOADER, UNLOADER - not valid for signatures
PAYMENT_CODES = ["PREPAID", "COLLECT", "THIRD_PARTY"]
STATEMENT_CODES = ["AUTHENTICATED", "VERIFIED", "APPROVED"]
TYPE_CODES = ["LICENSE", "PERMIT", "CERTIFICATE"]

# ============================================================================
# MINIMAL MODE: Exact Field Mapping from JSON Data
# ============================================================================

def create_minimal_xml_template():
    """Create minimal valid XML structure with required namespaces"""
    # Create root element with namespaces
    root = Element('{http://efti.eu/v1/consignment/common}consignment')
    root.set('xmlns', 'http://efti.eu/v1/consignment/common')
    root.set('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
    root.set('xsi:schemaLocation', 'http://efti.eu/v1/consignment/common ../consignment-common.xsd')
    return root

def add_text_element(parent, tag, text, namespace='http://efti.eu/v1/consignment/common'):
    """Add text element with namespace"""
    elem = SubElement(parent, f'{{{namespace}}}{tag}')
    elem.text = str(text) if text is not None else ''
    return elem

def add_address(parent, address_data, namespace='http://efti.eu/v1/consignment/common'):
    """Add postal address structure - MUST follow schema order!"""
    if not address_data:
        return None
    
    postal = SubElement(parent, f'{{{namespace}}}postalAddress')
    
    # CRITICAL: Element order matters! Schema requires specific order:
    # 1. additionalStreetName (optional)
    # 2. streetName (must come before buildingNumber!)
    # 3. buildingNumber
    # 4. postcode
    # 5. cityName
    # 6. countryCode
    # 7. countrySubDivisionName (optional)
    # 8. departmentName (optional)
    # 9. postOfficeBox (optional)
    
    if 'street' in address_data:
        add_text_element(postal, 'streetName', address_data['street'], namespace)
    if 'building_number' in address_data:
        add_text_element(postal, 'buildingNumber', address_data['building_number'], namespace)
    if 'postcode' in address_data:
        add_text_element(postal, 'postcode', address_data['postcode'], namespace)
    if 'city' in address_data:
        add_text_element(postal, 'cityName', address_data['city'], namespace)
    if 'country' in address_data:
        add_text_element(postal, 'countryCode', address_data['country'], namespace)
    if 'state' in address_data:
        add_text_element(postal, 'countrySubDivisionName', address_data['state'], namespace)
    
    return postal

def format_datetime(dt_str, format_id='203'):
    """Format datetime string to eFTI format (YYYYMMDDHHmm)"""
    try:
        # Try parsing ISO format
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
    from xml.etree.ElementTree import parse, tostring
    from xml.dom import minidom
    
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
                # Don't put model in categoryCode - categoryCode must be an enumerated value
                # Instead, we'll leave categoryCode as-is from template (it's already valid)
                # The model information is descriptive and doesn't map to a schema field
                # If needed, it could go in a description field, but for minimal mode we skip it
                pass
    
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

def generate_minimal_xml_OLD_REGEX_BROKEN(data, dataset_uuid):
    """
    Generate minimal XML from JSON data file
    
    Uses a working XML template and replaces only specified fields using ElementTree.
    This ensures schema compliance and correct element ordering.
    
    Args:
        data: Dictionary with field values
        dataset_uuid: UUID for the dataset
    
    Returns:
        XML string with only specified fields populated, rest from template
    """
    # Use working template instead of building from scratch
    # This ensures schema compliance and correct element ordering
    template_file = '648f1295-6df2-4a39-a28c-b7c762950a2a.xml'
    if not os.path.exists(template_file):
        template_file = '12345678-ab12-4ab6-8999-123456789abc.xml'
    
    if not os.path.exists(template_file):
        raise FileNotFoundError(f"Template file not found: {template_file}")
    
    # Parse template XML using ElementTree (preserves structure and order)
    from xml.etree.ElementTree import parse, tostring
    tree = parse(template_file)
    root = tree.getroot()
    
    ns = '{http://efti.eu/v1/consignment/common}'
    
    # Helper function to find and update text in element
    def update_element_text(parent, tag_name, new_value):
        """Find first element with tag_name under parent and update its text"""
        for elem in parent.findall(f'.//{ns}{tag_name}'):
            elem.text = new_value
            return True
        return False
    
    def update_element_attr(parent, tag_name, attr_name, new_value):
        """Find first element with tag_name under parent and update attribute"""
        for elem in parent.findall(f'.//{ns}{tag_name}'):
            elem.set(attr_name, new_value)
            return True
        return False
    
    # Replace only specified fields - this preserves all other structure
    
    # CMR Field 1: Pošiljatelj (Consignor) - name
    if 'consignor' in data and 'name' in data['consignor']:
        # Replace first consignor name
        content = re.sub(
            r'(<consignor[^>]*>.*?<name>)[^<]+(</name>)',
            rf'\1{re.escape(data["consignor"]["name"])}\2',
            content,
            count=1,
            flags=re.DOTALL
        )
        # Replace consignor address fields
        if 'address' in data['consignor']:
            addr = data['consignor']['address']
            if 'street' in addr:
                content = re.sub(
                    r'(<consignor[^>]*>.*?<postalAddress>.*?<streetName>)[^<]+(</streetName>)',
                    rf'\1{re.escape(addr["street"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'building_number' in addr:
                # Use lambda to avoid backreference issues
                def replace_building(match):
                    return match.group(1) + addr["building_number"] + match.group(2)
                content = re.sub(
                    r'(<consignor[^>]*>.*?<postalAddress>.*?<buildingNumber>)[^<]+(</buildingNumber>)',
                    replace_building,
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'postcode' in addr:
                content = re.sub(
                    r'(<consignor[^>]*>.*?<postalAddress>.*?<postcode>)[^<]+(</postcode>)',
                    rf'\1{re.escape(addr["postcode"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'city' in addr:
                content = re.sub(
                    r'(<consignor[^>]*>.*?<postalAddress>.*?<cityName>)[^<]+(</cityName>)',
                    rf'\1{re.escape(addr["city"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'country' in addr:
                content = re.sub(
                    r'(<consignor[^>]*>.*?<postalAddress>.*?<countryCode>)[^<]+(</countryCode>)',
                    rf'\1{re.escape(addr["country"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
        # Replace tax ID
        if 'tax_id' in data['consignor']:
            content = re.sub(
                r'(<consignor[^>]*>.*?<taxRegistration>.*?<id[^>]*>)[^<]+(</id>)',
                rf'\1{re.escape(data["consignor"]["tax_id"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
        # Replace signature
        if 'signatures' in data and 'consignor' in data['signatures']:
            sig = data['signatures']['consignor']
            if 'company' in sig:
                content = re.sub(
                    r'(<consignor[^>]*>.*?<authoritativeSignatoryPerson>.*?<name>)[^<]+(</name>)',
                    rf'\1{re.escape(sig["company"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'person' in sig:
                parts = sig['person'].split(' ', 1)
                if len(parts) >= 1:
                    content = re.sub(
                        r'(<consignor[^>]*>.*?<authoritativeSignatoryPerson>.*?<specifiedContactPerson>.*?<givenName>)[^<]+(</givenName>)',
                        rf'\1{re.escape(parts[0])}\2',
                        content,
                        count=1,
                        flags=re.DOTALL
                    )
                if len(parts) >= 2:
                    content = re.sub(
                        r'(<consignor[^>]*>.*?<authoritativeSignatoryPerson>.*?<specifiedContactPerson>.*?<familyName>)[^<]+(</familyName>)',
                        rf'\1{re.escape(parts[1])}\2',
                        content,
                        count=1,
                        flags=re.DOTALL
                    )
    
    # CMR Field 2: Primatelj (Consignee) - name
    if 'consignee' in data and 'name' in data['consignee']:
        content = re.sub(
            r'(<consignee[^>]*>.*?<name>)[^<]+(</name>)',
            rf'\1{re.escape(data["consignee"]["name"])}\2',
            content,
            count=1,
            flags=re.DOTALL
        )
        # Replace consignee address
        if 'address' in data['consignee']:
            addr = data['consignee']['address']
            if 'street' in addr:
                content = re.sub(
                    r'(<consignee[^>]*>.*?<postalAddress>.*?<streetName>)[^<]+(</streetName>)',
                    rf'\1{re.escape(addr["street"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'building_number' in addr:
                content = re.sub(
                    r'(<consignee[^>]*>.*?<postalAddress>.*?<buildingNumber>)[^<]+(</buildingNumber>)',
                    rf'\1{re.escape(addr["building_number"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'postcode' in addr:
                content = re.sub(
                    r'(<consignee[^>]*>.*?<postalAddress>.*?<postcode>)[^<]+(</postcode>)',
                    rf'\1{re.escape(addr["postcode"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'city' in addr:
                content = re.sub(
                    r'(<consignee[^>]*>.*?<postalAddress>.*?<cityName>)[^<]+(</cityName>)',
                    rf'\1{re.escape(addr["city"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'country' in addr:
                content = re.sub(
                    r'(<consignee[^>]*>.*?<postalAddress>.*?<countryCode>)[^<]+(</countryCode>)',
                    rf'\1{re.escape(addr["country"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
        # Replace tax ID
        if 'tax_id' in data['consignee']:
            content = re.sub(
                r'(<consignee[^>]*>.*?<taxRegistration>.*?<id[^>]*>)[^<]+(</id>)',
                rf'\1{re.escape(data["consignee"]["tax_id"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
        # Replace signature
        if 'signatures' in data and 'consignee' in data['signatures']:
            sig = data['signatures']['consignee']
            if 'company' in sig:
                content = re.sub(
                    r'(<consignee[^>]*>.*?<authoritativeSignatoryPerson>.*?<name>)[^<]+(</name>)',
                    rf'\1{re.escape(sig["company"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'person' in sig:
                parts = sig['person'].split(' ', 1)
                if len(parts) >= 1:
                    content = re.sub(
                        r'(<consignee[^>]*>.*?<authoritativeSignatoryPerson>.*?<specifiedContactPerson>.*?<givenName>)[^<]+(</givenName>)',
                        rf'\1{re.escape(parts[0])}\2',
                        content,
                        count=1,
                        flags=re.DOTALL
                    )
                if len(parts) >= 2:
                    content = re.sub(
                        r'(<consignee[^>]*>.*?<authoritativeSignatoryPerson>.*?<specifiedContactPerson>.*?<familyName>)[^<]+(</familyName>)',
                        rf'\1{re.escape(parts[1])}\2',
                        content,
                        count=1,
                        flags=re.DOTALL
                    )
    
    # CMR Field 3: Adresa isporuke (Delivery Location)
    if 'delivery_location' in data:
        dl = data['delivery_location']
        if 'name' in dl:
            content = re.sub(
                r'(<consigneeReceiptLocation[^>]*>.*?<name>)[^<]+(</name>)',
                rf'\1{re.escape(dl["name"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
        if 'address' in dl:
            addr = dl['address']
            if 'street' in addr:
                content = re.sub(
                    r'(<consigneeReceiptLocation[^>]*>.*?<postalAddress>.*?<streetName>)[^<]+(</streetName>)',
                    rf'\1{re.escape(addr["street"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'building_number' in addr:
                content = re.sub(
                    r'(<consigneeReceiptLocation[^>]*>.*?<postalAddress>.*?<buildingNumber>)[^<]+(</buildingNumber>)',
                    rf'\1{re.escape(addr["building_number"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'postcode' in addr:
                content = re.sub(
                    r'(<consigneeReceiptLocation[^>]*>.*?<postalAddress>.*?<postcode>)[^<]+(</postcode>)',
                    rf'\1{re.escape(addr["postcode"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'city' in addr:
                content = re.sub(
                    r'(<consigneeReceiptLocation[^>]*>.*?<postalAddress>.*?<cityName>)[^<]+(</cityName>)',
                    rf'\1{re.escape(addr["city"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'country' in addr:
                content = re.sub(
                    r'(<consigneeReceiptLocation[^>]*>.*?<postalAddress>.*?<countryCode>)[^<]+(</countryCode>)',
                    rf'\1{re.escape(addr["country"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
    
    # CMR Field 4: Mjesto i datum preuzimanja (Pickup Location & Date)
    if 'pickup' in data:
        pickup_data = data['pickup']
        if 'datetime' in pickup_data:
            formatted_dt = format_datetime(pickup_data['datetime'])
            content = re.sub(
                r'(<carrierAcceptanceDateTime[^>]*formatId="203">)[^<]+(</carrierAcceptanceDateTime>)',
                rf'\1{formatted_dt}\2',
                content,
                count=1
            )
        if 'location' in pickup_data:
            loc = pickup_data['location']
            if 'city' in loc:
                content = re.sub(
                    r'(<carrierAcceptanceLocation[^>]*>.*?<name>)[^<]+(</name>)',
                    rf'\1{re.escape(loc["city"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'street' in loc:
                content = re.sub(
                    r'(<carrierAcceptanceLocation[^>]*>.*?<postalAddress>.*?<streetName>)[^<]+(</streetName>)',
                    rf'\1{re.escape(loc["street"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'building_number' in loc:
                content = re.sub(
                    r'(<carrierAcceptanceLocation[^>]*>.*?<postalAddress>.*?<buildingNumber>)[^<]+(</buildingNumber>)',
                    rf'\1{re.escape(loc["building_number"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'postcode' in loc:
                content = re.sub(
                    r'(<carrierAcceptanceLocation[^>]*>.*?<postalAddress>.*?<postcode>)[^<]+(</postcode>)',
                    rf'\1{re.escape(loc["postcode"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'city' in loc:
                content = re.sub(
                    r'(<carrierAcceptanceLocation[^>]*>.*?<postalAddress>.*?<cityName>)[^<]+(</cityName>)',
                    rf'\1{re.escape(loc["city"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'country' in loc:
                content = re.sub(
                    r'(<carrierAcceptanceLocation[^>]*>.*?<postalAddress>.*?<countryCode>)[^<]+(</countryCode>)',
                    rf'\1{re.escape(loc["country"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
    
    # CMR Field 16: Prijevoznik (Carrier)
    if 'carrier' in data:
        carrier_data = data['carrier']
        if 'name' in carrier_data:
            content = re.sub(
                r'(<carrier[^>]*>.*?<name>)[^<]+(</name>)',
                rf'\1{re.escape(carrier_data["name"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
        if 'address' in carrier_data:
            addr = carrier_data['address']
            if 'street' in addr:
                content = re.sub(
                    r'(<carrier[^>]*>.*?<postalAddress>.*?<streetName>)[^<]+(</streetName>)',
                    rf'\1{re.escape(addr["street"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'building_number' in addr:
                content = re.sub(
                    r'(<carrier[^>]*>.*?<postalAddress>.*?<buildingNumber>)[^<]+(</buildingNumber>)',
                    rf'\1{re.escape(addr["building_number"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'postcode' in addr:
                content = re.sub(
                    r'(<carrier[^>]*>.*?<postalAddress>.*?<postcode>)[^<]+(</postcode>)',
                    rf'\1{re.escape(addr["postcode"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'city' in addr:
                content = re.sub(
                    r'(<carrier[^>]*>.*?<postalAddress>.*?<cityName>)[^<]+(</cityName>)',
                    rf'\1{re.escape(addr["city"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'country' in addr:
                content = re.sub(
                    r'(<carrier[^>]*>.*?<postalAddress>.*?<countryCode>)[^<]+(</countryCode>)',
                    rf'\1{re.escape(addr["country"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
        if 'tax_id' in carrier_data:
            content = re.sub(
                r'(<carrier[^>]*>.*?<taxRegistration>.*?<id[^>]*>)[^<]+(</id>)',
                rf'\1{re.escape(carrier_data["tax_id"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
        # Replace signature
        if 'signatures' in data and 'carrier' in data['signatures']:
            sig = data['signatures']['carrier']
            if 'company' in sig:
                content = re.sub(
                    r'(<carrier[^>]*>.*?<authoritativeSignatoryPerson>.*?<name>)[^<]+(</name>)',
                    rf'\1{re.escape(sig["company"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'person' in sig:
                parts = sig['person'].split(' ', 1)
                if len(parts) >= 1:
                    content = re.sub(
                        r'(<carrier[^>]*>.*?<authoritativeSignatoryPerson>.*?<specifiedContactPerson>.*?<givenName>)[^<]+(</givenName>)',
                        rf'\1{re.escape(parts[0])}\2',
                        content,
                        count=1,
                        flags=re.DOTALL
                    )
                if len(parts) >= 2:
                    content = re.sub(
                        r'(<carrier[^>]*>.*?<authoritativeSignatoryPerson>.*?<specifiedContactPerson>.*?<familyName>)[^<]+(</familyName>)',
                        rf'\1{re.escape(parts[1])}\2',
                        content,
                        count=1,
                        flags=re.DOTALL
                    )
    
    # CMR Field 18: Rezervacije prijevoznika
    if 'carrier_reservations' in data:
        content = re.sub(
            r'(<information>)[^<]+(</information>)',
            rf'\1{re.escape(data["carrier_reservations"])}\2',
            content,
            count=1
        )
    
    # CMR Fields 6-12: Roba (Goods)
    if 'goods' in data:
        goods_data = data['goods']
        if 'marks' in goods_data:
            content = re.sub(
                r'(<includedConsignmentItem>.*?<shippingMarks>.*?<markingText>)[^<]+(</markingText>)',
                rf'\1{re.escape(goods_data["marks"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
        if 'package_count' in goods_data:
            content = re.sub(
                r'(<includedConsignmentItem>.*?<goodsUnitQuantity>)[^<]+(</goodsUnitQuantity>)',
                rf'\1{goods_data["package_count"]}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
        if 'packaging_description' in goods_data:
            content = re.sub(
                r'(<includedConsignmentItem>.*?<description>)[^<]+(</description>)',
                rf'\1{re.escape(goods_data["packaging_description"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
        if 'nature' in goods_data:
            content = re.sub(
                r'(<includedConsignmentItem>.*?<natureIdentificationTransportCargo>.*?<description>)[^<]+(</description>)',
                rf'\1{re.escape(goods_data["nature"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
        if 'hs_code' in goods_data:
            content = re.sub(
                r'(<includedConsignmentItem>.*?<harmonizedCommodityCode>)[^<]+(</harmonizedCommodityCode>)',
                rf'\1{re.escape(goods_data["hs_code"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
        if 'gross_weight' in goods_data:
            weight_val = goods_data['gross_weight'].get('value', 0)
            weight_unit = goods_data['gross_weight'].get('unit', 'KGM')
            content = re.sub(
                r'(<grossWeight[^>]*unitId=")[^"]+(">)[^<]+(</grossWeight>)',
                rf'\1{weight_unit}\2{weight_val}\3',
                content,
                count=1
            )
        if 'volume' in goods_data:
            volume_val = goods_data['volume'].get('value', 0)
            volume_unit = goods_data['volume'].get('unit', 'MTQ')
            content = re.sub(
                r'(<grossVolume[^>]*unitId=")[^"]+(">)[^<]+(</grossVolume>)',
                rf'\1{volume_unit}\2{volume_val}\3',
                content,
                count=1
            )
    
    # CMR Field 13: Upute pošiljatelja
    if 'sender_instructions' in data:
        content = re.sub(
            r'(<consignorProvidedInformationText>)[^<]+(</consignorProvidedInformationText>)',
            rf'\1{re.escape(data["sender_instructions"])}\2',
            content,
            count=1
        )
    
    # CMR Field 14: Pouzeće (COD)
    if 'cod_amount' in data:
        cod_val = data['cod_amount'].get('value', 0)
        cod_curr = data['cod_amount'].get('currency', 'EUR')
        content = re.sub(
            r'(<cODAmount[^>]*currencyId=")[^"]+(">)[^<]+(</cODAmount>)',
            rf'\1{cod_curr}\2{cod_val}\3',
            content,
            count=1
        )
    
    # CMR Fields 15, 19, 27, 28: Plaćanje i tarife
    if 'freight_payment' in data:
        content = re.sub(
            r'(<applicableServiceCharge>.*?<paymentArrangementCode>)[^<]+(</paymentArrangementCode>)',
            rf'\1{re.escape(data["freight_payment"])}\2',
            content,
            count=1,
            flags=re.DOTALL
        )
    if 'payment_party' in data:
        content = re.sub(
            r'(<applicableServiceCharge>.*?<payingPartyRoleCode>)[^<]+(</payingPartyRoleCode>)',
            rf'\1{re.escape(data["payment_party"])}\2',
            content,
            count=1,
            flags=re.DOTALL
        )
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
            content = re.sub(
                r'(<applicableServiceCharge>.*?<calculationBasisCode>)[^<]+(</calculationBasisCode>)',
                rf'\1{basis_code}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
        if 'amount' in data['tariff']:
            amt_val = data['tariff']['amount'].get('value', 0)
            amt_curr = data['tariff']['amount'].get('currency', 'EUR')
            content = re.sub(
                r'(<applicableServiceCharge>.*?<appliedAmount[^>]*currencyId=")[^"]+(">)[^<]+(</appliedAmount>)',
                rf'\1{amt_curr}\2{amt_val}\3',
                content,
                count=1,
                flags=re.DOTALL
            )
    
    # CMR Field 20: Posebni sporazumi
    if 'special_agreements' in data:
        content = re.sub(
            r'(<contractTermsText>)[^<]+(</contractTermsText>)',
            rf'\1{re.escape(data["special_agreements"])}\2',
            content,
            count=1
        )
    
    # CMR Fields 25-26: Vozilo (Vehicle)
    if 'vehicle' in data:
        vehicle_data = data['vehicle']
        if 'id' in vehicle_data:
            content = re.sub(
                r'(<mainCarriageTransportMovement>.*?<usedTransportMeans>.*?<id>)[^<]+(</id>)',
                rf'\1{re.escape(vehicle_data["id"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
            # Extract and set country code
            if ' ' in vehicle_data['id']:
                country_code = vehicle_data['id'].split()[0]
                content = re.sub(
                    r'(<mainCarriageTransportMovement>.*?<usedTransportMeans>.*?<registrationCountry>.*?<code>)[^<]+(</code>)',
                    rf'\1{country_code}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
        if 'trailer_id' in vehicle_data:
            content = re.sub(
                r'(<usedTransportEquipment>.*?<id[^>]*>)[^<]+(</id>)',
                rf'\1{re.escape(vehicle_data["trailer_id"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
        if 'model' in vehicle_data:
            content = re.sub(
                r'(<usedTransportEquipment>.*?<categoryCode>)[^<]+(</categoryCode>)',
                rf'\1{re.escape(vehicle_data["model"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
    
    # CMR Field 21: Datum i mjesto izdavanja (Issue Date & Location)
    if 'issue_date' in data:
        formatted_dt = format_datetime(data['issue_date'], '205')
        content = re.sub(
            r'(<associatedDocument>.*?<formattedIssueDateTime[^>]*formatId="205">)[^<]+(</formattedIssueDateTime>)',
            rf'\1{formatted_dt}\2',
            content,
            count=1,
            flags=re.DOTALL
        )
    if 'issue_location' in data:
        loc_data = data['issue_location']
        if 'city' in loc_data:
            content = re.sub(
                r'(<associatedDocument>.*?<issueLocation>.*?<name>)[^<]+(</name>)',
                rf'\1{re.escape(loc_data["city"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
            # Ensure streetName is present in issueLocation postalAddress
            if 'street' in loc_data:
                content = re.sub(
                    r'(<associatedDocument>.*?<issueLocation>.*?<postalAddress>.*?<streetName>)[^<]+(</streetName>)',
                    rf'\1{re.escape(loc_data["street"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            elif 'city' in loc_data:
                # Add streetName if missing (required by schema order)
                content = re.sub(
                    r'(<associatedDocument>.*?<issueLocation>.*?<postalAddress>)',
                    rf'\1\n                <streetName>{re.escape(loc_data["city"])}</streetName>',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'city' in loc_data:
                content = re.sub(
                    r'(<associatedDocument>.*?<issueLocation>.*?<postalAddress>.*?<cityName>)[^<]+(</cityName>)',
                    rf'\1{re.escape(loc_data["city"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
            if 'country' in loc_data:
                content = re.sub(
                    r'(<associatedDocument>.*?<issueLocation>.*?<postalAddress>.*?<countryCode>)[^<]+(</countryCode>)',
                    rf'\1{re.escape(loc_data["country"])}\2',
                    content,
                    count=1,
                    flags=re.DOTALL
                )
    
    # CMR Field 5: Priloženi dokumenti (Attached Documents) - replace first associatedDocument id
    if 'attached_documents' in data and len(data['attached_documents']) > 0:
        doc = data['attached_documents'][0]
        if 'id' in doc:
            content = re.sub(
                r'(<associatedDocument>.*?<id[^>]*>)[^<]+(</id>)',
                rf'\1{re.escape(doc["id"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
        if 'type' in doc:
            content = re.sub(
                r'(<associatedDocument>.*?<contractualClause>.*?<contentText>)[^<]+(</contentText>)',
                rf'\1{re.escape(doc["type"])}\2',
                content,
                count=1,
                flags=re.DOTALL
            )
    
    # CMR Field: eCMR identifier
    if 'ecmr_identifier' in data:
        # Replace first associatedDocument id that doesn't have schemeAgencyId
        content = re.sub(
            r'(<associatedDocument>.*?<id[^>]*>)[^<]+(</id>)',
            rf'\1{re.escape(data["ecmr_identifier"])}\2',
            content,
            count=1,
            flags=re.DOTALL
        )
    
def replace_placeholder_text(content, mode='NORMAL'):
    """
    Replace all placeholder text patterns
    
    Args:
        content: XML content string
        mode: 'NORMAL' for normal consignment or 'ADR' for dangerous goods (ADR) consignment
    """
    # Store selected ADR goods for consistency
    selected_adr_goods = None
    if mode == 'ADR':
        selected_adr_goods = random.choice(ADR_DANGEROUS_GOODS)
    
    # Select consistent entities for the document
    # These will be used to ensure sender, receiver, carrier, and signatures are consistent
    selected_consignor = random.choice(NON_TRANSPORT_COMPANIES)  # Sender - production/retail company
    selected_consignee = random.choice([c for c in NON_TRANSPORT_COMPANIES if c != selected_consignor])  # Receiver - different company
    selected_carrier = random.choice(TRANSPORT_COMPANIES)  # Carrier - transport company
    
    # Select goods type for consistent sender instructions
    if mode == 'ADR':
        selected_goods_description = selected_adr_goods[2] if selected_adr_goods else "Opasne tvari"
    else:
        selected_goods_description = random.choice(NORMAL_GOODS)
    
    # Get matching sender instructions
    sender_instructions_key = selected_goods_description if selected_goods_description in SENDER_INSTRUCTIONS_BY_GOODS else "default"
    selected_sender_instructions = SENDER_INSTRUCTIONS_BY_GOODS.get(sender_instructions_key, SENDER_INSTRUCTIONS_BY_GOODS["default"])
    
    # Select truck and trailer models
    selected_truck = random.choice(TRUCK_MODELS)
    selected_trailer = random.choice(TRAILER_MODELS)
    
    # Replace company names (4-6 lowercase letters in <name> tags, but not in specific contexts)
    # Be careful with name tags - they appear in many contexts
    pattern = r'<name>([a-z]{3,6})</name>'
    companies_iter = iter(CROATIAN_COMPANIES * 50)
    
    def replace_name(match):
        if match.group(1).islower() and len(match.group(1)) <= 6:
            try:
                return f'<name>{next(companies_iter)}</name>'
            except StopIteration:
                return f'<name>{random.choice(CROATIAN_COMPANIES)}</name>'
        return match.group(0)
    
    content = re.sub(pattern, replace_name, content)
    
    # Replace person names in givenName
    pattern = r'<givenName>([a-z]{3,6})</givenName>'
    names_iter = iter(CROATIAN_FIRST_NAMES * 100)
    
    def replace_given_name(match):
        if match.group(1).islower():
            try:
                return f'<givenName>{next(names_iter)}</givenName>'
            except StopIteration:
                return f'<givenName>{random.choice(CROATIAN_FIRST_NAMES)}</givenName>'
        return match.group(0)
    
    content = re.sub(pattern, replace_given_name, content)
    
    # Replace person names in familyName
    pattern = r'<familyName>([a-z]{3,6})</familyName>'
    surnames_iter = iter(CROATIAN_LAST_NAMES * 100)
    
    def replace_family_name(match):
        if match.group(1).islower():
            try:
                return f'<familyName>{next(surnames_iter)}</familyName>'
            except StopIteration:
                return f'<familyName>{random.choice(CROATIAN_LAST_NAMES)}</familyName>'
        return match.group(0)
    
    content = re.sub(pattern, replace_family_name, content)
    
    # Replace personName
    pattern = r'<personName>([a-z]{3,6})</personName>'
    full_names_iter = iter([f"{f} {l}" for f in CROATIAN_FIRST_NAMES for l in CROATIAN_LAST_NAMES[:5]] * 20)
    
    def replace_person_name(match):
        if match.group(1).islower():
            try:
                return f'<personName>{next(full_names_iter)}</personName>'
            except StopIteration:
                f = random.choice(CROATIAN_FIRST_NAMES)
                l = random.choice(CROATIAN_LAST_NAMES)
                return f'<personName>{f} {l}</personName>'
        return match.group(0)
    
    content = re.sub(pattern, replace_person_name, content)
    
    # Replace additionalStreetName
    pattern = r'<additionalStreetName>([a-z]{3,6})</additionalStreetName>'
    streets_iter = iter(CROATIAN_STREETS * 50)
    
    def replace_additional_street(match):
        if match.group(1).islower():
            try:
                return f'<additionalStreetName>{next(streets_iter)}</additionalStreetName>'
            except StopIteration:
                return f'<additionalStreetName>{random.choice(CROATIAN_STREETS)}</additionalStreetName>'
        return match.group(0)
    
    content = re.sub(pattern, replace_additional_street, content)
    
    # Replace buildingNumber (if still placeholder)
    pattern = r'<buildingNumber>([a-z]{3,6})</buildingNumber>'
    
    def replace_building(match):
        if match.group(1).islower():
            return f'<buildingNumber>{random.randint(1, 200)}</buildingNumber>'
        return match.group(0)
    
    content = re.sub(pattern, replace_building, content)
    
    # Replace countrySubDivisionName - but NOT in postal addresses (Croatian addresses don't include županija)
    # We'll handle this more carefully by checking context
    # For now, we'll replace it but note that it should be removed from postal addresses
    # This will be handled separately when processing postal addresses
    pattern = r'<countrySubDivisionName>([a-z]{3,6})</countrySubDivisionName>'
    counties_iter = iter(CROATIAN_COUNTIES * 50)
    
    def replace_county(match):
        if match.group(1).islower():
            try:
                return f'<countrySubDivisionName>{next(counties_iter)}</countrySubDivisionName>'
            except StopIteration:
                return f'<countrySubDivisionName>{random.choice(CROATIAN_COUNTIES)}</countrySubDivisionName>'
        return match.group(0)
    
    content = re.sub(pattern, replace_county, content)
    
    # Remove ALL countrySubDivisionName elements from postal addresses (Croatian addresses format)
    # Croatian addresses do NOT include županija names
    # Also fix element ordering to match schema exactly:
    # Schema order per XSD: additionalStreetName, buildingNumber, cityName, countryCode, 
    # departmentName, postOfficeBox, postcode, streetName
    def fix_postal_address(match):
        postal_block = match.group(0)
        
        # Extract all elements to reorder properly
        elements = {}
        element_patterns = {
            'additionalStreetName': r'<additionalStreetName>.*?</additionalStreetName>',
            'buildingNumber': r'<buildingNumber>.*?</buildingNumber>',
            'cityName': r'<cityName>.*?</cityName>',
            'countryCode': r'<countryCode>.*?</countryCode>',
            'departmentName': r'<departmentName>.*?</departmentName>',
            'postOfficeBox': r'<postOfficeBox>.*?</postOfficeBox>',
            'postcode': r'<postcode>.*?</postcode>',
            'streetName': r'<streetName>.*?</streetName>'
        }
        
        # Extract all elements (using DOTALL to handle multiline)
        for elem_name, pattern in element_patterns.items():
            matches = list(re.finditer(pattern, postal_block, re.DOTALL))
            if matches:
                elements[elem_name] = [m.group(0).strip() for m in matches]
        
        # Find opening tag
        opening_match = re.search(r'<postalAddress[^>]*>', postal_block)
        if not opening_match:
            return postal_block
        
        opening_tag = opening_match.group(0)
        
        # Correct order per XSD schema (xsd:sequence in TradeAddress):
        # 1. additionalStreetName
        # 2. buildingNumber
        # 3. cityName
        # 4. countryCode
        # 5. departmentName
        # 6. postOfficeBox
        # 7. postcode
        # 8. streetName
        order = ['additionalStreetName', 'buildingNumber', 'cityName', 'countryCode', 
                  'departmentName', 'postOfficeBox', 'postcode', 'streetName']
        
        # Rebuild in correct order with proper indentation
        indent = '                '
        rebuilt = opening_tag
        
        for elem_name in order:
            if elem_name in elements:
                for elem_content in elements[elem_name]:
                    # Clean up the element content (remove extra whitespace)
                    cleaned_elem = re.sub(r'\s+', ' ', elem_content).strip()
                    rebuilt += '\n' + indent + cleaned_elem
        
        rebuilt += '\n            </postalAddress>'
        return rebuilt
    
    # Match postalAddress blocks - use non-greedy matching with DOTALL
    # Apply the fix to all postalAddress blocks
    content = re.sub(r'<postalAddress[^>]*>.*?</postalAddress>', fix_postal_address, content, flags=re.DOTALL)
    
    # Fix element structure: crossBorderRegulatoryProcedure should NOT be inside includedConsignmentItem
    # Schema: crossBorderRegulatoryProcedure is at consignment level, NOT inside SupplyChainConsignmentItem
    # Also remove invalid quotaID elements from crossBorderRegulatoryProcedure (not in schema)
    
    # First, remove quotaID from all regulatoryProcedure and crossBorderRegulatoryProcedure elements
    # quotaID is not a valid element in CrossBorderRegulatoryProcedure schema
    def remove_quota_id_from_regulatory(match):
        elem = match.group(0)
        # Remove quotaID elements - match across lines
        cleaned = re.sub(r'\s*<quotaID[^>]*>.*?</quotaID>\s*', '', elem, flags=re.DOTALL)
        return cleaned
    
    # Clean all regulatoryProcedure and crossBorderRegulatoryProcedure elements first
    content = re.sub(r'<regulatoryProcedure>.*?</regulatoryProcedure>', remove_quota_id_from_regulatory, content, flags=re.DOTALL)
    content = re.sub(r'<crossBorderRegulatoryProcedure>.*?</crossBorderRegulatoryProcedure>', remove_quota_id_from_regulatory, content, flags=re.DOTALL)
    
    # Now extract crossBorderRegulatoryProcedure from inside includedConsignmentItem
    cross_border_pattern = r'<crossBorderRegulatoryProcedure>.*?</crossBorderRegulatoryProcedure>'
    
    def extract_cross_border_from_item(match):
        item_block = match.group(0)
        
        # Find crossBorderRegulatoryProcedure elements inside this item
        cross_border_matches = list(re.finditer(cross_border_pattern, item_block, re.DOTALL))
        
        if not cross_border_matches:
            # No crossBorderRegulatoryProcedure in this item, return as-is
            return item_block
        
        # Remove crossBorderRegulatoryProcedure elements from the item (remove from end to start)
        cross_border_elements = [(m.start(), m.end(), m.group(0)) for m in cross_border_matches]
        cleaned_block = item_block
        for start, end, elem in sorted(cross_border_elements, key=lambda x: x[0], reverse=True):
            cleaned_block = cleaned_block[:start] + cleaned_block[end:]
        
        # Store extracted elements globally (we'll add them to a list)
        if not hasattr(extract_cross_border_from_item, 'extracted_elements'):
            extract_cross_border_from_item.extracted_elements = []
        extract_cross_border_from_item.extracted_elements.extend([elem for _, _, elem in cross_border_elements])
        
        return cleaned_block
    
    # Initialize the extracted elements list
    extract_cross_border_from_item.extracted_elements = []
    
    # Extract crossBorderRegulatoryProcedure from all includedConsignmentItem blocks
    content = re.sub(r'<includedConsignmentItem>.*?</includedConsignmentItem>', extract_cross_border_from_item, content, flags=re.DOTALL)
    
    # Add extracted crossBorderRegulatoryProcedure elements at the consignment level
    # Rename to regulatoryProcedure (correct schema element name)
    # Schema order: regulatoryProcedure comes before transshipmentPermittedIndicator, which comes before usedTransportEquipment
    # So we place regulatoryProcedure before transshipmentPermittedIndicator (or before usedTransportEquipment if no transshipmentPermittedIndicator)
    if extract_cross_border_from_item.extracted_elements:
        # Rename crossBorderRegulatoryProcedure to regulatoryProcedure
        renamed_elements = []
        for elem in extract_cross_border_from_item.extracted_elements:
            renamed_elem = elem.replace('<crossBorderRegulatoryProcedure>', '<regulatoryProcedure>')
            renamed_elem = renamed_elem.replace('</crossBorderRegulatoryProcedure>', '</regulatoryProcedure>')
            renamed_elements.append(renamed_elem)
        
        # Find where to insert regulatoryProcedure elements
        # Schema order: regulatoryProcedure (line 13180) comes after preCarriageTransportMovement (line 13164)
        # and before specifiedTransportMovement (line 13199)
        # Strategy: Find the last </preCarriageTransportMovement> or last </regulatoryProcedure> and insert after it
        pre_carriage_end_pattern = r'</preCarriageTransportMovement>'
        regulatory_end_pattern = r'</regulatoryProcedure>'
        
        # Find all matches
        pre_carriage_matches = list(re.finditer(pre_carriage_end_pattern, content))
        regulatory_matches = list(re.finditer(regulatory_end_pattern, content))
        
        if regulatory_matches:
            # Insert after the last existing regulatoryProcedure
            match = regulatory_matches[-1]
            insert_pos = match.end()
        elif pre_carriage_matches:
            # Insert after the last preCarriageTransportMovement
            match = pre_carriage_matches[-1]
            insert_pos = match.end()
        else:
            # No suitable insertion point found, place before closing </consignment>
            match = None
        
        if match:
            before_insert = content[:insert_pos].rstrip()
            after_insert = content[insert_pos:]
            indent = '    '
            rebuilt = before_insert
            for elem in renamed_elements:
                rebuilt += '\n' + indent + elem.strip()
            rebuilt += '\n' + after_insert
            content = rebuilt
        else:
            # No suitable insertion point found, place before closing </consignment>
            closing_consignment_pos = content.rfind('</consignment>')
            if closing_consignment_pos != -1:
                before_closing = content[:closing_consignment_pos].rstrip()
                after_closing = content[closing_consignment_pos:]
                indent = '    '
                rebuilt = before_closing
                for elem in renamed_elements:
                    rebuilt += '\n' + indent + elem.strip()
                rebuilt += '\n' + after_closing
                content = rebuilt
    
    # Fix element ordering at the consignment level
    # Schema requires: all transportDangerousGoods must come BEFORE all crossBorderRegulatoryProcedure
    # This handles transportDangerousGoods and crossBorderRegulatoryProcedure that are direct children of consignment
    def fix_consignment_ordering(match):
        consignment_block = match.group(0)
        
        # Extract all transportDangerousGoods elements (direct children of consignment, not inside includedConsignmentItem)
        # We need to match transportDangerousGoods that are NOT inside includedConsignmentItem
        # Strategy: temporarily mark includedConsignmentItem blocks, extract transportDangerousGoods, then restore
        
        # First, protect includedConsignmentItem blocks
        protected_blocks = []
        protected_pattern = r'<includedConsignmentItem>.*?</includedConsignmentItem>'
        protected_matches = list(re.finditer(protected_pattern, consignment_block, re.DOTALL))
        
        protected_content = consignment_block
        for i, m in enumerate(protected_matches):
            placeholder = f'__PROTECTED_BLOCK_{i}__'
            protected_blocks.append(m.group(0))
            protected_content = protected_content.replace(m.group(0), placeholder, 1)
        
        # Now extract transportDangerousGoods and crossBorderRegulatoryProcedure from unprotected content
        transport_dangerous_pattern = r'<transportDangerousGoods>.*?</transportDangerousGoods>'
        cross_border_pattern = r'<crossBorderRegulatoryProcedure>.*?</crossBorderRegulatoryProcedure>'
        
        transport_dangerous_matches = list(re.finditer(transport_dangerous_pattern, protected_content, re.DOTALL))
        cross_border_matches = list(re.finditer(cross_border_pattern, protected_content, re.DOTALL))
        
        if not transport_dangerous_matches or not cross_border_matches:
            # No ordering issue, restore and return
            for i, block in enumerate(protected_blocks):
                protected_content = protected_content.replace(f'__PROTECTED_BLOCK_{i}__', block, 1)
            return protected_content
        
        # Check if any crossBorderRegulatoryProcedure appears before the last transportDangerousGoods
        if cross_border_matches[0].start() < transport_dangerous_matches[-1].end():
            # Need to reorder: remove both types, then add transportDangerousGoods first, then crossBorderRegulatoryProcedure
            transport_elements = [m.group(0) for m in transport_dangerous_matches]
            cross_border_elements = [m.group(0) for m in cross_border_matches]
            
            # Remove all elements
            for elem in transport_elements + cross_border_elements:
                protected_content = protected_content.replace(elem, '', 1)
            
            # Find insertion point (before first crossBorderRegulatoryProcedure that was there, or at end before closing consignment tag)
            # Actually, we want to insert after the last non-protected element before the closing tag
            closing_pos = protected_content.rfind('</consignment>')
            if closing_pos == -1:
                # Restore and return if we can't find closing tag
                for i, block in enumerate(protected_blocks):
                    protected_content = protected_content.replace(f'__PROTECTED_BLOCK_{i}__', block, 1)
                return protected_content
            
            # Find a good insertion point - before the closing tag, after any protected blocks
            before_closing = protected_content[:closing_pos].rstrip()
            after_closing = protected_content[closing_pos:]
            
            # Rebuild with correct order
            indent = '    '
            rebuilt = before_closing
            for elem in transport_elements:
                rebuilt += '\n' + indent + elem.strip()
            for elem in cross_border_elements:
                rebuilt += '\n' + indent + elem.strip()
            rebuilt += '\n' + after_closing
            
            # Restore protected blocks
            for i, block in enumerate(protected_blocks):
                rebuilt = rebuilt.replace(f'__PROTECTED_BLOCK_{i}__', block, 1)
            
            return rebuilt
        
        # No reordering needed, restore and return
        for i, block in enumerate(protected_blocks):
            protected_content = protected_content.replace(f'__PROTECTED_BLOCK_{i}__', block, 1)
        return protected_content
    
    # Apply fix to consignment blocks (match the entire consignment element)
    content = re.sub(r'<consignment[^>]*>.*?</consignment>', fix_consignment_ordering, content, flags=re.DOTALL)
    
    # Replace departmentName
    pattern = r'<departmentName>([a-z]{3,6})</departmentName>'
    departments = ["Odjel prodaje", "Odjel logistike", "Odjel transporta", 
                  "Skladište", "Administracija", "Financije"]
    
    def replace_department(match):
        if match.group(1).islower():
            return f'<departmentName>{random.choice(departments)}</departmentName>'
        return match.group(0)
    
    content = re.sub(pattern, replace_department, content)
    
    # Replace postOfficeBox (usually empty or specific format)
    pattern = r'<postOfficeBox>([a-z]{3,6})</postOfficeBox>'
    
    def replace_pobox(match):
        if match.group(1).islower():
            # Most Croatian addresses don't use PO boxes, but some do
            if random.random() < 0.3:
                return f'<postOfficeBox>PO Box {random.randint(100, 999)}</postOfficeBox>'
            else:
                return '<postOfficeBox></postOfficeBox>'
        return match.group(0)
    
    content = re.sub(pattern, replace_pobox, content)
    
    # Replace postcode (if still placeholder) - will be matched with city later
    pattern = r'<postcode>([a-z]{3,6})</postcode>'
    codes_iter = iter(CROATIAN_POSTAL_CODES * 50)
    
    def replace_postcode(match):
        if match.group(1).islower():
            try:
                return f'<postcode>{next(codes_iter)}</postcode>'
            except StopIteration:
                return f'<postcode>{random.choice(CROATIAN_POSTAL_CODES)}</postcode>'
        return match.group(0)
    
    content = re.sub(pattern, replace_postcode, content)
    
    # Replace streetName (if still placeholder)
    pattern = r'<streetName>([a-z]{3,6})</streetName>'
    streets_iter2 = iter(CROATIAN_STREETS * 50)
    
    def replace_street(match):
        if match.group(1).islower():
            try:
                return f'<streetName>{next(streets_iter2)}</streetName>'
            except StopIteration:
                return f'<streetName>{random.choice(CROATIAN_STREETS)}</streetName>'
        return match.group(0)
    
    content = re.sub(pattern, replace_street, content)
    
    # Replace telephone numbers
    pattern = r'<completeNumber>([a-z]{3,6})</completeNumber>'
    
    def replace_phone(match):
        if match.group(1).islower():
            return f'<completeNumber>{generate_croatian_phone()}</completeNumber>'
        return match.group(0)
    
    content = re.sub(pattern, replace_phone, content)
    
    # Replace email addresses (in emailAddress context)
    email_pattern = r'(<emailAddress>\s*<completeNumber>)([a-z]{3,6})(</completeNumber>)'
    
    def replace_email(match):
        if match.group(2).islower():
            return f'{match.group(1)}{generate_croatian_email()}{match.group(3)}'
        return match.group(0)
    
    content = re.sub(email_pattern, replace_email, content)
    
    # Replace goods descriptions - mode-specific
    pattern = r'<description>([a-z]{3,6})</description>'
    
    def replace_description(match):
        if match.group(1).islower():
            if mode == 'ADR' and selected_adr_goods:
                # Use consistent ADR goods description
                return f'<description>{selected_adr_goods[2]}</description>'
            else:
                # Use normal goods
                return f'<description>{random.choice(NORMAL_GOODS)}</description>'
        return match.group(0)
    
    content = re.sub(pattern, replace_description, content)
    
    # Replace markingText (shipping marks) - mode-specific
    marking_pattern = r'<markingText>([a-z]{3,6})</markingText>'
    NORMAL_MARKINGS = [
        "HR-EXP", "HR-IMP", "FRAGILE", "HANDLE WITH CARE", "TOP", "THIS SIDE UP",
        "KEEP DRY", "DO NOT STACK"
    ]
    ADR_MARKINGS = [
        "ADR", "DANGEROUS GOODS", "HAZARDOUS MATERIAL", "KEEP AWAY FROM HEAT",
        "NO SMOKING", "FLAMMABLE", "CORROSIVE", "TOXIC", "EXPLOSIVE"
    ]
    
    def replace_marking(match):
        if match.group(1).islower():
            if mode == 'ADR':
                return f'<markingText>{random.choice(ADR_MARKINGS)}</markingText>'
            else:
                return f'<markingText>{random.choice(NORMAL_MARKINGS)}</markingText>'
        return match.group(0)
    
    content = re.sub(marking_pattern, replace_marking, content)
    
    # Replace hazardClassificationID - UN dangerous goods classification codes
    # Only for ADR mode, and use consistent UN code
    hazard_pattern = r'<hazardClassificationID[^>]*>([a-z]{3,6})</hazardClassificationID>'
    
    def replace_hazard(match):
        if match.group(1).islower():
            if mode == 'ADR' and selected_adr_goods:
                # Use consistent UN code matching the selected goods
                return f'{match.group(0).split(">")[0]}>{selected_adr_goods[0]}</hazardClassificationID>'
            else:
                # For normal mode, don't set hazard codes (or remove if present)
                return ''  # Remove hazard classification for normal goods
        return match.group(0)
    
    content = re.sub(hazard_pattern, replace_hazard, content)
    
    # Replace properShippingName - proper shipping names for dangerous goods
    # Only for ADR mode, and use consistent shipping name
    shipping_name_pattern = r'<properShippingName>([a-z]{3,6})</properShippingName>'
    
    def replace_shipping_name(match):
        if match.group(1).islower():
            if mode == 'ADR' and selected_adr_goods:
                # Use consistent proper shipping name
                return f'<properShippingName>{selected_adr_goods[1]}</properShippingName>'
            else:
                # For normal mode, don't set proper shipping name
                return ''  # Remove proper shipping name for normal goods
        return match.group(0)
    
    content = re.sub(shipping_name_pattern, replace_shipping_name, content)
    
    # Replace contract terms
    pattern = r'<contractTermsText>([a-z]{3,6})</contractTermsText>'
    
    def replace_contract_terms(match):
        if match.group(1).islower():
            return f'<contractTermsText>{random.choice(CONTRACT_TERMS)}</contractTermsText>'
        return match.group(0)
    
    content = re.sub(pattern, replace_contract_terms, content)
    
    # Replace information texts - use sender instructions that match the goods type
    # Avoid contradictions like "Električni uređaji" when goods are "Tekstilni proizvodi"
    pattern = r'<consignorProvidedInformationText>([a-z]{3,6})</consignorProvidedInformationText>'
    
    def replace_info_text(match):
        if match.group(1).islower():
            # Use consistent sender instructions based on selected goods
            instruction = random.choice(selected_sender_instructions)
            return f'<consignorProvidedInformationText>{instruction}</consignorProvidedInformationText>'
        return match.group(0)
    
    content = re.sub(pattern, replace_info_text, content)
    
    # Also fix any existing contradictory sender instructions
    # If goods are "Tekstilni proizvodi", remove mentions of "Električni uređaji" and "Namještaj"
    if "Tekstilni" in selected_goods_description or "tekstilni" in selected_goods_description.lower():
        content = re.sub(r'<consignorProvidedInformationText>Električni uređaji[^<]*</consignorProvidedInformationText>',
                        f'<consignorProvidedInformationText>{random.choice(selected_sender_instructions)}</consignorProvidedInformationText>', content)
        content = re.sub(r'<consignorProvidedInformationText>Namještaj[^<]*</consignorProvidedInformationText>',
                        f'<consignorProvidedInformationText>{random.choice(selected_sender_instructions)}</consignorProvidedInformationText>', content)
    
    # Replace border clearance instructions
    pattern = r'<description>([a-z]{3,6})</description>'
    # This might match goods descriptions too, but we'll handle it
    
    # Replace contentText in contractualClause
    pattern = r'(<contractualClause>\s*<contentText>)([a-z]{3,6})(</contentText>)'
    
    def replace_content_text(match):
        if match.group(2).islower():
            texts = ["Bez posebnih napomena", "Standardni uvjeti", 
                    "Roba pakirana prema specifikaciji", "Potrebna pažljiva rukovanje"]
            return f'{match.group(1)}{random.choice(texts)}{match.group(3)}'
        return match.group(0)
    
    content = re.sub(pattern, replace_content_text, content)
    
    # Replace standalone contentText elements (not in contractualClause)
    pattern = r'(<contentText>)([a-z]{3,6})(</contentText>)'
    
    def replace_standalone_content_text(match):
        if match.group(2).islower():
            texts = ["Bez posebnih napomena", "Standardni uvjeti", 
                    "Roba pakirana prema specifikaciji", "Potrebna pažljiva rukovanje",
                    "Bez napomena", "Fragilno", "Toplinski osjetljivo"]
            return f'{match.group(1)}{random.choice(texts)}{match.group(3)}'
        return match.group(0)
    
    content = re.sub(pattern, replace_standalone_content_text, content)
    
    # Replace IDs (schemeAgencyId with placeholder values)
    # Be careful - some IDs might be legitimate
    pattern = r'schemeAgencyId="([a-z]{5,6})"'
    
    def replace_scheme_id(match):
        if match.group(1).islower() and len(match.group(1)) >= 5:
            schemes = ["HR-OIB", "HR-MBS", "HR-REG", "HR-TAX", "HR-CUSTOMS"]
            return f'schemeAgencyId="{random.choice(schemes)}"'
        return match.group(0)
    
    content = re.sub(pattern, replace_scheme_id, content)
    
    # Replace placeholder IDs (4-6 lowercase letters)
    pattern = r'<id schemeAgencyId="[^"]*">([a-z]{4,6})</id>'
    
    def replace_id(match):
        if match.group(1).islower():
            return f'<id schemeAgencyId="HR-REG">{generate_realistic_id()}</id>'
        return match.group(0)
    
    content = re.sub(pattern, replace_id, content)
    
    # Replace information fields
    pattern = r'<information>([a-z]{3,6})</information>'
    
    def replace_information(match):
        if match.group(1).islower():
            info_texts = ["Bez napomena", "Fragilno", "Toplinski osjetljivo", 
                         "Zaštita od vlage", "Ne okretati"]
            return f'<information>{random.choice(info_texts)}</information>'
        return match.group(0)
    
    content = re.sub(pattern, replace_information, content)
    
    # Replace calculationBasisCode - use tariff calculation basis (not VOLUME for tariff display)
    pattern = r'<calculationBasisCode>([a-z]{3,6})</calculationBasisCode>'
    
    def replace_calc_basis(match):
        if match.group(1).islower():
            return f'<calculationBasisCode>{random.choice(TARIFF_CALCULATION_BASIS)}</calculationBasisCode>'
        return match.group(0)
    
    content = re.sub(pattern, replace_calc_basis, content)
    
    # Replace existing VOLUME in calculationBasisCode with valid tariff basis
    content = re.sub(r'<calculationBasisCode>VOLUME</calculationBasisCode>', 
                     f'<calculationBasisCode>{random.choice(TARIFF_CALCULATION_BASIS)}</calculationBasisCode>', content)
    
    # Replace categoryTypeCode
    pattern = r'<categoryTypeCode>([a-z]{3,6})</categoryTypeCode>'
    
    def replace_category_type(match):
        if match.group(1).islower():
            codes = ["STANDARD", "EXPRESS", "REFRIGERATED", "HAZARDOUS", "OVERSIZED"]
            return f'<categoryTypeCode>{random.choice(codes)}</categoryTypeCode>'
        return match.group(0)
    
    content = re.sub(pattern, replace_category_type, content)
    
    # Replace payingPartyRoleCode - use valid payment party roles (not LOADER)
    pattern = r'<payingPartyRoleCode>([a-z]{3,6})</payingPartyRoleCode>'
    
    def replace_paying_role(match):
        if match.group(1).islower():
            return f'<payingPartyRoleCode>{random.choice(VALID_PAYMENT_PARTY_ROLES)}</payingPartyRoleCode>'
        return match.group(0)
    
    content = re.sub(pattern, replace_paying_role, content)
    
    # Also replace existing LOADER with valid payment party
    content = re.sub(r'<payingPartyRoleCode>LOADER</payingPartyRoleCode>', 
                     f'<payingPartyRoleCode>{random.choice(VALID_PAYMENT_PARTY_ROLES)}</payingPartyRoleCode>', content)
    
    # Replace paymentArrangementCode
    pattern = r'<paymentArrangementCode>([a-z]{3,6})</paymentArrangementCode>'
    
    def replace_payment_arr(match):
        if match.group(1).islower():
            return f'<paymentArrangementCode>{random.choice(PAYMENT_CODES)}</paymentArrangementCode>'
        return match.group(0)
    
    content = re.sub(pattern, replace_payment_arr, content)
    
    # Replace statementCode
    pattern = r'<statementCode>([a-z]{3,6})</statementCode>'
    
    def replace_statement(match):
        if match.group(1).islower():
            return f'<statementCode>{random.choice(STATEMENT_CODES)}</statementCode>'
        return match.group(0)
    
    content = re.sub(pattern, replace_statement, content)
    
    # Replace typeCode
    pattern = r'<typeCode>([a-z]{3,6})</typeCode>'
    
    def replace_type_code(match):
        if match.group(1).islower():
            return f'<typeCode>{random.choice(TYPE_CODES)}</typeCode>'
        return match.group(0)
    
    content = re.sub(pattern, replace_type_code, content)
    
    # Replace currencyId attributes
    pattern = r'currencyId="([A-Z]{3})"'
    # Only replace if it's a placeholder-like code (not standard currency codes)
    standard_currencies = ["EUR", "USD", "GBP", "HRK", "CHF", "JPY", "CNY"]
    
    def replace_currency(match):
        curr = match.group(1)
        if curr not in standard_currencies and len(curr) == 3:
            return f'currencyId="{random.choice(CURRENCY_CODES)}"'
        return match.group(0)
    
    content = re.sub(pattern, replace_currency, content)
    
    # Replace unitId attributes
    # Note: Different fields have different restrictions:
    # - Weight/duration measures: GRM, KGM, TNE for weights, DAY for durations
    # - Other fields: various codes
    # Replace both lowercase placeholders AND invalid codes like MTQ
    
    # First, handle latitude/longitude (they need DEG, DCM, or DD) - must come before general unitId replacement
    lat_long_pattern = r'(<(?:latitude|longitude)[^>]*unitId=")([^"]+)(")'
    LAT_LONG_UNIT_CODES = ["DEG", "DCM", "DD"]  # Degrees, Decimal Minutes, Decimal Degrees
    def replace_lat_long_unit(match):
        unit = match.group(2)
        # Replace if it's not a valid coordinate unit
        if unit not in LAT_LONG_UNIT_CODES:
            return f'{match.group(1)}{random.choice(LAT_LONG_UNIT_CODES)}{match.group(3)}'
        return match.group(0)
    content = re.sub(lat_long_pattern, replace_lat_long_unit, content)
    
    # Second, handle duration measures (they need DAY) - match any DurationMeasure element
    duration_pattern = r'(<(?:maximum|minimum)?[Dd]uration[Mm]easure[^>]*unitId=")([^"]+)(")'
    def replace_duration_unit(match):
        unit = match.group(2)
        if unit != "DAY":
            return f'{match.group(1)}DAY{match.group(3)}'
        return match.group(0)
    content = re.sub(duration_pattern, replace_duration_unit, content)
    
    # Then handle weight-related elements - they MUST use GRM, KGM, or TNE
    # Weight elements: weightMeasure, netWeight, grossWeight, explosiveCargoNetWeight, 
    # netGoodsWeightMeasure, verifiedGrossWeight, grossGoodsWeightMeasure
    weight_pattern = r'(<(?:weightMeasure|netWeight|grossWeight|explosiveCargoNetWeight|netGoodsWeightMeasure|verifiedGrossWeight|grossGoodsWeightMeasure)[^>]*unitId=")([^"]+)(")'
    def replace_weight_unit(match):
        unit = match.group(2)
        # Weight elements must use GRM, KGM, or TNE - replace MTQ or any invalid code
        if unit not in RESTRICTED_UNIT_CODES:
            # Weight elements must use GRM, KGM, or TNE (MTQ is for volume, not weight!)
            return f'{match.group(1)}{random.choice(RESTRICTED_UNIT_CODES)}{match.group(3)}'
        return match.group(0)
    content = re.sub(weight_pattern, replace_weight_unit, content, flags=re.IGNORECASE)
    
    # Handle volume-related elements - they can use MTQ or LTR
    # Volume elements: volumeMeasure, grossVolume, netGoodsVolumeMeasure, grossGoodsVolumeMeasure
    volume_pattern = r'(<(?:volumeMeasure|grossVolume|netGoodsVolumeMeasure|grossGoodsVolumeMeasure)[^>]*unitId=")([^"]+)(")'
    VOLUME_UNIT_CODES = ["MTQ", "LTR"]
    def replace_volume_unit(match):
        unit = match.group(2)
        if unit not in VOLUME_UNIT_CODES:
            # Volume elements can use MTQ or LTR
            return f'{match.group(1)}{random.choice(VOLUME_UNIT_CODES)}{match.group(3)}'
        return match.group(0)
    content = re.sub(volume_pattern, replace_volume_unit, content)
    
    # Handle other unitId attributes - replace lowercase placeholders
    # Note: This will NOT match weight/volume/latitude/longitude/duration as they were already processed above
    pattern = r'unitId="([a-z]{3,6})"'
    
    def replace_unit_id(match):
        unit = match.group(1)
        if unit.islower():
            # For other fields, use restricted codes for safety (GRM, KGM, TNE are valid for weight/measure fields)
            return f'unitId="{random.choice(RESTRICTED_UNIT_CODES)}"'
        return match.group(0)
    
    content = re.sub(pattern, replace_unit_id, content)
    
    # Replace uRI elements with schemeAgencyId
    pattern = r'(<uRI schemeAgencyId="[^"]*">)([a-z]{3,6})(</uRI>)'
    
    def replace_uri(match):
        if match.group(2).islower():
            # Generate realistic URI based on scheme (max 35 characters)
            schemes = ["HR-OIB", "HR-MBS", "HR-REG", "HR-TAX", "HR-CUSTOMS"]
            scheme = random.choice(schemes)
            # Keep URI under 35 characters: "https://ex.hr/scheme/123456" format
            uri_value = f"https://ex.hr/{scheme.lower()[:6]}/{random.randint(100000, 999999)}"
            # Ensure it's exactly 35 or less
            if len(uri_value) > 35:
                uri_value = f"https://ex.hr/{random.randint(100000, 999999)}"
            return f'{match.group(1)}{uri_value}{match.group(3)}'
        return match.group(0)
    
    content = re.sub(pattern, replace_uri, content)
    
    # Replace UUIDs in id elements with schemeAgencyId (must be max 17 characters)
    # Pattern: <ns0:id schemeAgencyId="...">UUID-36-chars</ns0:id> or <id schemeAgencyId="...">UUID-36-chars</id>
    pattern = r'(<[^:]*:?id\s+schemeAgencyId="[^"]*">)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(</[^:]*:?id>)'
    
    def replace_uuid_in_id(match):
        # Generate shorter ID (max 17 chars): "HR-123456" format
        scheme_prefix = "HR"
        # Generate ID: HR-XXXXXX (max 9 chars, well under 17)
        id_value = f"{scheme_prefix}-{random.randint(100000, 999999)}"
        return f'{match.group(1)}{id_value}{match.group(2)}'
    
    content = re.sub(pattern, replace_uuid_in_id, content, flags=re.IGNORECASE)
    
    # Replace standalone id elements (without schemeAgencyId)
    pattern = r'<id>([a-z]{3,6})</id>'
    
    def replace_standalone_id(match):
        if match.group(1).islower():
            return f'<id>{generate_realistic_id()}</id>'
        return match.group(0)
    
    content = re.sub(pattern, replace_standalone_id, content)
    
    # Replace cityName if still placeholder
    # Also ensure postal code matches the city
    pattern = r'<cityName>([a-z]{3,6})</cityName>'
    cities_iter = iter(CROATIAN_CITIES * 50)
    
    def replace_city(match):
        if match.group(1).islower():
            try:
                city = next(cities_iter)
            except StopIteration:
                city = random.choice(CROATIAN_CITIES)
            return f'<cityName>{city}</cityName>'
        return match.group(0)
    
    content = re.sub(pattern, replace_city, content)
    
    # Match city and postal code pairs in postal addresses and ensure they match
    # This regex finds cityName followed by postcode in postal addresses
    postal_city_postcode_pattern = r'(<postalAddress>.*?<cityName>)([^<]+)(</cityName>.*?<postcode>)([^<]+)(</postcode>.*?</postalAddress>)'
    
    def match_city_postcode(match):
        city = match.group(2).strip()
        current_postcode = match.group(4).strip()
        
        # If city is in our mapping, use the correct postal code
        if city in CITY_TO_POSTAL_CODE:
            correct_postcode = CITY_TO_POSTAL_CODE[city]
            return f'{match.group(1)}{city}{match.group(3)}{correct_postcode}{match.group(5)}'
        # If postcode looks like a placeholder (lowercase), assign based on city or random
        elif current_postcode.islower() or len(current_postcode) < 5:
            if city in CITY_TO_POSTAL_CODE:
                correct_postcode = CITY_TO_POSTAL_CODE[city]
            else:
                correct_postcode = random.choice(CROATIAN_POSTAL_CODES)
            return f'{match.group(1)}{city}{match.group(3)}{correct_postcode}{match.group(5)}'
        
        return match.group(0)
    
    content = re.sub(postal_city_postcode_pattern, match_city_postcode, content, flags=re.DOTALL)
    
    return content

def main():
    import sys
    import os
    import uuid as uuid_lib
    from xml.dom import minidom
    
    # Default input file - use the working template if it exists, otherwise fall back to original
    if os.path.exists('648f1295-6df2-4a39-a28c-b7c762950a2a.xml'):
        input_file = '648f1295-6df2-4a39-a28c-b7c762950a2a.xml'  # Use successful template
    elif os.path.exists('consignment_HR_realistic.xml'):
        input_file = 'consignment_HR_realistic.xml'
    else:
        input_file = '12345678-ab12-4ab6-8999-123456789abc.xml'
    dataset_uuid = None
    mode = 'NORMAL'  # Default mode
    data_file = None  # JSON data file for MINIMAL mode
    
    # Parse command line arguments
    # Usage: python script.py [--mode NORMAL|ADR|MINIMAL] [--data-file data.json] [input_file.xml] [--uuid UUID]
    # Or: python script.py [input_file.xml] [UUID] [--mode NORMAL|ADR|MINIMAL] [--data-file data.json]
    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i]
        if arg == '--mode' and i + 1 < len(sys.argv):
            mode = sys.argv[i + 1].upper()
            if mode not in ['NORMAL', 'ADR', 'MINIMAL']:
                print(f"Error: Invalid mode '{sys.argv[i + 1]}'. Must be 'NORMAL', 'ADR', or 'MINIMAL'")
                sys.exit(1)
            i += 2
        elif arg == '--data-file' and i + 1 < len(sys.argv):
            data_file = sys.argv[i + 1]
            i += 2
        elif arg == '--uuid' and i + 1 < len(sys.argv):
            dataset_uuid = sys.argv[i + 1]
            i += 2
        elif arg.startswith('--'):
            # Skip other flags
            i += 1
        elif not arg.startswith('-'):
            # This is likely the input file
            if not input_file or input_file == '12345678-ab12-4ab6-8999-123456789abc.xml':
                input_file = arg
            # Check if it's a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
            elif re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', arg, re.IGNORECASE):
                dataset_uuid = arg
            i += 1
        else:
            i += 1
    
    # Validate MINIMAL mode requirements
    if mode == 'MINIMAL':
        if not data_file:
            print("Error: MINIMAL mode requires --data-file parameter")
            print("Usage: python generate_realistic_croatian_data.py --mode MINIMAL --data-file data.json [--uuid UUID]")
            sys.exit(1)
        if not os.path.exists(data_file):
            print(f"Error: Data file not found: {data_file}")
            sys.exit(1)
    
    # Interactive mode selection if not provided via command line
    if mode == 'NORMAL' and '--mode' not in ' '.join(sys.argv):
        print("\n" + "="*60)
        print("XML Generation Mode Selection")
        print("="*60)
        print("1. NORMAL - Regular consignment with normal goods")
        print("   - No dangerous goods")
        print("   - Realistic normal transport data")
        print("   - No multimodal transport")
        print()
        print("2. ADR - Dangerous goods consignment (ADR regulations)")
        print("   - Proper UN codes matching goods descriptions")
        print("   - ADR hazard classifications")
        print("   - All required ADR information")
        print()
        print("3. MINIMAL - Generate minimal XML from JSON data file")
        print("   - Only specified fields are populated")
        print("   - Requires --data-file parameter")
        print("   - Rest of XML remains empty")
        print("="*60)
        while True:
            choice = input("\nSelect mode (1 for NORMAL, 2 for ADR, 3 for MINIMAL, or 'n'/'a'/'m'): ").strip().lower()
            if choice in ['1', 'n', 'normal']:
                mode = 'NORMAL'
                break
            elif choice in ['2', 'a', 'adr']:
                mode = 'ADR'
                break
            elif choice in ['3', 'm', 'minimal']:
                mode = 'MINIMAL'
                if not data_file:
                    data_file = input("Enter path to JSON data file: ").strip()
                    if not os.path.exists(data_file):
                        print(f"Error: Data file not found: {data_file}")
                        sys.exit(1)
                break
            else:
                print("Invalid choice. Please enter 1, 2, 3, 'n', 'a', or 'm'.")
    
    # Generate UUID if not provided
    if not dataset_uuid:
        dataset_uuid = str(uuid_lib.uuid4())
        print(f"\nNo UUID provided, generated new UUID v4: {dataset_uuid}")
    else:
        # Validate UUID v4 format (required by portal: third segment starts with '4', fourth segment starts with 8/9/a/A/b/B)
        uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}$'
        if not re.match(uuid_pattern, dataset_uuid, re.IGNORECASE):
            print(f"Warning: Provided UUID '{dataset_uuid}' does not match UUID v4 format required by portal!")
            print(f"Portal requires: third segment starts with '4', fourth segment starts with 8/9/a/A/b/B")
            print(f"Generating a new valid UUID v4 instead...")
            dataset_uuid = str(uuid_lib.uuid4())
            print(f"Generated new UUID v4: {dataset_uuid}")
        else:
            print(f"Using provided UUID v4: {dataset_uuid}")
    
    # Generate output filename with UUID
    output_file = f'{dataset_uuid}.xml'
    
    # Handle MINIMAL mode separately
    if mode == 'MINIMAL':
        print(f"\n{'='*60}")
        print(f"Mode: MINIMAL")
        print("Generating minimal XML from JSON data file:")
        print(f"  - Data file: {data_file}")
        print("  - Only specified fields will be populated")
        print("  - Rest of XML will be empty")
        print(f"{'='*60}\n")
        
        # Read JSON data file
        print(f"Reading data file: {data_file}...")
        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in data file: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"Error reading data file: {e}")
            sys.exit(1)
        
        # Generate minimal XML
        print("Generating minimal XML from data...")
        content = generate_minimal_xml(data, dataset_uuid)
        
    else:
        # NORMAL or ADR mode - use existing template-based approach
        if not os.path.exists(input_file):
            print(f"Error: Input file '{input_file}' not found!")
            print(f"Usage: python {sys.argv[0]} [input_file.xml] [UUID]")
            print(f"   or: python {sys.argv[0]} [input_file.xml] [--uuid UUID]")
            sys.exit(1)
        
        print(f"Reading {input_file}...")
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print(f"\n{'='*60}")
        print(f"Mode: {mode}")
        if mode == 'ADR':
            print("Generating ADR (Dangerous Goods) consignment with:")
            print("  - Proper UN codes matching goods descriptions")
            print("  - ADR hazard classifications")
            print("  - Proper shipping names")
            print("  - All required ADR information")
        else:
            print("Generating NORMAL consignment with:")
            print("  - Regular goods (non-dangerous)")
            print("  - No dangerous goods indicators")
            print("  - Realistic normal transport data")
        print(f"{'='*60}\n")
        
        print("Replacing all placeholder data with realistic Croatian data...")
        print("  - Company names...")
        print("  - Person names...")
        print("  - Street names and addresses...")
        print("  - Postal codes...")
        print("  - Building numbers...")
        print("  - Counties...")
        print("  - Cities...")
        print(f"  - Goods descriptions ({mode} mode)...")
        print("  - Phone numbers...")
        print("  - Email addresses...")
        print("  - Contract terms...")
        print("  - Information texts...")
        print("  - IDs and codes...")
        print("  - Currency codes...")
        print("  - Unit codes...")
        print("  - Role codes...")
        print("  - Payment codes...")
        print("  - Type codes...")
        print("  - URIs...")
        
        content = replace_placeholder_text(content, mode)
    
    # Mode-specific XML modifications (skip for MINIMAL mode)
    if mode == 'MINIMAL':
        # For MINIMAL mode, content is already generated, skip all modifications
        pass
    elif mode == 'ADR':
        # Set dangerousGoodsIndicator to true
        content = re.sub(
            r'<dangerousGoodsIndicator>false</dangerousGoodsIndicator>',
            '<dangerousGoodsIndicator>true</dangerousGoodsIndicator>',
            content
        )
        # Ensure dangerous goods indicator exists in mainCarriageTransportMovement
        if '<mainCarriageTransportMovement>' in content and '<dangerousGoodsIndicator>' not in content.split('<mainCarriageTransportMovement>')[1].split('</mainCarriageTransportMovement>')[0]:
            content = re.sub(
                r'(<mainCarriageTransportMovement[^>]*>)',
                r'\1\n        <dangerousGoodsIndicator>true</dangerousGoodsIndicator>',
                content
            )
    else:
        # Set dangerousGoodsIndicator to false and remove dangerous goods sections
        content = re.sub(
            r'<dangerousGoodsIndicator>true</dangerousGoodsIndicator>',
            '<dangerousGoodsIndicator>false</dangerousGoodsIndicator>',
            content
        )
        # Remove dangerous goods sections at consignment level (not inside items)
        # This is complex, so we'll do it carefully
        content = re.sub(
            r'<dangerousGoods>.*?</dangerousGoods>',
            '',
            content,
            flags=re.DOTALL
        )
        # Remove transportDangerousGoods from items
        content = re.sub(
            r'<transportDangerousGoods>.*?</transportDangerousGoods>',
            '',
            content,
            flags=re.DOTALL
        )
    
    # Ensure realistic weight/volume values (fix unrealistic values)
    # Skip for MINIMAL mode - values are already set from JSON
    if mode != 'MINIMAL':
        def fix_weight_value(match):
            unit = match.group(2) if match.group(2) else 'KGM'
            if unit == 'GRM':
                # Grams - should be 100-1000000 for realistic packages
                value = random.uniform(100, 1000000)
            elif unit == 'KGM':
                # Kilograms - should be 10-50000 for normal, 1-10000 for ADR
                if mode == 'ADR':
                    value = random.uniform(1, 10000)
                else:
                    value = random.uniform(10, 50000)
            else:  # TNE
                # Tonnes - should be 0.1-50
                value = random.uniform(0.1, 50)
            return f'{match.group(1)}{value:.2f}{match.group(3)}'
    
        # Fix unrealistic weight values (too small)
        content = re.sub(
            r'(<grossWeight[^>]*unitId="[^"]*">)([0-9.]+)(</grossWeight>)',
            fix_weight_value,
            content
        )
        
        def fix_volume_value(match):
            unit = match.group(2) if match.group(2) else 'MTQ'
            if unit == 'LTR':
                # Liters - should be 10-100000
                value = random.uniform(10, 100000)
            else:  # MTQ
                # Cubic meters - should be 0.1-100
                value = random.uniform(0.1, 100)
            return f'{match.group(1)}{value:.2f}{match.group(3)}'
    
        # Fix unrealistic volume values
        content = re.sub(
            r'(<grossVolume[^>]*unitId="[^"]*">)([0-9.]+)(</grossVolume>)',
            fix_volume_value,
            content
        )
    
    # Ensure dates are logical (acceptance date <= issue date)
    # This is handled by the date generation, but we ensure consistency
    # Remove multimodal transport indicators for normal mode
    if mode == 'NORMAL':
        # Remove connectingCarrier (next carrier) for normal mode
        content = re.sub(
            r'<connectingCarrier>.*?</connectingCarrier>',
            '',
            content,
            flags=re.DOTALL
        )
    
    # =====================================================================
    # ADDITIONAL REALISM FIXES (applied to both NORMAL and ADR modes, NOT MINIMAL)
    # =====================================================================
    if mode != 'MINIMAL':
        print("  - Applying additional realism fixes...")
        
        # 1. Fix weight units - always use KGM for truck loads (not GRM for heavy goods)
        #    Replace GRM with KGM and adjust values to truck-realistic (5000-25000 KGM)
        content = re.sub(
            r'<grossWeight[^>]*unitId="GRM">([0-9.]+)</grossWeight>',
            lambda m: f'<grossWeight unitId="KGM">{random.uniform(5000, 25000):.2f}</grossWeight>',
            content
        )
        
        # 2. Fix volume units - use MTQ (cubic meters) for truck loads (20-80 MTQ)
        content = re.sub(
            r'<grossVolume[^>]*unitId="LTR">([0-9.]+)</grossVolume>',
            lambda m: f'<grossVolume unitId="MTQ">{random.uniform(20, 80):.2f}</grossVolume>',
            content
        )
        
        # 3. Remove company names from location fields (mjesto i datum preuzimanja robe)
        #    Location name should be a place name, not a company name
        location_names = [
            "Skladište Zagreb", "Terminal Rijeka", "Luka Split", "Robni terminal Osijek",
            "Industrijska zona Varaždin", "Slobodna zona Zadar", "Lučki terminal Pula",
            "Distribucijski centar Zagreb", "Logistički centar Koprivnica"
        ]
        
        # Fix carrierAcceptanceLocation name
        def fix_location_name(match):
            # Check if the name looks like a company (contains d.o.o., d.d., etc.)
            current_name = match.group(1)
            if 'd.o.o.' in current_name or 'd.d.' in current_name or 'banka' in current_name.lower():
                return f'<name>{random.choice(location_names)}</name>'
            return match.group(0)
        
        # This is tricky - we need to target only location names, not all names
        # Look for name elements inside carrierAcceptanceLocation
        acceptance_location_pattern = r'(<carrierAcceptanceLocation>.*?<name>)([^<]+)(</name>.*?</carrierAcceptanceLocation>)'
        content = re.sub(
            acceptance_location_pattern,
            lambda m: f'{m.group(1)}{random.choice(location_names)}{m.group(3)}',
            content,
            flags=re.DOTALL
        )
        
        # Fix issueLocation name (datum i mjesto izdavanja should not have legal subject name)
        issue_location_pattern = r'(<issueLocation>.*?<name>)([^<]+)(</name>.*?</issueLocation>)'
        content = re.sub(
            issue_location_pattern,
            lambda m: f'{m.group(1)}{random.choice(location_names)}{m.group(3)}',
            content,
            flags=re.DOTALL
        )
        
        # 4. Update vehicle models to realistic truck/trailer names
        #    Find and replace model-related fields
        truck_models = [
            "Mercedes-Benz Actros 1845", "MAN TGX 18.500", "Volvo FH 500", 
            "Scania R450", "DAF XF 480", "Iveco S-Way 490", "Renault T High 520"
        ]
        trailer_models = [
            "Schmitz Cargobull S.KO", "Krone Profi Liner", "Kögel Cargo", 
            "Wielton NS3", "Schwarzmüller SPA 3/E"
        ]
        
        # Replace generic vehicle codes with real models
        # Look for patterns that might be vehicle models (short codes like "BPO")
        content = re.sub(
            r'<typeCode>BPO</typeCode>',
            f'<typeCode>{random.choice(truck_models)}</typeCode>',
            content
        )
        
        # 5. Ensure consistent consignor/consignee/carrier in signatures
        #    Signatures should match the parties in the document
        #    First, extract what we set, then apply to signature sections
        
        # Get selected parties (we stored these in replace_placeholder_text, but let's re-select for consistency)
        selected_consignor = random.choice(NON_TRANSPORT_COMPANIES)
        selected_consignee = random.choice([c for c in NON_TRANSPORT_COMPANIES if c != selected_consignor])
        selected_carrier = random.choice(TRANSPORT_COMPANIES)
        
        # Fix consignor section to use consistent name
        consignor_pattern = r'(<consignor>.*?<name>)[^<]+(</name>.*?</consignor>)'
        content = re.sub(consignor_pattern, f'\\1{selected_consignor}\\2', content, count=1, flags=re.DOTALL)
        
        # Fix consignee section to use consistent name
        consignee_pattern = r'(<consignee>.*?<name>)[^<]+(</name>.*?</consignee>)'
        content = re.sub(consignee_pattern, f'\\1{selected_consignee}\\2', content, count=1, flags=re.DOTALL)
        
        # Fix carrier section to use consistent name
        carrier_pattern = r'(<carrier>.*?<name>)[^<]+(</name>.*?</carrier>)'
        content = re.sub(carrier_pattern, f'\\1{selected_carrier}\\2', content, count=1, flags=re.DOTALL)
        
        # Fix authoritativeSignatoryPerson names to match parties
        # Consignor's signature
        content = re.sub(
            r'(<consignor>.*?<authoritativeSignatoryPerson>.*?<name>)[^<]+(</name>.*?</authoritativeSignatoryPerson>.*?</consignor>)',
            f'\\1{selected_consignor}\\2',
            content,
            count=1,
            flags=re.DOTALL
        )
        
        # Carrier's signature
        content = re.sub(
            r'(<carrier>.*?<authoritativeSignatoryPerson>.*?<name>)[^<]+(</name>.*?</authoritativeSignatoryPerson>.*?</carrier>)',
            f'\\1{selected_carrier}\\2',
            content,
            count=1,
            flags=re.DOTALL
        )
        
        # 6. Remove banks from signature fields (banks don't receive freight goods)
        bank_names = ["Zagrebačka banka d.d.", "Privredna banka Zagreb d.d.", "banka"]
        for bank in bank_names:
            # Replace bank names in authoritativeSignatoryPerson with consignee
            content = re.sub(
                f'(<authoritativeSignatoryPerson>.*?<name>){re.escape(bank)}(</name>.*?</authoritativeSignatoryPerson>)',
                f'\\1{selected_consignee}\\2',
                content,
                flags=re.DOTALL | re.IGNORECASE
            )
        
        # 7. Fix package quantity to be realistic (10-500 packages, not 1095)
        def fix_package_quantity(match):
            value = random.randint(10, 500)
            return f'{match.group(1)}{value}{match.group(2)}'
        
        content = re.sub(
            r'(<(?:itemQuantity|packageQuantity|goodsUnitQuantity)>)\d+(</(?:itemQuantity|packageQuantity|goodsUnitQuantity)>)',
            fix_package_quantity,
            content
        )
        
        # 8. Ensure total items matches (if UKUPNO STAVKI exists)
        # Usually 1-10 items in a consignment
        content = re.sub(
            r'(<totalItemQuantity>)\d+(</totalItemQuantity>)',
            lambda m: f'{m.group(1)}{random.randint(1, 10)}{m.group(2)}',
            content
        )
    
    print(f"Writing updated content to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\nDone! New file created: {output_file}")
    print(f"Original file '{input_file}' was NOT modified.")
    print(f"All placeholder data has been replaced with realistic Croatian data ({mode} mode).")
    print(f"\nDataset UUID: {dataset_uuid}")
    print(f"Use this UUID when registering the dataset in ROI.")
    if mode == 'ADR':
        print(f"\n⚠️  ADR Mode: This consignment contains dangerous goods.")
        print(f"   Ensure all ADR regulations are properly followed.")

if __name__ == '__main__':
    main()

