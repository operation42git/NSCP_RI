"""
Simple script to generate minimal XML consignment with just essential fields
"""
import json
import uuid
import sys
from generate_minimal_xml_fixed import generate_minimal_xml

def create_minimal_data():
    """Create minimal JSON data with only required fields"""
    dataset_uuid = str(uuid.uuid4())
    
    minimal_data = {
        "ecmr_identifier": f"HR-ECMR-2026-{dataset_uuid[:8].upper()}",
        "issue_date": "2026-01-12T10:00:00+01:00",
        "issue_location": {
            "city": "Zagreb",
            "country": "HR"
        },
        "consignor": {
            "name": "Test Consignor d.o.o.",
            "address": {
                "street": "Test Street",
                "building_number": "1",
                "postcode": "10000",
                "city": "Zagreb",
                "country": "HR"
            },
            "tax_id": "12345678901"
        },
        "consignee": {
            "name": "Test Consignee d.o.o.",
            "address": {
                "street": "Test Street",
                "building_number": "2",
                "postcode": "20000",
                "city": "Split",
                "country": "HR"
            },
            "tax_id": "98765432109"
        },
        "delivery_location": {
            "name": "Delivery Location",
            "address": {
                "street": "Delivery Street",
                "building_number": "3",
                "postcode": "20000",
                "city": "Split",
                "country": "HR"
            }
        },
        "pickup": {
            "location": {
                "city": "Zagreb",
                "street": "Pickup Street",
                "building_number": "4",
                "postcode": "10000",
                "country": "HR"
            },
            "datetime": "2026-01-12T11:00:00+01:00"
        },
        "carrier": {
            "name": "Test Carrier d.o.o.",
            "address": {
                "street": "Carrier Street",
                "building_number": "5",
                "postcode": "10000",
                "city": "Zagreb",
                "country": "HR"
            },
            "tax_id": "11223344556"
        },
        "goods": {
            "marks": "TEST-001",
            "package_count": 1,
            "packaging_description": "1 paleta",
            "nature": "Test goods",
            "hs_code": "21069098",
            "gross_weight": {
                "value": 1000.00,
                "unit": "KGM"
            },
            "volume": {
                "value": 2.0,
                "unit": "MTQ"
            }
        },
        "freight_payment": "PREPAID",
        "payment_party": "CONSIGNOR",
        "vehicle": {
            "id": "HR ZG-TEST-01",
            "trailer_id": "HR ZG-TEST-02"
        }
    }
    
    return minimal_data, dataset_uuid

def main():
    """Generate minimal XML file"""
    try:
        data, dataset_uuid = create_minimal_data()
        
        # Generate XML
        xml_content = generate_minimal_xml(data, dataset_uuid)
        
        # Write to file
        filename = f"{dataset_uuid}.xml"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(xml_content)
        
        print(f"Dataset UUID: {dataset_uuid}")
        print(f"XML file created: {filename}")
        print(f"Use this UUID when registering the dataset in ROI.")
        
        return dataset_uuid
        
    except Exception as e:
        print(f"Error generating XML: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()




