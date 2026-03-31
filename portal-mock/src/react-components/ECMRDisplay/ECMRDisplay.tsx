import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { parseXML } from './ecmrParser';
import { ECMRData } from './ecmrTypes';
import { formatParty, formatLocation, formatCurrency, formatTariff } from './ecmrFormatter';
import styles from './ECMRDisplay.module.css';

const ECMRDisplay: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [ecmrData, setEcmrData] = useState<ECMRData | null>(null);
  const [xmlContent, setXmlContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const xmlBase64 = searchParams.get('data');
    setLoading(false);

    if (!xmlBase64) {
      setError('No data parameter provided');
      return;
    }

    try {
      // Decode base64 XML with proper UTF-8 handling for Croatian characters
      const binaryString = atob(xmlBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      // Use TextDecoder to properly decode UTF-8
      const decoder = new TextDecoder('utf-8');
      const decodedXml = decoder.decode(bytes);
      setXmlContent(decodedXml);

      // Debug: check XML content
      console.log('XML content length:', decodedXml.length);
      console.log('XML content preview:', decodedXml.substring(0, 200));
      // Check for Croatian characters
      const croatianTest = decodedXml.match(/[čćšđžČĆŠĐŽ]/);
      console.log('Croatian characters found:', croatianTest ? 'Yes' : 'No');

      if (!decodedXml || decodedXml.trim().length === 0) {
        setError('Empty XML content');
        return;
      }

      // Parse XML to ECMR data model
      const parsed = parseXML(decodedXml);
      setEcmrData(parsed);

      // Debug: log parsed data
      console.log('Parsed eCMR data:', parsed);
      console.log('Consignment items count:', parsed?.consignmentItems?.length || 0);
      if (parsed?.consignmentItems && parsed.consignmentItems.length > 0) {
        console.log('First item:', parsed.consignmentItems[0]);
      }

      if (!parsed) {
        setError('Failed to parse XML data');
      }
    } catch (err: any) {
      console.error('Error parsing XML:', err);
      setError(err?.message || 'Error parsing XML: ' + String(err));
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className={styles.container}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <ProgressSpinner />
            <p>Loading eCMR data...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Error message */}
      {error && (
        <Message severity="error" className={styles.errorMessage}>
          <h4>Error loading eCMR data</h4>
          <p>{error}</p>
        </Message>
      )}

      {/* eCMR Display - Pilot Version */}
      {ecmrData && !error && (
        <div className={styles.wrapper}>
          {/* Header Card */}
          <Card className={styles.headerCard}>
            <div className={styles.headerContent}>
              <div className={styles.titleSection}>
                <h1>eCMR tovarni list</h1>
                <p className={styles.subtitle}>Međunarodni cestovni prijevoz robe (CMR) — elektronički prikaz</p>
              </div>
              <div className={styles.metaSection}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <span className={styles.badge}>eCMR</span>
                </div>
                <div className={styles.metaInfo}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>eCMR identifikator:</span>
                    <span className={styles.metaValue}>{ecmrData.ecmrId || '—'}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Datum izdavanja:</span>
                    <span className={styles.metaValue}>{ecmrData.issueDate || '—'}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Mjesto izdavanja:</span>
                    <span className={styles.metaValue}>{ecmrData.issueLocation || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Basic Information Card */}
          <Card
            title={
              <div className={styles.cardHeader}>
                <h2>Osnovni podaci</h2>
                <span className={styles.fieldRange}>Polja 1–5, 16–18</span>
              </div>
            }
          >
            <div className={styles.fieldsGrid}>
              {/* Field 1: Consignor */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Pošiljatelj</span>
                  <span className={styles.fieldNumber}>1</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.consignor ? styles.empty : ''}`}>
                  {formatParty(ecmrData.consignor) || '—'}
                </div>
              </div>

              {/* Field 2: Consignee */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Primatelj</span>
                  <span className={styles.fieldNumber}>2</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.consignee ? styles.empty : ''}`}>
                  {formatParty(ecmrData.consignee) || '—'}
                </div>
              </div>

              {/* Field 16: Carrier */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Prijevoznik</span>
                  <span className={styles.fieldNumber}>16</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.carrier ? styles.empty : ''}`}>
                  {formatParty(ecmrData.carrier) || '—'}
                </div>
              </div>

              {/* Field 3: Delivery Address */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Adresa isporuke</span>
                  <span className={styles.fieldNumber}>3</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.deliveryAddress ? styles.empty : ''}`}>
                  {formatLocation(ecmrData.deliveryAddress) || '—'}
                </div>
              </div>

              {/* Field 17: Following Carrier */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Sljedeći prijevoznik</span>
                  <span className={styles.fieldNumber}>17</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.followingCarrier ? styles.empty : ''}`}>
                  {formatParty(ecmrData.followingCarrier) || '—'}
                </div>
              </div>

              {/* Field 4: Place/Date Taking Over */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Mjesto i datum preuzimanja robe</span>
                  <span className={styles.fieldNumber}>4</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.carrierAcceptanceDateTime && !ecmrData.carrierAcceptanceLocation ? styles.empty : ''}`}>
                  {ecmrData.carrierAcceptanceDateTime || ecmrData.carrierAcceptanceLocation ? (
                    <>
                      {ecmrData.carrierAcceptanceDateTime}
                      {ecmrData.carrierAcceptanceDateTime && ecmrData.carrierAcceptanceLocation && <br />}
                      {ecmrData.carrierAcceptanceLocation && formatLocation(ecmrData.carrierAcceptanceLocation)}
                    </>
                  ) : (
                    '—'
                  )}
                </div>
              </div>

              {/* Field 18: Carrier Reservations */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Rezerve i napomene prijevoznika</span>
                  <span className={styles.fieldNumber}>18</span>
                </div>
                <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
              </div>

              {/* Field 5: Annexed Documents */}
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <div className={styles.fieldLabel}>
                  <span>Priloženi dokumenti</span>
                  <span className={styles.fieldNumber}>5</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.annexedDocuments || ecmrData.annexedDocuments.length === 0 ? styles.empty : ''}`}>
                  {ecmrData.annexedDocuments && ecmrData.annexedDocuments.length > 0 ? (
                    ecmrData.annexedDocuments.map((doc, index) => (
                      <div key={index} className={styles.documentItem}>{doc}</div>
                    ))
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Goods Card */}
          <Card
            title={
              <div className={styles.cardHeader}>
                <h2>Roba</h2>
                <span className={styles.fieldRange}>Polja 6–12</span>
              </div>
            }
          >
            <div className={styles.tableWrapper}>
              <DataTable
                value={ecmrData.consignmentItems}
                emptyMessage="Nema stavki"
                className={styles.goodsTable}
              >
                <Column field="marksAndNumbers" header="6. Oznake i brojevi" body={(rowData) => rowData.marksAndNumbers || '—'} />
                <Column field="numberOfPackages" header="7. Broj paketa" body={(rowData) => rowData.numberOfPackages || '—'} />
                <Column field="packingDescription" header="8. Opis pakiranja" body={(rowData) => rowData.packingDescription || '—'} />
                <Column field="natureOfGoods" header="9. Priroda robe / Naziv" body={(rowData) => rowData.natureOfGoods || '—'} />
                <Column field="statisticNumber" header="10. Stat. broj" body={(rowData) => rowData.statisticNumber || '—'} />
                <Column
                  field="grossWeight"
                  header="11. Bruto masa (kg)"
                  body={(rowData) => (
                    rowData.grossWeight ? (
                      `${rowData.grossWeight}${rowData.grossWeightUnit ? ` ${rowData.grossWeightUnit}` : ''}`
                    ) : '—'
                  )}
                />
                <Column
                  field="volume"
                  header="12. Volumen (m³)"
                  body={(rowData) => (
                    rowData.volume ? (
                      `${rowData.volume}${rowData.volumeUnit ? ` ${rowData.volumeUnit}` : ''}`
                    ) : '—'
                  )}
                />
              </DataTable>
            </div>
            <div className={styles.goodsSummary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Ukupno stavki:</span>
                <span className={styles.summaryValue}>{ecmrData.consignmentItems.length}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Ukupno bruto:</span>
                <span className={styles.summaryValue}>
                  {ecmrData.totalGrossWeight ? (
                    `${ecmrData.totalGrossWeight}${ecmrData.totalGrossWeightUnit ? ` ${ecmrData.totalGrossWeightUnit}` : ''}`
                  ) : '—'}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Ukupno volumen:</span>
                <span className={styles.summaryValue}>
                  {ecmrData.totalVolume ? (
                    `${ecmrData.totalVolume}${ecmrData.totalVolumeUnit ? ` ${ecmrData.totalVolumeUnit}` : ''}`
                  ) : '—'}
                </span>
              </div>
            </div>
          </Card>

          {/* Instructions & Payment Card */}
          <Card
            title={
              <div className={styles.cardHeader}>
                <h2>Upute i plaćanje</h2>
                <span className={styles.fieldRange}>Polja 13–21</span>
              </div>
            }
          >
            <div className={styles.fieldsGrid}>
              {/* Field 13: Special Instructions */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Upute pošiljatelja (carina i formalnosti)</span>
                  <span className={styles.fieldNumber}>13</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.specialInstructions ? styles.empty : ''}`}>
                  {ecmrData.specialInstructions || '—'}
                </div>
              </div>

              {/* Field 19: Paying Party */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Plaća</span>
                  <span className={styles.fieldNumber}>19</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.payingParty || ecmrData.payingParty.length === 0 ? styles.empty : ''}`}>
                  {ecmrData.payingParty && ecmrData.payingParty.length > 0
                    ? ecmrData.payingParty.join(', ')
                    : '—'}
                </div>
              </div>

              {/* Field 14: COD Amount */}
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <div className={styles.fieldLabel}>
                  <span>Pouzeće</span>
                  <span className={styles.fieldNumber}>14</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.codAmount ? styles.empty : ''}`}>
                  {ecmrData.codAmount ? formatCurrency(ecmrData.codAmount, ecmrData.codCurrency) : '—'}
                </div>
              </div>

              {/* Field 15: Payment Instructions */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Upute za plaćanje vozarine</span>
                  <span className={styles.fieldNumber}>15</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.paymentInstructions || ecmrData.paymentInstructions.length === 0 ? styles.empty : ''}`}>
                  {ecmrData.paymentInstructions && ecmrData.paymentInstructions.length > 0
                    ? ecmrData.paymentInstructions.join(', ')
                    : '—'}
                </div>
              </div>

              {/* Field 20: Special Agreements */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Posebni sporazumi</span>
                  <span className={styles.fieldNumber}>20</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.specialAgreements ? styles.empty : ''}`}>
                  {ecmrData.specialAgreements || '—'}
                </div>
              </div>

              {/* Field 21: Date and Place of Issue */}
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <div className={styles.fieldLabel}>
                  <span>Datum i mjesto izdavanja</span>
                  <span className={styles.fieldNumber}>21</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.issueDateAndPlace ? styles.empty : ''}`}>
                  {ecmrData.issueDateAndPlace || '—'}
                </div>
              </div>
            </div>
          </Card>

          {/* Signatures Card */}
          <Card
            title={
              <div className={styles.cardHeader}>
                <h2>Potpisi</h2>
                <span className={styles.fieldRange}>Polja 22–24</span>
              </div>
            }
          >
            <div className={styles.signaturesGrid}>
              {/* Field 22: Sender Signature */}
              <div className={styles.signatureBox}>
                <div className={styles.fieldLabel}>
                  <span>Potpis i pečat pošiljatelja</span>
                  <span className={styles.fieldNumber}>22</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.senderSignature ? styles.empty : ''}`}>
                  {ecmrData.senderSignature || '—'}
                </div>
                <div className={styles.signatureLine}>Potpis / dokaz e-identifikacije</div>
              </div>

              {/* Field 23: Carrier Signature */}
              <div className={styles.signatureBox}>
                <div className={styles.fieldLabel}>
                  <span>Potpis i pečat prijevoznika</span>
                  <span className={styles.fieldNumber}>23</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.carrierSignature ? styles.empty : ''}`}>
                  {ecmrData.carrierSignature || '—'}
                </div>
                <div className={styles.signatureLine}>Potpis / dokaz e-identifikacije</div>
              </div>

              {/* Field 24: Consignee Signature */}
              <div className={styles.signatureBox}>
                <div className={styles.fieldLabel}>
                  <span>Roba zaprimljena</span>
                  <span className={styles.fieldNumber}>24</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.consigneeSignature ? styles.empty : ''}`}>
                  {ecmrData.consigneeSignature || '—'}
                </div>
                <div className={styles.signatureLine}>Potpis / dokaz e-identifikacije</div>
              </div>
            </div>
          </Card>

          {/* Vehicle & Tariff Card */}
          <Card
            title={
              <div className={styles.cardHeader}>
                <h2>Vozilo i tarifa</h2>
                <span className={styles.fieldRange}>Polja 25–28</span>
              </div>
            }
          >
            <div className={styles.fieldsGrid}>
              {/* Field 25: Vehicle and Trailer Numbers */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Broj vozila i prikolice</span>
                  <span className={styles.fieldNumber}>25</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.vehicleNumber && !ecmrData.trailerNumber ? styles.empty : ''}`}>
                  {ecmrData.vehicleNumber || ecmrData.trailerNumber ? (
                    <>
                      {ecmrData.vehicleNumber && `Vozilo: ${ecmrData.vehicleNumber}`}
                      {ecmrData.vehicleNumber && ecmrData.trailerNumber && ' / '}
                      {ecmrData.trailerNumber && `Prikolica: ${ecmrData.trailerNumber}`}
                    </>
                  ) : (
                    '—'
                  )}
                </div>
              </div>

              {/* Field 26: Vehicle Model */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Model vozila i prikolice</span>
                  <span className={styles.fieldNumber}>26</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.vehicleModel ? styles.empty : ''}`}>
                  {ecmrData.vehicleModel || '—'}
                </div>
              </div>

              {/* Field 27: Tariff */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Tarifa</span>
                  <span className={styles.fieldNumber}>27</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.tariff27 ? styles.empty : ''}`}>
                  {ecmrData.tariff27 || '—'}
                </div>
              </div>

              {/* Field 28: Tariffs */}
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <div className={styles.fieldLabel}>
                  <span>Tarife</span>
                  <span className={styles.fieldNumber}>28</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.tariffs || ecmrData.tariffs.length === 0 ? styles.empty : ''}`}>
                  {ecmrData.tariffs && ecmrData.tariffs.length > 0 ? (
                    ecmrData.tariffs.map((tariff, index) => (
                      <div key={index} className={styles.tariffItem}>
                        {formatTariff(tariff)}
                      </div>
                    ))
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* ADR / Dangerous Goods Card */}
          <Card
            title={
              <div className={styles.cardHeader}>
                <h2>ADR / Opasna roba</h2>
                <span className={styles.fieldRange}>Bilješka o opasnoj robi</span>
              </div>
            }
          >
            <div className={styles.fieldsGrid} style={{ marginTop: '24px' }}>
              {ecmrData.adrData?.adrItems && ecmrData.adrData.adrItems.length > 0 ? (
                ecmrData.adrData.adrItems.map((item, itemIndex) => (
                  <React.Fragment key={itemIndex}>
                    {/* Shipping Marks */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Oznake za otpremu</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.shippingMarks ? styles.empty : ''}`}>
                        {item.shippingMarks || '—'}
                      </div>
                    </div>

                    {/* Proper Shipping Name */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Pravilno naziv za otpremu</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.properShippingName ? styles.empty : ''}`}>
                        {item.properShippingName || '—'}
                      </div>
                    </div>

                    {/* UN Number */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>UN broj</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.unNumber ? styles.empty : ''}`}>
                        {item.unNumber || '—'}
                      </div>
                    </div>

                    {/* Hazard Classification ID */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>ID klasifikacije opasnosti</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.hazardClass ? styles.empty : ''}`}>
                        {item.hazardClass || '—'}
                      </div>
                    </div>

                    {/* Hazard Category Code */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Kod kategorije opasnosti</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.hazardCategoryCode ? styles.empty : ''}`}>
                        {item.hazardCategoryCode || '—'}
                      </div>
                    </div>

                    {/* Hazard Type Code */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Kod vrste opasnosti</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.hazardTypeCode ? styles.empty : ''}`}>
                        {item.hazardTypeCode || '—'}
                      </div>
                    </div>

                    {/* Packaging Danger Level Code */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Kod razine opasnosti pakiranja</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.packagingDangerLevelCode ? styles.empty : ''}`}>
                        {item.packagingDangerLevelCode || '—'}
                      </div>
                    </div>

                    {/* Tunnel Restriction Code */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Kod ograničenja tunela</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.tunnelRestrictionCode ? styles.empty : ''}`}>
                        {item.tunnelRestrictionCode || '—'}
                      </div>
                    </div>

                    {/* Limited Quantity Code */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Kod ograničene količine</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.limitedQuantityCode ? styles.empty : ''}`}>
                        {item.limitedQuantityCode || '—'}
                      </div>
                    </div>

                    {/* Special Provision ID */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>ID posebnih odredbi</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.specialProvisionID ? styles.empty : ''}`}>
                        {item.specialProvisionID || '—'}
                      </div>
                    </div>

                    {/* Reportable Quantity */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Prijavljiva količina</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.reportableQuantity ? styles.empty : ''}`}>
                        {item.reportableQuantity || '—'}
                      </div>
                    </div>

                    {/* Technical Name */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Tehnički naziv</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.technicalName ? styles.empty : ''}`}>
                        {item.technicalName || '—'}
                      </div>
                    </div>

                    {/* Regulatory Authority */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Regulatorno tijelo</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.regulatoryAuthorityName ? styles.empty : ''}`}>
                        {item.regulatoryAuthorityName || '—'}
                      </div>
                    </div>

                    {/* Number of Packages */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Broj paketa</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.numberOfPackages ? styles.empty : ''}`}>
                        {item.numberOfPackages || '—'}
                      </div>
                    </div>

                    {/* Packing Description */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Opis pakiranja</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.packingDescription ? styles.empty : ''}`}>
                        {item.packingDescription || '—'}
                      </div>
                    </div>

                    {/* Net Weight */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Neto masa (kg)</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.netWeight ? styles.empty : ''}`}>
                        {item.netWeight ? (
                          `${item.netWeight}${item.netWeightUnit ? ` ${item.netWeightUnit}` : ''}`
                        ) : '—'}
                      </div>
                    </div>

                    {/* Gross Weight */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Bruto masa (kg)</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.grossWeight ? styles.empty : ''}`}>
                        {item.grossWeight ? (
                          `${item.grossWeight}${item.grossWeightUnit ? ` ${item.grossWeightUnit}` : ''}`
                        ) : '—'}
                      </div>
                    </div>

                    {/* Volume */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Volumen (m³)</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.volume ? styles.empty : ''}`}>
                        {item.volume ? (
                          `${item.volume}${item.volumeUnit ? ` ${item.volumeUnit}` : ''}`
                        ) : '—'}
                      </div>
                    </div>

                    {/* Density */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Gustoća</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.densityMeasure ? styles.empty : ''}`}>
                        {item.densityMeasure ? (
                          `${item.densityMeasure}${item.densityMeasureUnit ? ` ${item.densityMeasureUnit}` : ''}`
                        ) : '—'}
                      </div>
                    </div>

                    {/* Melting Point */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Talište</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.meltingPointTemperatureMeasure ? styles.empty : ''}`}>
                        {item.meltingPointTemperatureMeasure ? (
                          `${item.meltingPointTemperatureMeasure}${item.meltingPointTemperatureUnit ? ` ${item.meltingPointTemperatureUnit}` : ''}`
                        ) : '—'}
                      </div>
                    </div>

                    {/* Explosive Cargo Net Weight */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldLabel}>
                        <span>Neto masa eksplozivnog tereta</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.explosiveCargoNetWeight ? styles.empty : ''}`}>
                        {item.explosiveCargoNetWeight ? (
                          `${item.explosiveCargoNetWeight}${item.explosiveCargoNetWeightUnit ? ` ${item.explosiveCargoNetWeightUnit}` : ''}`
                        ) : '—'}
                      </div>
                    </div>

                    {/* Radioactive Material Section */}
                    <div className={`${styles.fieldGroup} ${styles.fullWidth}`} style={{ padding: '12px', background: '#fff3cd', borderLeft: '3px solid #ffc107' }}>
                      <div className={styles.fieldLabel}>
                        <span>Radioaktivni materijal</span>
                      </div>
                      <div className={styles.fieldsGrid} style={{ marginTop: '8px' }}>
                        <div className={styles.fieldGroup}>
                          <div className={styles.fieldLabel}>
                            <span>Izotop</span>
                          </div>
                          <div className={`${styles.fieldValue} ${!item.radioactiveMaterial?.isotopeName ? styles.empty : ''}`}>
                            {item.radioactiveMaterial?.isotopeName || '—'}
                          </div>
                        </div>
                        <div className={styles.fieldGroup}>
                          <div className={styles.fieldLabel}>
                            <span>Razina aktivnosti</span>
                          </div>
                          <div className={`${styles.fieldValue} ${!item.radioactiveMaterial?.activityLevelMeasure ? styles.empty : ''}`}>
                            {item.radioactiveMaterial?.activityLevelMeasure ? (
                              `${item.radioactiveMaterial.activityLevelMeasure}${item.radioactiveMaterial.activityLevelUnit ? ` ${item.radioactiveMaterial.activityLevelUnit}` : ''}`
                            ) : '—'}
                          </div>
                        </div>
                        <div className={styles.fieldGroup}>
                          <div className={styles.fieldLabel}>
                            <span>Indeks sigurnosti fisijskog kritičnosti</span>
                          </div>
                          <div className={`${styles.fieldValue} ${!item.radioactiveMaterial?.fissileCriticalitySafetyIndexNumber ? styles.empty : ''}`}>
                            {item.radioactiveMaterial?.fissileCriticalitySafetyIndexNumber || '—'}
                          </div>
                        </div>
                        <div className={styles.fieldGroup}>
                          <div className={styles.fieldLabel}>
                            <span>Kod transportnog indeksa</span>
                          </div>
                          <div className={`${styles.fieldValue} ${!item.radioactiveMaterial?.radioactivePackageTransportIndexCode ? styles.empty : ''}`}>
                            {item.radioactiveMaterial?.radioactivePackageTransportIndexCode || '—'}
                          </div>
                        </div>
                        <div className={styles.fieldGroup}>
                          <div className={styles.fieldLabel}>
                            <span>Poseban oblik</span>
                          </div>
                          <div className={`${styles.fieldValue} ${!item.radioactiveMaterial?.specialFormInformation ? styles.empty : ''}`}>
                            {item.radioactiveMaterial?.specialFormInformation || '—'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Supplementary Information */}
                    <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                      <div className={styles.fieldLabel}>
                        <span>Dopunske informacije</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.supplementaryInformation ? styles.empty : ''}`}>
                        {item.supplementaryInformation || '—'}
                      </div>
                    </div>

                    {/* Information */}
                    <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                      <div className={styles.fieldLabel}>
                        <span>Informacije</span>
                      </div>
                      <div className={`${styles.fieldValue} ${!item.information ? styles.empty : ''}`}>
                        {item.information || '—'}
                      </div>
                    </div>
                  </React.Fragment>
                ))
              ) : (
                // Empty state - show all fields with "—"
                <>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Oznake za otpremu</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Pravilno naziv za otpremu</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>UN broj</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>ID klasifikacije opasnosti</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Kod kategorije opasnosti</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Kod vrste opasnosti</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Kod razine opasnosti pakiranja</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Kod ograničenja tunela</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Kod ograničene količine</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>ID posebnih odredbi</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Prijavljiva količina</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Tehnički naziv</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Regulatorno tijelo</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Broj paketa</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Opis pakiranja</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Neto masa (kg)</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Bruto masa (kg)</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Volumen (m³)</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Gustoća</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Talište</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldLabel}>
                      <span>Neto masa eksplozivnog tereta</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={`${styles.fieldGroup} ${styles.fullWidth}`} style={{ padding: '12px', background: '#fff3cd', borderLeft: '3px solid #ffc107' }}>
                    <div className={styles.fieldLabel}>
                      <span>Radioaktivni materijal</span>
                    </div>
                    <div className={styles.fieldsGrid} style={{ marginTop: '8px' }}>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldLabel}>
                          <span>Izotop</span>
                        </div>
                        <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldLabel}>
                          <span>Razina aktivnosti</span>
                        </div>
                        <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldLabel}>
                          <span>Indeks sigurnosti fisijskog kritičnosti</span>
                        </div>
                        <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldLabel}>
                          <span>Kod transportnog indeksa</span>
                        </div>
                        <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldLabel}>
                          <span>Poseban oblik</span>
                        </div>
                        <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                      </div>
                    </div>
                  </div>
                  <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                    <div className={styles.fieldLabel}>
                      <span>Dopunske informacije</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                  <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                    <div className={styles.fieldLabel}>
                      <span>Informacije</span>
                    </div>
                    <div className={`${styles.fieldValue} ${styles.empty}`}>—</div>
                  </div>
                </>
              )}

              {/* Temperature Requirements */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Kontrolna temperatura</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.adrData?.adrItems?.find(item => item.controlTemperature) ? styles.empty : ''}`}>
                  {ecmrData.adrData?.adrItems?.find(item => item.controlTemperature)?.controlTemperature || '—'}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>
                  <span>Temperatura za hitne slučajeve</span>
                </div>
                <div className={`${styles.fieldValue} ${!ecmrData.adrData?.adrItems?.find(item => item.emergencyTemperature) ? styles.empty : ''}`}>
                  {ecmrData.adrData?.adrItems?.find(item => item.emergencyTemperature)?.emergencyTemperature || '—'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ECMRDisplay;

