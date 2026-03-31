#!/usr/bin/env python3
from xml.etree.ElementTree import parse

tree = parse('e0dc601f-1480-4316-b67d-af682ca1b40b.xml')
root = tree.getroot()
ns = '{http://efti.eu/v1/consignment/common}'

for party_type in ['consignor', 'consignee', 'carrier']:
    party = root.find(f'{ns}{party_type}')
    if party is not None:
        print(f"\n{party_type.upper()}:")
        print(f"  Direct children count: {len(list(party))}")
        names = party.findall(f'{ns}name')
        print(f"  Direct child name elements: {len(names)}")
        for i, name in enumerate(names):
            print(f"    {i}: '{name.text}'")
        # Check first name element (what XSLT reads)
        first_name = party.find(f'{ns}name')
        if first_name is not None:
            print(f"  First name (XSLT reads this): '{first_name.text}'")




