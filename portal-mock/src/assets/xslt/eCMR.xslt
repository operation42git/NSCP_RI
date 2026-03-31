<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
  xmlns:efti="http://efti.eu/v1/consignment/common"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://efti.eu/v1/consignment/common ../consignment-common.xsd">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <!-- Helper template: Format postal address -->
  <xsl:template name="formatAddress">
    <xsl:param name="address"/>
    <xsl:if test="$address/efti:buildingNumber or $address/efti:streetName or $address/efti:postcode or $address/efti:cityName">
      <xsl:value-of select="$address/efti:buildingNumber"/>
      <xsl:if test="$address/efti:buildingNumber and ($address/efti:streetName or $address/efti:postcode or $address/efti:cityName)">
        <xsl:text> </xsl:text>
      </xsl:if>
      <xsl:value-of select="$address/efti:streetName"/>
      <xsl:if test="$address/efti:streetName and ($address/efti:postcode or $address/efti:cityName)">
        <xsl:text> </xsl:text>
      </xsl:if>
      <xsl:value-of select="$address/efti:postcode"/>
      <xsl:if test="$address/efti:postcode and $address/efti:cityName">
        <xsl:text> </xsl:text>
      </xsl:if>
      <xsl:value-of select="$address/efti:cityName"/>
    </xsl:if>
    <xsl:if test="$address/efti:countrySubDivisionName">
      <xsl:if test="$address/efti:buildingNumber or $address/efti:streetName or $address/efti:postcode or $address/efti:cityName">
        <xsl:text>&#10;</xsl:text>
      </xsl:if>
      <xsl:value-of select="$address/efti:countrySubDivisionName"/>
    </xsl:if>
  </xsl:template>

  <!-- Helper template: Format consignor/consignee/carrier with address -->
  <xsl:template name="formatPartyWithAddress">
    <xsl:param name="party"/>
    <xsl:call-template name="formatAddress">
      <xsl:with-param name="address" select="$party/efti:postalAddress"/>
    </xsl:call-template>
    <xsl:if test="$party/efti:name">
      <xsl:if test="$party/efti:postalAddress/efti:buildingNumber or $party/efti:postalAddress/efti:streetName or $party/efti:postalAddress/efti:postcode or $party/efti:postalAddress/efti:cityName or $party/efti:postalAddress/efti:countrySubDivisionName">
        <xsl:text>&#10;</xsl:text>
      </xsl:if>
      <xsl:value-of select="$party/efti:name"/>
    </xsl:if>
  </xsl:template>

  <!-- Helper template: Format location with address -->
  <xsl:template name="formatLocationWithAddress">
    <xsl:param name="location"/>
    <xsl:call-template name="formatAddress">
      <xsl:with-param name="address" select="$location/efti:postalAddress"/>
    </xsl:call-template>
    <xsl:if test="$location/efti:name">
      <xsl:if test="$location/efti:postalAddress/efti:buildingNumber or $location/efti:postalAddress/efti:streetName or $location/efti:postalAddress/efti:postcode or $location/efti:postalAddress/efti:cityName or $location/efti:postalAddress/efti:countrySubDivisionName">
        <xsl:text>&#10;</xsl:text>
      </xsl:if>
      <xsl:value-of select="$location/efti:name"/>
    </xsl:if>
  </xsl:template>

  <!-- Helper template: Format carrier acceptance date and location -->
  <xsl:template name="formatCarrierAcceptance">
    <xsl:value-of select="/efti:consignment/efti:carrierAcceptanceDateTime"/>
    <xsl:if test="/efti:consignment/efti:carrierAcceptanceLocation">
      <xsl:if test="/efti:consignment/efti:carrierAcceptanceDateTime">
        <xsl:text>&#10;</xsl:text>
      </xsl:if>
      <xsl:call-template name="formatLocationWithAddress">
        <xsl:with-param name="location" select="/efti:consignment/efti:carrierAcceptanceLocation"/>
      </xsl:call-template>
    </xsl:if>
  </xsl:template>

  <!-- Helper template: Format document list (for annexed documents) -->
  <xsl:template name="formatDocuments">
    <xsl:param name="documents"/>
    <xsl:for-each select="$documents">
      <xsl:if test="position() > 1">
        <xsl:text>&#10;</xsl:text>
      </xsl:if>
      <xsl:value-of select="efti:id"/>
      <xsl:if test="efti:typeCode">
        <xsl:text> (</xsl:text>
        <xsl:value-of select="efti:typeCode"/>
        <xsl:text>)</xsl:text>
      </xsl:if>
    </xsl:for-each>
  </xsl:template>

  <!-- Helper template: Format multiple description values -->
  <xsl:template name="formatDescriptions">
    <xsl:param name="descriptions"/>
    <xsl:for-each select="$descriptions">
      <xsl:if test="position() > 1">
        <xsl:text>&#10;</xsl:text>
      </xsl:if>
      <xsl:value-of select="."/>
    </xsl:for-each>
  </xsl:template>

  <!-- Helper template: Format date and place -->
  <xsl:template name="formatDateAndPlace">
    <xsl:param name="date"/>
    <xsl:param name="location"/>
    <xsl:if test="$date">
      <xsl:value-of select="$date"/>
    </xsl:if>
    <xsl:if test="$location/efti:name">
      <xsl:if test="$date">
        <xsl:text>&#10;</xsl:text>
      </xsl:if>
      <xsl:value-of select="$location/efti:name"/>
      <xsl:if test="$location/efti:postalAddress">
        <xsl:text>, </xsl:text>
        <xsl:call-template name="formatAddress">
          <xsl:with-param name="address" select="$location/efti:postalAddress"/>
        </xsl:call-template>
      </xsl:if>
    </xsl:if>
  </xsl:template>

  <!-- Helper template: Format currency amount -->
  <xsl:template name="formatCurrency">
    <xsl:param name="amount"/>
    <xsl:param name="currency"/>
    <xsl:if test="$amount">
      <xsl:value-of select="$amount"/>
      <xsl:if test="$currency">
        <xsl:text> </xsl:text>
        <xsl:value-of select="$currency"/>
      </xsl:if>
    </xsl:if>
  </xsl:template>

  <!-- Helper template: Format following carrier -->
  <xsl:template name="formatFollowingCarrier">
    <xsl:param name="carrier"/>
    <xsl:if test="$carrier/efti:name">
      <xsl:value-of select="$carrier/efti:name"/>
      <xsl:if test="$carrier/efti:postalAddress">
        <xsl:text>&#10;</xsl:text>
        <xsl:call-template name="formatAddress">
          <xsl:with-param name="address" select="$carrier/efti:postalAddress"/>
        </xsl:call-template>
      </xsl:if>
    </xsl:if>
  </xsl:template>

  <!-- Main template -->
  <xsl:template match="/">
    <html lang="hr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>eCMR</title>

    <style>
          :root{
            --ink:#1f2937;
            --muted:#6b7280;
            --line:#cfd6df;
            --paper:#ffffff;
            --bg:#f6f7fb;
            --accent:#2563eb;
          }

          html,body{
            margin:0; padding:0;
            background:var(--bg);
            color:var(--ink);
            font:14px/1.35 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
          }

          .page{ max-width: 1040px; margin: 24px auto; padding: 18px; }

          .paper{
            background: var(--paper);
            border: 1px solid var(--line);
            border-radius: 14px;
            box-shadow: 0 8px 24px rgba(0,0,0,.06);
            overflow: hidden;
          }

          /* ===== Header (the one you liked from the first idea) ===== */
          .header{
            padding: 16px 18px 10px 18px;
            border-bottom: 1px solid var(--line);
            display:flex;
            justify-content:space-between;
            gap:12px;
            align-items:flex-start;
          }
          .titleBlock h1{ margin:0; font-size:18px; letter-spacing:.2px; }
          .titleBlock .subtitle{ color: var(--muted); margin-top: 4px; font-size: 12px; }

          .metaBlock{ text-align:right; min-width: 280px; }
          .badge{
            display:inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            background: rgba(37,99,235,.10);
            color: var(--accent);
            font-weight: 600;
            font-size: 12px;
            margin-bottom: 8px;
          }
          .metaGrid{
            display:grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 10px;
            font-size: 12px;
            color: var(--muted);
          }
          .metaGrid strong{ color: var(--ink); font-weight: 600; }

          .content{ padding: 14px 18px 18px 18px; }

          .sectionTitle{
            display:flex;
            align-items:center;
            gap:10px;
            margin: 12px 0 8px;
            font-weight: 700;
            font-size: 13px;
            letter-spacing:.2px;
          }
          .sectionTitle:before{
            content:"";
            width:8px; height:8px;
            border-radius: 3px;
            background: var(--accent);
            opacity:.85;
          }

          /* ===== Form grid (keeps the SAME fields as your existing HTML) ===== */
          .grid{
            border: 1px solid var(--line);
            border-radius: 12px;
            overflow: hidden;
            background: #fff;
          }
          .row{
            display:grid;
            grid-template-columns: repeat(12, 1fr);
            border-top: 1px solid var(--line);
          }
          .row:first-child{ border-top:0; }

          .cell{
            padding: 10px 10px 8px;
            border-left: 1px solid var(--line);
            min-height: 110px;
            background:#fff;
          }
          .cell:first-child{ border-left:0; }

          .cell.tight{ min-height: 60px; }
          .cell.mid{ min-height: 120px; }
          .cell.tall{ min-height: 170px; }
          .cell.xl{ min-height: 220px; }

          .label{
            font-size: 11px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: .06em;
            margin-bottom: 6px;
            display:flex;
            justify-content:space-between;
            gap:8px;
          }
          .label .boxNo{
            font-size: 11px;
            color: var(--muted);
            font-weight: 700;
            opacity:.9;
          }
          .value{
            font-size: 13px;
            color: var(--ink);
            white-space: pre-wrap;
            word-break: break-word;
          }
          .value.empty{ color:#9ca3af; font-style: italic; }

          /* Placeholder header cell (top-right in old layout) */
          .blankHeader{
            background: linear-gradient(180deg,#fafbff,#fff);
          }

          /* Goods table (6–12) */
          table.lines{
            width:100%;
            border-collapse: collapse;
            font-size: 13px;
            table-layout: fixed;
          }
          .lines th, .lines td{
            border-top: 1px solid var(--line);
            padding: 10px 10px;
            vertical-align: top;
          }
          .lines th{
            color: var(--muted);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .06em;
            text-align:left;
            background: #fafbff;
            border-top:0;
          }
          .goodsFooter{
            display:flex;
            justify-content:space-between;
            gap:12px;
            padding: 10px;
            border-top: 1px solid var(--line);
            color: var(--muted);
            font-size: 12px;
            font-weight: 600;
          }
          .goodsFooter strong{ color:var(--ink); }

          /* Signature row (22/23/24) */
          .signGrid{
            display:grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
          }
          .signBox{
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 10px;
            min-height: 140px;
            background:#fff;
          }
          .signBox .label{ margin-bottom: 10px; }
          .signLine{
            margin-top: 26px;
            border-top: 1px dashed #c7ced8;
            padding-top: 8px;
            color: var(--muted);
      font-size: 12px;
      }

          /* Responsive */
          @media (max-width: 980px){
            .metaBlock{ min-width: 0; text-align:left; }
            .header{ flex-direction:column; }
            .signGrid{ grid-template-columns: 1fr; }
          }

          /* Print */
          @media print{
            body{ background:#fff; }
            .page{ margin:0; padding:0; max-width:none; }
            .paper{ border:0; border-radius:0; box-shadow:none; }
            .badge{ border:1px solid var(--line); background:#fff; color:var(--ink); }
          }
    </style>
      </head>

      <body>
        <div class="page">
          <div class="paper">

            <!-- Header (keep this modern header; no "EFTI CONSIGNMENT NOTE" field inside the form) -->
            <div class="header">
              <div class="titleBlock">
                <h1>eCMR tovarni list</h1>
                <div class="subtitle">Međunarodni cestovni prijevoz robe (CMR) — elektronički prikaz</div>
              </div>

              <div class="metaBlock">
                <div class="badge">eCMR</div>
                <div class="metaGrid">
                  <div>eCMR identifikator:</div><div><strong><xsl:value-of select="/efti:consignment/efti:associatedDocument/efti:id"/></strong></div>
                  <div>Datum izdavanja:</div><div><strong><xsl:value-of select="/efti:consignment/efti:associatedDocument/efti:formattedIssueDateTime"/></strong></div>
                  <div>Mjesto izdavanja:</div><div><strong><xsl:value-of select="/efti:consignment/efti:associatedDocument/efti:issueLocation/efti:name"/></strong></div>
                  <div>Status:</div><div><strong><!-- Status field not available in XML --></strong></div>
                </div>
              </div>
            </div>

            <div class="content">

              <!-- Fields 1–5, 16–18 (same as your current HTML layout) -->
              <div class="sectionTitle">Osnovni podaci</div>
              <div class="grid">

                <!-- Row 1: 1 (Sender) | blank header cell (keeps the old format, but no EFTI field) -->
                <div class="row">
                  <div class="cell" style="grid-column: span 6;">
                    <div class="label"><span>Pošiljatelj</span><span class="boxNo">1</span></div>
                    <div class="value">
                      <xsl:call-template name="formatPartyWithAddress">
                        <xsl:with-param name="party" select="/efti:consignment/efti:consignor"/>
                      </xsl:call-template>
                    </div>
                  </div>

                  <div class="cell blankHeader" style="grid-column: span 6;">
                    <div class="label"><span>&nbsp;</span><span class="boxNo">&nbsp;</span></div>
                    <div class="value empty">—</div>
                  </div>
                </div>

                <!-- Row 2: 2 (Consignee) | 16 (Carrier) -->
                <div class="row">
                  <div class="cell" style="grid-column: span 6;">
                    <div class="label"><span>Primatelj</span><span class="boxNo">2</span></div>
                    <div class="value">
                      <xsl:call-template name="formatPartyWithAddress">
                        <xsl:with-param name="party" select="/efti:consignment/efti:consignee"/>
                      </xsl:call-template>
                    </div>
                  </div>
                  <div class="cell" style="grid-column: span 6;">
                    <div class="label"><span>Prijevoznik</span><span class="boxNo">16</span></div>
                    <div class="value">
                      <xsl:call-template name="formatPartyWithAddress">
                        <xsl:with-param name="party" select="/efti:consignment/efti:carrier"/>
                      </xsl:call-template>
                    </div>
                  </div>
                </div>

                <!-- Row 3: 3 (Delivery address) | 17 (Following carrier) -->
                <div class="row">
                  <div class="cell" style="grid-column: span 6;">
                    <div class="label"><span>Adresa isporuke</span><span class="boxNo">3</span></div>
                    <div class="value">
                      <xsl:call-template name="formatLocationWithAddress">
                        <xsl:with-param name="location" select="/efti:consignment/efti:consigneeReceiptLocation"/>
                      </xsl:call-template>
                    </div>
                  </div>
                  <div class="cell" style="grid-column: span 6;">
                    <div class="label"><span>Sljedeći prijevoznik</span><span class="boxNo">17</span></div>
                    <div>
                      <xsl:choose>
                        <xsl:when test="/efti:consignment/efti:connectingCarrier">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:call-template name="formatFollowingCarrier">
                            <xsl:with-param name="carrier" select="/efti:consignment/efti:connectingCarrier"/>
                          </xsl:call-template>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:attribute name="class">value empty</xsl:attribute>—
                        </xsl:otherwise>
                      </xsl:choose>
                    </div>
                  </div>
                </div>

                <!-- Row 4: 4 (Place/date taking over) | 18 (Carrier reservations) -->
                <div class="row">
                  <div class="cell tall" style="grid-column: span 6;">
                    <div class="label"><span>Mjesto i datum preuzimanja robe</span><span class="boxNo">4</span></div>
                    <div class="value">
                      <xsl:call-template name="formatCarrierAcceptance"/>
                    </div>
                  </div>
                  <div class="cell tall" style="grid-column: span 6;">
                    <div class="label"><span>Rezerve i napomene prijevoznika</span><span class="boxNo">18</span></div>
                    <div class="value empty">—</div>
                  </div>
                </div>

                <!-- Row 5: 5 (Annexed documents) | (kept as empty like your current form) -->
                <div class="row">
                  <div class="cell tight" style="grid-column: span 6;">
                    <div class="label"><span>Priloženi dokumenti</span><span class="boxNo">5</span></div>
                    <div>
                      <xsl:choose>
                        <xsl:when test="/efti:consignment/efti:associatedDocument">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:call-template name="formatDocuments">
                            <xsl:with-param name="documents" select="/efti:consignment/efti:associatedDocument"/>
                          </xsl:call-template>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:attribute name="class">value empty</xsl:attribute>—
                        </xsl:otherwise>
                      </xsl:choose>
                    </div>
                  </div>
                  <div class="cell tight" style="grid-column: span 6;">
                    <div class="label"><span>&nbsp;</span><span class="boxNo">&nbsp;</span></div>
                    <div class="value empty">—</div>
                  </div>
                </div>

              </div>

              <!-- Goods 6–12 -->
              <div class="sectionTitle">Roba (6–12)</div>
              <div class="grid">
                <div class="row">
                  <div class="cell xl" style="grid-column: span 12; padding:0;">
                    <table class="lines" aria-label="Stavke robe">
                      <thead>
                        <tr>
                          <th style="width:12%;">6. Oznake i brojevi</th>
                          <th style="width:12%;">7. Broj paketa</th>
                          <th style="width:16%;">8. Opis pakiranja</th>
                          <th>9. Priroda robe / Naziv</th>
                          <th style="width:12%;">10. Stat. broj</th>
                          <th style="width:12%;">11. Bruto masa (kg)</th>
                          <th style="width:12%;">12. Volumen (m³)</th>
        </tr>
                      </thead>
                      <tbody>
                        <xsl:choose>
                          <xsl:when test="/efti:consignment/efti:includedConsignmentItem">
                            <xsl:for-each select="/efti:consignment/efti:includedConsignmentItem">
                              <tr>
                                <!-- Field 6: Marks and numbers -->
                                <td>
                                  <xsl:choose>
                                    <xsl:when test="efti:shippingMarks/efti:markingText">
                                      <xsl:value-of select="efti:shippingMarks/efti:markingText"/>
                                    </xsl:when>
                                    <xsl:when test="efti:transportDangerousGoods/efti:dangerousGoodsLogisticsPackage/efti:shippingMarks/efti:markingText">
                                      <xsl:value-of select="efti:transportDangerousGoods/efti:dangerousGoodsLogisticsPackage/efti:shippingMarks/efti:markingText"/>
                                    </xsl:when>
                                  </xsl:choose>
          </td>
                                <!-- Field 7: Number of packages -->
                                <td>
                                  <xsl:choose>
                                    <xsl:when test="efti:goodsUnitQuantity">
                                      <xsl:value-of select="efti:goodsUnitQuantity"/>
                                    </xsl:when>
                                    <xsl:when test="efti:transportDangerousGoods/efti:dangerousGoodsLogisticsPackage/efti:itemQuantity">
                                      <xsl:value-of select="efti:transportDangerousGoods/efti:dangerousGoodsLogisticsPackage/efti:itemQuantity"/>
                                    </xsl:when>
                                  </xsl:choose>
          </td>
                                <!-- Field 8: Description of packing -->
                                <td>
                                  <xsl:choose>
                                    <xsl:when test="efti:dimensions/efti:description">
                                      <xsl:value-of select="efti:dimensions/efti:description"/>
                                    </xsl:when>
                                    <xsl:when test="efti:associatedTransportEquipment/efti:id">
                                      <xsl:value-of select="efti:associatedTransportEquipment/efti:id"/>
                                    </xsl:when>
                                  </xsl:choose>
          </td>
                                <!-- Field 9: Nature of goods / Shipping name -->
                                <td>
                                  <xsl:choose>
                                    <xsl:when test="efti:transportDangerousGoods/efti:properShippingName">
                                      <xsl:value-of select="efti:transportDangerousGoods/efti:properShippingName"/>
                                    </xsl:when>
                                    <xsl:when test="efti:transportDangerousGoods/efti:information">
                                      <xsl:value-of select="efti:transportDangerousGoods/efti:information"/>
                                    </xsl:when>
                                  </xsl:choose>
          </td>
                                <!-- Field 10: Statistic number -->
                                <td>
                                  <xsl:if test="efti:transportDangerousGoods/efti:hazardClassificationID">
                                    <xsl:value-of select="efti:transportDangerousGoods/efti:hazardClassificationID"/>
                                  </xsl:if>
        </td>
                                <!-- Field 11: Gross weight -->
                                <td>
                                  <xsl:if test="efti:grossWeight">
                                    <xsl:value-of select="efti:grossWeight"/>
                                    <xsl:if test="efti:grossWeight/@unitId">
                                      <xsl:text> </xsl:text>
                                      <xsl:value-of select="efti:grossWeight/@unitId"/>
                                    </xsl:if>
                                  </xsl:if>
        </td>
                                <!-- Field 12: Volume -->
                                <td>
                                  <xsl:if test="efti:grossVolume">
                                    <xsl:value-of select="efti:grossVolume"/>
                                    <xsl:if test="efti:grossVolume/@unitId">
                                      <xsl:text> </xsl:text>
                                      <xsl:value-of select="efti:grossVolume/@unitId"/>
                                    </xsl:if>
                                  </xsl:if>
        </td>
      </tr>
                            </xsl:for-each>
                          </xsl:when>
                          <xsl:otherwise>
      <tr>
                              <td colspan="7" class="value empty" style="text-align:center;">Nema stavki</td>
      </tr>
                          </xsl:otherwise>
                        </xsl:choose>
                      </tbody>
    </table>

                    <!-- Totals line -->
                    <div class="goodsFooter">
                      <div>Ukupno stavki: <strong><xsl:value-of select="count(/efti:consignment/efti:includedConsignmentItem)"/></strong></div>
                      <div>Ukupno bruto: <strong>
                        <xsl:if test="/efti:consignment/efti:grossWeight">
                          <xsl:value-of select="/efti:consignment/efti:grossWeight"/>
                          <xsl:if test="/efti:consignment/efti:grossWeight/@unitId">
                            <xsl:text> </xsl:text>
                            <xsl:value-of select="/efti:consignment/efti:grossWeight/@unitId"/>
                          </xsl:if>
                        </xsl:if>
                      </strong></div>
                      <div>Ukupno volumen: <strong>
                        <xsl:if test="/efti:consignment/efti:grossVolume">
                          <xsl:value-of select="/efti:consignment/efti:grossVolume"/>
                          <xsl:if test="/efti:consignment/efti:grossVolume/@unitId">
                            <xsl:text> </xsl:text>
                            <xsl:value-of select="/efti:consignment/efti:grossVolume/@unitId"/>
                          </xsl:if>
                        </xsl:if>
                      </strong></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 13/19, 14, 15/20, 21 -->
              <div class="sectionTitle">Upute i plaćanje (13–21)</div>
              <div class="grid">

                <div class="row">
                  <div class="cell mid" style="grid-column: span 6;">
                    <div class="label"><span>Upute pošiljatelja (carina i formalnosti)</span><span class="boxNo">13</span></div>
                    <div>
                      <xsl:choose>
                        <xsl:when test="/efti:consignment/efti:consignorProvidedBorderClearanceInstructions/efti:description">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:call-template name="formatDescriptions">
                            <xsl:with-param name="descriptions" select="/efti:consignment/efti:consignorProvidedBorderClearanceInstructions/efti:description"/>
                          </xsl:call-template>
                        </xsl:when>
                        <xsl:when test="/efti:consignment/efti:cargoInsuranceInstructions">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:value-of select="/efti:consignment/efti:cargoInsuranceInstructions"/>
                        </xsl:when>
                        <xsl:when test="/efti:consignment/efti:consignorProvidedInformationText">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:value-of select="/efti:consignment/efti:consignorProvidedInformationText"/>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:attribute name="class">value empty</xsl:attribute>—
                        </xsl:otherwise>
                      </xsl:choose>
                    </div>
                  </div>
                  <div class="cell mid" style="grid-column: span 6;">
                    <div class="label"><span>Plaća</span><span class="boxNo">19</span></div>
                    <div>
                      <xsl:choose>
                        <xsl:when test="/efti:consignment/efti:applicableServiceCharge/efti:payingPartyRoleCode">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:for-each select="/efti:consignment/efti:applicableServiceCharge/efti:payingPartyRoleCode">
                            <xsl:if test="position() > 1">
                              <xsl:text>, </xsl:text>
                            </xsl:if>
                            <xsl:value-of select="."/>
                          </xsl:for-each>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:attribute name="class">value empty</xsl:attribute>—
                        </xsl:otherwise>
                      </xsl:choose>
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="cell tight" style="grid-column: span 12;">
                    <div class="label"><span>Pouzeće</span><span class="boxNo">14</span></div>
                    <div>
                      <xsl:choose>
                        <xsl:when test="/efti:consignment/efti:cODAmount">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:call-template name="formatCurrency">
                            <xsl:with-param name="amount" select="/efti:consignment/efti:cODAmount"/>
                            <xsl:with-param name="currency" select="/efti:consignment/efti:cODAmount/@currencyId"/>
                          </xsl:call-template>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:attribute name="class">value empty</xsl:attribute>—
                        </xsl:otherwise>
                      </xsl:choose>
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="cell mid" style="grid-column: span 6;">
                    <div class="label"><span>Upute za plaćanje vozarine</span><span class="boxNo">15</span></div>
                    <div>
                      <xsl:choose>
                        <xsl:when test="/efti:consignment/efti:applicableServiceCharge/efti:paymentArrangementCode">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:for-each select="/efti:consignment/efti:applicableServiceCharge/efti:paymentArrangementCode">
                            <xsl:if test="position() > 1">
                              <xsl:text>, </xsl:text>
                            </xsl:if>
                            <xsl:value-of select="."/>
                          </xsl:for-each>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:attribute name="class">value empty</xsl:attribute>—
                        </xsl:otherwise>
                      </xsl:choose>
                    </div>
                  </div>
                  <div class="cell mid" style="grid-column: span 6;">
                    <div class="label"><span>Posebni sporazumi</span><span class="boxNo">20</span></div>
                    <div>
                      <xsl:choose>
                        <xsl:when test="/efti:consignment/efti:contractTermsText">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:value-of select="/efti:consignment/efti:contractTermsText"/>
                        </xsl:when>
                        <xsl:when test="/efti:consignment/efti:carrier/efti:agreedContract/efti:signedLocation/efti:name">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:value-of select="/efti:consignment/efti:carrier/efti:agreedContract/efti:signedLocation/efti:name"/>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:attribute name="class">value empty</xsl:attribute>—
                        </xsl:otherwise>
                      </xsl:choose>
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="cell tight" style="grid-column: span 12;">
                    <div class="label"><span>Datum i mjesto izdavanja</span><span class="boxNo">21</span></div>
                    <div>
                      <xsl:choose>
                        <xsl:when test="/efti:consignment/efti:associatedDocument/efti:formattedIssueDateTime or /efti:consignment/efti:associatedDocument/efti:issueLocation">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:call-template name="formatDateAndPlace">
                            <xsl:with-param name="date" select="/efti:consignment/efti:associatedDocument/efti:formattedIssueDateTime"/>
                            <xsl:with-param name="location" select="/efti:consignment/efti:associatedDocument/efti:issueLocation"/>
                          </xsl:call-template>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:attribute name="class">value empty</xsl:attribute>—
                        </xsl:otherwise>
                      </xsl:choose>
                    </div>
                  </div>
                </div>

              </div>

              <!-- 22/23/24 -->
              <div class="sectionTitle">Potpisi (22–24)</div>
              <div class="signGrid">
                <div class="signBox">
                  <div class="label"><span>Potpis i pečat pošiljatelja</span><span class="boxNo">22</span></div>
                  <div>
                    <xsl:choose>
                      <xsl:when test="/efti:consignment/efti:consignor/efti:authoritativeSignatoryPerson/efti:name">
                        <xsl:attribute name="class">value</xsl:attribute>
                        <xsl:value-of select="/efti:consignment/efti:consignor/efti:authoritativeSignatoryPerson/efti:name[1]"/>
                      </xsl:when>
                      <xsl:otherwise>
                        <xsl:attribute name="class">value empty</xsl:attribute>—
                      </xsl:otherwise>
                    </xsl:choose>
                  </div>
                  <div class="signLine">Potpis / dokaz e-identifikacije</div>
                </div>
                <div class="signBox">
                  <div class="label"><span>Potpis i pečat prijevoznika</span><span class="boxNo">23</span></div>
                  <div>
                    <xsl:choose>
                      <xsl:when test="/efti:consignment/efti:carrier/efti:authoritativeSignatoryPerson/efti:name">
                        <xsl:attribute name="class">value</xsl:attribute>
                        <xsl:value-of select="/efti:consignment/efti:carrier/efti:authoritativeSignatoryPerson/efti:name[1]"/>
                      </xsl:when>
                      <xsl:otherwise>
                        <xsl:attribute name="class">value empty</xsl:attribute>—
                      </xsl:otherwise>
                    </xsl:choose>
                  </div>
                  <div class="signLine">Potpis / dokaz e-identifikacije</div>
                </div>
                <div class="signBox">
                  <div class="label"><span>Roba zaprimljena</span><span class="boxNo">24</span></div>
                  <div>
                    <xsl:choose>
                      <xsl:when test="/efti:consignment/efti:consignee/efti:authoritativeSignatoryPerson/efti:name">
                        <xsl:attribute name="class">value</xsl:attribute>
                        <xsl:value-of select="/efti:consignment/efti:consignee/efti:authoritativeSignatoryPerson/efti:name[1]"/>
                      </xsl:when>
                      <xsl:otherwise>
                        <xsl:attribute name="class">value empty</xsl:attribute>—
                      </xsl:otherwise>
                    </xsl:choose>
                  </div>
                  <div class="signLine">Potpis / dokaz e-identifikacije</div>
                </div>
              </div>

              <!-- 25/26/27 -->
              <div style="height:12px;"></div>
              <div class="sectionTitle">Vozilo i tarifa (25–27)</div>
              <div class="grid">
                <div class="row">
                  <div class="cell mid" style="grid-column: span 5;">
                    <div class="label"><span>Broj vozila i prikolice</span><span class="boxNo">25</span></div>
                    <div class="value">
                      <xsl:choose>
                        <xsl:when test="/efti:consignment/efti:mainCarriageTransportMovement/efti:usedTransportMeans/efti:id or /efti:consignment/efti:usedTransportEquipment/efti:id[not(ancestor::efti:affixedSeal)]">
                          <xsl:if test="/efti:consignment/efti:mainCarriageTransportMovement/efti:usedTransportMeans/efti:id">
                            <xsl:text>Vozilo: </xsl:text>
                            <xsl:value-of select="/efti:consignment/efti:mainCarriageTransportMovement/efti:usedTransportMeans/efti:id"/>
                          </xsl:if>
                          <xsl:if test="/efti:consignment/efti:usedTransportEquipment/efti:id[not(ancestor::efti:affixedSeal)]">
                            <xsl:if test="/efti:consignment/efti:mainCarriageTransportMovement/efti:usedTransportMeans/efti:id">
                              <xsl:text> / </xsl:text>
                            </xsl:if>
                            <xsl:text>Prikolica: </xsl:text>
                            <xsl:value-of select="/efti:consignment/efti:usedTransportEquipment[1]/efti:id[not(ancestor::efti:affixedSeal)][1]"/>
                          </xsl:if>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:attribute name="class">value empty</xsl:attribute>—
                        </xsl:otherwise>
                      </xsl:choose>
                    </div>
                  </div>
                  <div class="cell mid" style="grid-column: span 5;">
                    <div class="label"><span>Model vozila i prikolice</span><span class="boxNo">26</span></div>
                    <div>
                      <xsl:choose>
                        <xsl:when test="/efti:consignment/efti:usedTransportEquipment/efti:categoryCode">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:value-of select="/efti:consignment/efti:usedTransportEquipment[1]/efti:categoryCode"/>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:attribute name="class">value empty</xsl:attribute>—
                        </xsl:otherwise>
                      </xsl:choose>
                    </div>
                  </div>
                  <div class="cell mid" style="grid-column: span 2;">
                    <div class="label"><span>Tarifa</span><span class="boxNo">27</span></div>
                    <div>
                      <xsl:choose>
                        <xsl:when test="/efti:consignment/efti:applicableServiceCharge/efti:calculationBasisCode">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:value-of select="/efti:consignment/efti:applicableServiceCharge[1]/efti:calculationBasisCode"/>
                        </xsl:when>
                        <xsl:when test="/efti:consignment/efti:applicableServiceCharge/efti:appliedAmount">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:call-template name="formatCurrency">
                            <xsl:with-param name="amount" select="/efti:consignment/efti:applicableServiceCharge[1]/efti:appliedAmount"/>
                            <xsl:with-param name="currency" select="/efti:consignment/efti:applicableServiceCharge[1]/efti:appliedAmount/@currencyId"/>
                          </xsl:call-template>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:attribute name="class">value empty</xsl:attribute>—
                        </xsl:otherwise>
                      </xsl:choose>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 28 -->
              <div style="height:12px;"></div>
              <div class="sectionTitle">Tarife (28)</div>
              <div class="grid">
                <div class="row">
                  <div class="cell tight" style="grid-column: span 12;">
                    <div class="label"><span>Tarife</span><span class="boxNo">28</span></div>
                    <div>
                      <xsl:choose>
                        <xsl:when test="/efti:consignment/efti:applicableServiceCharge">
                          <xsl:attribute name="class">value</xsl:attribute>
                          <xsl:for-each select="/efti:consignment/efti:applicableServiceCharge">
                            <xsl:if test="position() > 1">
                              <xsl:text>&#10;</xsl:text>
                            </xsl:if>
                            <xsl:if test="efti:appliedAmount">
                              <xsl:call-template name="formatCurrency">
                                <xsl:with-param name="amount" select="efti:appliedAmount"/>
                                <xsl:with-param name="currency" select="efti:appliedAmount/@currencyId"/>
                              </xsl:call-template>
                            </xsl:if>
                            <xsl:if test="efti:calculationBasisCode">
                              <xsl:if test="efti:appliedAmount">
                                <xsl:text> (</xsl:text>
                              </xsl:if>
                              <xsl:value-of select="efti:calculationBasisCode"/>
                              <xsl:if test="efti:appliedAmount">
                                <xsl:text>)</xsl:text>
                              </xsl:if>
                            </xsl:if>
                          </xsl:for-each>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:attribute name="class">value empty</xsl:attribute>—
                        </xsl:otherwise>
                      </xsl:choose>
                    </div>
                  </div>
                </div>
              </div>

            </div><!-- /content -->
          </div><!-- /paper -->
        </div><!-- /page -->
      </body>
    </html>
  </xsl:template>

</xsl:stylesheet>
