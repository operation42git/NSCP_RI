#!/usr/bin/env python3
"""Extract all field names and eFTI IDs from consignment-common.xsd"""

import xml.etree.ElementTree as ET
import re
from collections import OrderedDict

def extract_fields(xsd_file):
    """Extract all element names and their eFTI IDs from the XSD file"""
    tree = ET.parse(xsd_file)
    root = tree.getroot()
    
    # Define namespaces
    namespaces = {
        'xsd': 'http://www.w3.org/2001/XMLSchema',
        'efti': 'http://efti.eu/v1/consignment/common'
    }
    
    fields = OrderedDict()
    
    # Find all element definitions
    for elem in root.findall('.//xsd:element', namespaces):
        name = elem.get('name')
        if not name:
            continue
            
        # Find eFTI annotation
        efti_elem = elem.find('.//efti:efti', namespaces)
        if efti_elem is not None:
            efti_id = efti_elem.get('id', '')
            definition = efti_elem.get('definition', '')
            format_str = efti_elem.get('format', '')
            
            # Get type information
            elem_type = elem.get('type', '')
            min_occurs = elem.get('minOccurs', '0')
            max_occurs = elem.get('maxOccurs', '1')
            
            fields[name] = {
                'efti_id': efti_id,
                'definition': definition,
                'format': format_str,
                'type': elem_type,
                'minOccurs': min_occurs,
                'maxOccurs': max_occurs
            }
        else:
            # Element without eFTI annotation
            elem_type = elem.get('type', '')
            min_occurs = elem.get('minOccurs', '0')
            max_occurs = elem.get('maxOccurs', '1')
            
            fields[name] = {
                'efti_id': '',
                'definition': '',
                'format': '',
                'type': elem_type,
                'minOccurs': min_occurs,
                'maxOccurs': max_occurs
            }
    
    return fields

if __name__ == '__main__':
    xsd_file = 'schema/xsd/consignment-common.xsd'
    fields = extract_fields(xsd_file)
    
    print(f"Total fields found: {len(fields)}\n")
    print("=" * 100)
    print("FIELD NAME".ljust(50) + "eFTI ID".ljust(20) + "TYPE".ljust(30) + "OCCURRENCE")
    print("=" * 100)
    
    for name, info in fields.items():
        efti_id = info['efti_id'] if info['efti_id'] else 'N/A'
        elem_type = info['type'].split(':')[-1] if ':' in info['type'] else info['type']
        occurrence = f"{info['minOccurs']}..{info['maxOccurs']}"
        
        print(f"{name:<50}{efti_id:<20}{elem_type:<30}{occurrence}")
        
        if info['definition']:
            print(f"  Definition: {info['definition']}")
        if info['format']:
            print(f"  Format: {info['format']}")
        print()







