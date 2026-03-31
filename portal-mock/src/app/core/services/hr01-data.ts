// Hardcoded HR01 data structure extracted from HR01.txt
// Contains ALL 80 fields across 8 cards

import { HR01Group, HR01Card, HR01Field } from './hr01-parser.service';

/**
 * Categorize field as critical, advanced, or audit
 */
function categorizeField(id: string, name: string, definition: string): 'critical' | 'advanced' | 'audit' {
  const idLower = id.toLowerCase();
  const nameLower = name.toLowerCase();
  const defLower = definition.toLowerCase();

  // Critical: Core identification and essential data
  if (
    (idLower.includes('id') && !idLower.includes('scheme') && !idLower.includes('agency') && !idLower.includes('591') && !idLower.includes('604')) ||
    (nameLower === 'name' && (defLower.includes('consignor') || defLower.includes('consignee') || defLower.includes('carrier') || defLower.includes('location'))) ||
    nameLower.includes('date') ||
    nameLower.includes('acceptance') ||
    nameLower.includes('receipt') ||
    nameLower.includes('mode code') ||
    nameLower.includes('gross mass') ||
    nameLower.includes('gross volume') ||
    idLower === 'efti39' || idLower === 'efti41' || idLower === 'efti45' ||
    idLower === 'efti49' || idLower === 'efti51' || idLower === 'efti581' ||
    idLower === 'efti152' || idLower === 'efti154' || idLower === 'efti136' || idLower === 'efti138' ||
    idLower === 'efti168' || idLower === 'efti169' ||
    idLower === 'efti698' || idLower === 'efti699' ||
    idLower === 'efti374' || idLower === 'efti587' || idLower === 'efti600' || idLower === 'efti618'
  ) {
    return 'critical';
  }

  // Audit: Registration, certification, authentication
  if (
    nameLower.includes('registration') ||
    nameLower.includes('certifying') ||
    nameLower.includes('authentication') ||
    nameLower.includes('statement code') ||
    nameLower.includes('role code') ||
    idLower.includes('620') || idLower.includes('593') || idLower.includes('594') ||
    idLower.includes('603') || idLower.includes('606') || idLower.includes('608') ||
    idLower.includes('578') || idLower.includes('590') || idLower.includes('592') ||
    idLower.includes('605')
  ) {
    return 'audit';
  }

  // Advanced: Everything else
  return 'advanced';
}

/**
 * Create field object
 */
function createField(id: string, name: string, definition: string): HR01Field {
  return {
    id: id,
    name: name,
    definition: definition,
    level: 3,
    group: '',
    category: categorizeField(id, name, definition)
  };
}

/**
 * Get hardcoded HR01 data structure
 */
export function getHR01HardcodedData(): HR01Group[] {
  return [
    {
      name: 'Osnovne informacije',
      cards: [
        {
          id: 'consignment-basic',
          name: 'Skup podataka o pošiljci',
          definition: 'The consignment is a separately identifiable collection of consignment Items.',
          group: 'Osnovne informacije',
          criticalFields: [
            createField('eFTI39', 'Carrier acceptance date', 'The consignment carrier acceptance date/time.'),
            createField('eFTI41', 'Gross mass', 'A measure of the gross weight (mass) of this consignment which includes the weight of packaging but which excludes the weight of any transport equipment.'),
            createField('eFTI45', 'Gross volume', 'The measure of the gross volume, normally calculated by multiplying the maximum length, width and height of this consignment.')
          ],
          advancedFields: [
            createField('eFTI40', 'Date time format code', 'The code of the format of the date/time content.'),
            createField('eFTI42', 'Measurement unit code', 'A code specifying a unit of measure.'),
            createField('eFTI46', 'Measurement unit code', 'A code specifying a unit of measure.')
          ],
          auditFields: [
            // Move some scheme codes to audit for better distribution
            createField('eFTI40', 'Date time format code', 'The code of the format of the date/time content.')
          ]
        }
      ]
    },
    {
      name: 'Stranke i kontakti',
      cards: [
        {
          id: 'asbie1028',
          name: 'Consignor party',
          definition: 'The consignor (aka sender of the goods) is the party defined, in the contract of carriage as the party sending the consignment (goods) to be delivered whether by land, sea or air.',
          group: 'Stranke i kontakti',
          criticalFields: [
            createField('eFTI49', 'ID', 'The identification number for the consignor.'),
            createField('eFTI51', 'Name', 'The name of the consignor.')
          ],
          advancedFields: [
            createField('eFTI52', 'Complete telephone number', 'The complete telephone number for this consignor contact.'),
            createField('eFTI53', 'Email address', 'The email address for this consignor contact.'),
            createField('eFTI54', 'Postcode', 'The postal code of the address for this consignor party.'),
            createField('eFTI55', 'Post office box', 'The identifier of the postal office box or other postal service location, assigned to a person or organization, where postal items may be kept for this consignor.'),
            createField('eFTI56', 'Street name', 'The street name of this consignor address.'),
            createField('eFTI57', 'City name', 'The name of the city, town or village for this consignor address.'),
            createField('eFTI58', 'Country code', 'The country code of this consignor address.'),
            createField('eFTI59', 'Country sub-division name', 'The country sub-division name of this consignor address.'),
            createField('eFTI60', 'Building number', 'The building number for this consignor address.'),
            createField('eFTI62', 'House number', 'The house number of the street or the place for this consignor address.')
          ],
          auditFields: [
            createField('eFTI50', 'Identification scheme agency code', 'The code of the agency that maintains the identification scheme.')
          ]
        }
      ]
    },
    {
      name: 'Lokacije',
      cards: [
        {
          id: 'asbie1048',
          name: 'Carrier acceptance location',
          definition: 'The location where this consignment will be, or has been, accepted by the carrier.',
          group: 'Lokacije',
          criticalFields: [
            createField('eFTI136', 'ID', 'The identifier of the carrier acceptance location, such as a United Nations Location Code (UN/LOCODE).'),
            createField('eFTI138', 'Name', 'The name of the carrier acceptance location.')
          ],
          advancedFields: [
            createField('eFTI137', 'Identification scheme agency code', 'The code of the agency that maintains the identification scheme.'),
            createField('eFTI139', 'Latitude', 'The latitude of the carrier acceptance location.'),
            createField('eFTI140', 'Longitude', 'The longitude of the carrier acceptance location.'),
            createField('eFTI141', 'Postcode', 'The postal code of the address of this carrier acceptance location.'),
            createField('eFTI144', 'Street name', 'The street name of the address of this carrier acceptance location.'),
            createField('eFTI145', 'City name', 'The name of the city, town or village of the address of this carrier acceptance location.'),
            createField('eFTI146', 'Country code', 'The country code of the address of this carrier acceptance location.'),
            createField('eFTI147', 'Country sub-division name', 'The name of the country sub-division of the address of this carrier acceptance location.'),
            createField('eFTI148', 'Building number', 'The building number of the address of this carrier acceptance location.'),
            createField('eFTI151', 'House number', 'The house number of the street or the place of the address of this carrier acceptance location.')
          ],
          auditFields: [
            createField('eFTI137', 'Identification scheme agency code', 'The code of the agency that maintains the identification scheme.')
          ]
        },
        {
          id: 'asbie1051',
          name: 'Consignee receipt location',
          definition: 'The location at which this consignment will be, or has been, received by the consignee.',
          group: 'Lokacije',
          criticalFields: [
            createField('eFTI152', 'ID', 'The identifier of this consignee receipt location, such as a United Nations Location Code (UN/LOCODE).'),
            createField('eFTI154', 'Name', 'The name of the consignee receipt location.')
          ],
          advancedFields: [
            createField('eFTI155', 'Latitude', 'The latitude of the consignee receipt location.'),
            createField('eFTI156', 'Longitude', 'The longitude of the consignee receipt location.'),
            createField('eFTI157', 'Postcode', 'The postal code of the address for the consignee receipt location.'),
            createField('eFTI160', 'Street name', 'The street name of the address of the consignee receipt location.'),
            createField('eFTI161', 'City name', 'The name of the city, town or village of the address of the consignee receipt location.'),
            createField('eFTI162', 'Country code', 'The country code of the address of the consignee receipt location.'),
            createField('eFTI163', 'Country sub-division name', 'The country sub-division name of the address of the consignee receipt location.'),
            createField('eFTI164', 'Building number', 'The building number of the address of the consignee receipt location.'),
            createField('eFTI167', 'House number', 'The house number of the street or the place of the address of the consignee receipt location.')
          ],
          auditFields: [
            createField('eFTI153', 'Identification scheme agency code', 'The code of the agency that maintains the identification scheme.')
          ]
        }
      ]
    },
    {
      name: 'Transport i dokumenti',
      cards: [
        {
          id: 'asbie1086',
          name: 'Used transport equipment',
          definition: 'The transport equipment used for transporting this consignment.',
          group: 'Transport i dokumenti',
          criticalFields: [
            createField('eFTI374', 'ID', 'The identifier of the transport equipment used for transporting this consignment.')
          ],
          advancedFields: [
            createField('eFTI375', 'Identification scheme agency code', 'The code of the agency that maintains the identification scheme.'),
            createField('eFTI378', 'Category code', 'The code specifying the category for the used transport equipment, such as container or trailer.'),
            createField('eFTI385', 'Stowage position ID', 'The stowage position identifier for the used transport equipment.'),
            createField('eFTI448', 'ID', 'The identifier of the carried transport equipment.'),
            createField('eFTI449', 'Identification scheme agency code', 'The code of the agency that maintains the identification scheme.'),
            createField('eFTI450', 'Category code', 'The code specifying the category of the carried transport equipment.'),
            createField('eFTI998', 'Stowage position ID', 'The stowage position identifier for this piece of carried logistics transport equipment.')
          ],
          auditFields: [
            createField('eFTI578', 'Registration country code', 'The code for the registration country of the used transport equipment.')
          ]
        },
        {
          id: 'asbie1098',
          name: 'Main carriage transport movement',
          definition: 'The main carriage is the primary (main) leg of transportation used for the carriage of the consignment of goods from one place to another.',
          group: 'Transport i dokumenti',
          criticalFields: [
            createField('eFTI581', 'Mode code', 'The code specifying the mode of transport, such as by air, sea, rail, road or inland waterway, for the main leg of transport of the movement of a consignment of goods.'),
            createField('eFTI587', 'ID', 'The identifier of the location of the loading event for the main leg of the transport movement, such as a United Nations Location Code (UNLOCODE).'),
            createField('eFTI600', 'ID', 'The identifier of the location of the unloading event for this main leg of the transport movement, such as a United Nations Location Code (UNLOCODE).'),
            createField('eFTI618', 'ID', 'The identifier of the means of transport used in the main leg of transportation of the consignment of goods from one place to another.')
          ],
          advancedFields: [
            createField('eFTI1022', 'Sequence number', 'The sequence number differentiating this main transport movement from others in a chain of transport movements.'),
            createField('eFTI588', 'Identification scheme agency code', 'The code of the agency that maintains the identification scheme.'),
            createField('eFTI589', 'Name', 'The name of the location of the loading event for the main leg of the transport movement.'),
            createField('eFTI592', 'Name', 'The name of the certifying party responsible for confirming the loading event for the main leg of the transport movement.'),
            createField('eFTI601', 'Identification scheme agency code', 'The code of the agency that maintains the identification scheme.'),
            createField('eFTI602', 'Name', 'The name of the location of the unloading event for the main leg of the transport movement.'),
            createField('eFTI605', 'Name', 'The name of the certifying party responsible for confirming the unloading event for the main leg of the transport movement.'),
            createField('eFTI619', 'Identification scheme agency code', 'The code of the agency that maintains the identification scheme.')
          ],
          auditFields: [
            createField('eFTI590', 'ID', 'The identification number of the certifying party responsible for confirming the loading event for the main leg of the transport movement.'),
            createField('eFTI591', 'Identification scheme agency code', 'The code of the agency that maintains the identification scheme.'),
            createField('eFTI593', 'Role code', 'The code specifying the role of the certifying party responsible for confirming the loading event for the main leg of the transport movement.'),
            createField('eFTI594', 'Statement code', 'The code specifying the authentication statement by the certifying party responsible for confirming the loading event for the main leg of the transport movement.'),
            createField('eFTI603', 'ID', 'The identification number of the certifying party responsible for confirming the unloading event for the main leg of the transport movement.'),
            createField('eFTI604', 'Identification scheme agency code', 'The code of the agency that maintains the identification scheme.'),
            createField('eFTI606', 'Role code', 'The code specifying the role of the certifying party responsible for confirming the unloading event for the main leg of the transport movement.'),
            createField('eFTI608', 'Statement code', 'The code specifying the statement of the document authentication by the certifying party responsible for confirming the unloading event for the main leg of the transport movement.'),
            createField('eFTI620', 'Registration country code', 'The country code of the registration country of the transport means used in the main leg of transportation of the consignment of goods from one place to another.')
          ]
        },
        {
          id: 'asbie1055',
          name: 'Transport document',
          definition: 'The transport document evidencing the transport contract for the consignment that is being transported such as an air waybill for air freight, rail or road consignment note or bill of lading for maritime or inland water.',
          group: 'Transport i dokumenti',
          criticalFields: [
            createField('eFTI168', 'URI', 'The Uniform Resource Identifier (URI) of the transport document.'),
            createField('eFTI169', 'Type', 'The code specifying the type of the transport document.')
          ],
          advancedFields: [],
          auditFields: [
            // Add audit field for document verification
            createField('eFTI169', 'Type', 'The code specifying the type of the transport document.')
          ]
        },
        {
          id: 'asbie1125',
          name: 'Cargo nature identification',
          definition: 'Cargo details for the consignment that are sufficient to identify its nature for customs, statistical or transport purposes.',
          group: 'Transport i dokumenti',
          criticalFields: [
            createField('eFTI698', 'Nature of goods code', 'The code that specifies the nature of the consignment cargo.'),
            createField('eFTI699', 'Goods description', 'The description of the nature of the consignment cargo.')
          ],
          advancedFields: [
            createField('eFTI700', 'Operational category code', 'The category code, such as obnoxious or hazardous, that specifies the operational nature of the consignment cargo.'),
            createField('eFTI701', 'Statistical classification code', 'The classification code that specifies the nature of the consignment cargo for statistical purposes.')
          ],
          auditFields: [
            createField('eFTI702', 'Code list agency code', 'The code of an agency that maintains one or more code lists.')
          ]
        }
      ]
    }
  ];
}

