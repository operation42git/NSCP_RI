import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Identifier,
  IdentifiersResponse,
  IdentifiersSearchParams,
} from './identifiersSearchTypes';
import { postIdentifiersSearch, getIdentifiersResult } from './identifiersSearchApi';
import { t } from './identifiersSearchI18n';
import styles from './IdentifiersSearch.module.css';

const COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV',
  'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'SY', 'LI', 'BO',
];

const IDENTIFIER_TYPES = ['means', 'equipment', 'carried'];

const TRANSPORT_MODES: { value: number; labelKey: string }[] = [
  { value: 1, labelKey: 'Waterway' },
  { value: 2, labelKey: 'Railway' },
  { value: 3, labelKey: 'Road' },
  { value: 4, labelKey: 'Air' },
];

interface IdentifiersSearchProps {
  locale?: string;
  identifiersDisplayBaseUrl?: string;
  onOpenIdentifier?: (identifier: Identifier) => void;
}

const IdentifiersSearch: React.FC<IdentifiersSearchProps> = ({
  locale = 'hr',
  identifiersDisplayBaseUrl = '/identifiers-display',
  onOpenIdentifier,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState<string[]>([]);
  const [registrationCountryCode, setRegistrationCountryCode] = useState('');
  const [modeCode, setModeCode] = useState<string>('');
  const [dangerousGoodsIndicator, setDangerousGoodsIndicator] = useState<string>('NA');
  const [gateIndicator, setGateIndicator] = useState<string[]>([]);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [identifierTypeDropdownOpen, setIdentifierTypeDropdownOpen] = useState(false);
  const [gateDropdownOpen, setGateDropdownOpen] = useState(false);
  const identifierTypeRef = useRef<HTMLDivElement>(null);
  const gateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (identifierTypeRef.current && !identifierTypeRef.current.contains(e.target as Node)) {
        setIdentifierTypeDropdownOpen(false);
      }
      if (gateRef.current && !gateRef.current.contains(e.target as Node)) {
        setGateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [currentSearch, setCurrentSearch] = useState<{ requestId: string; status: string }>({ requestId: '', status: '' });
  const [identifiers, setIdentifiers] = useState<Identifier[]>([]);
  const [result, setResult] = useState<IdentifiersResponse | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const getTransportModeName = (modeCode: number): string => {
    const mode = TRANSPORT_MODES.find((m) => m.value === modeCode);
    return mode ? t(mode.labelKey, locale) : `Mode ${modeCode}`;
  };

  const getDangerousGoodsIndicator = (id: Identifier): string => {
    const movements = id.mainCarriageTransportMovement;
    if (movements?.length) {
      const ind = String(movements[0].dangerousGoodsIndicator);
      if (ind === 'true') return 'YES';
      if (ind === 'false') return 'NO';
    }
    return 'N/A';
  };

  const getMainTransportMode = (id: Identifier): number | null =>
    id.mainCarriageTransportMovement?.[0]?.modeCode ?? null;

  const getMainTransportCountry = (id: Identifier): string | null =>
    id.mainCarriageTransportMovement?.[0]?.registrationCountryCode ?? null;

  const getUsedEquipmentCount = (id: Identifier): number =>
    id.usedTransportEquipment?.length ?? 0;

  const getCarriedEquipmentCount = (id: Identifier): number =>
    id.usedTransportEquipment?.reduce((sum, eq) => sum + (eq.carriedTransportEquipment?.length ?? 0), 0) ?? 0;

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const manageResult = useCallback((res: IdentifiersResponse) => {
    setResult(res);
    const list: Identifier[] = [];
    res.identifiers?.forEach((i) => {
      if (i.consignments?.length) {
        list.push(...i.consignments);
      }
    });
    setIdentifiers(list);
    setCurrentSearch((prev) => ({ ...prev, status: res.status }));
  }, []);

  const submit = async () => {
    setFormSubmitted(true);
    setError(null);
    if (!identifier?.trim()) return;

    const dangerousBool =
      dangerousGoodsIndicator === 'YES' ? true : dangerousGoodsIndicator === 'NO' ? false : null;

    const params: IdentifiersSearchParams = {
      identifier: identifier.trim(),
      identifierType: identifierType.length > 0 ? identifierType : [],
      registrationCountryCode: registrationCountryCode || undefined,
      modeCode: modeCode || undefined,
      dangerousGoodsIndicator: dangerousBool,
      eftiGateIndicator: gateIndicator.length > 0 ? gateIndicator : [],
    };

    try {
      const res = await postIdentifiersSearch(params);
      setCurrentSearch({ requestId: res.requestId, status: res.status });
      manageResult(res);
    } catch {
      setError(t('error', locale));
    }
  };

  const pollResult = useCallback(async () => {
    if (!currentSearch.requestId) return;
    try {
      const res = await getIdentifiersResult(currentSearch.requestId);
      manageResult(res);
    } catch {
      setError(t('error', locale));
    }
  }, [currentSearch.requestId, manageResult]);

  useEffect(() => {
    if (!currentSearch.requestId || currentSearch.status !== 'PENDING') return;
    const interval = setInterval(pollResult, 2000);
    return () => clearInterval(interval);
  }, [currentSearch.requestId, currentSearch.status, pollResult]);

  const reset = () => {
    setIdentifier('');
    setIdentifierType([]);
    setRegistrationCountryCode('');
    setModeCode('');
    setDangerousGoodsIndicator('NA');
    setGateIndicator([]);
    setFormSubmitted(false);
    setCurrentSearch({ requestId: '', status: '' });
    setIdentifiers([]);
    setResult(null);
    setExpandedCards(new Set());
    setError(null);
  };

  const toggleCard = (idx: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleOpenIdentifier = (id: Identifier) => {
    if (onOpenIdentifier) {
      onOpenIdentifier(id);
      return;
    }
    const url = `${identifiersDisplayBaseUrl}/${id.datasetId}`;
    window.open(url, '_blank');
  };

  const getStatusClass = (status: string) => {
    if (status === 'COMPLETE') return styles.statusComplete;
    if (status === 'ERROR') return styles.statusError;
    if (status === 'TIMEOUT') return styles.statusTimeout;
    return styles.statusPending;
  };

  const toggleIdentifierType = (item: string) => {
    setIdentifierType((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const toggleGate = (item: string) => {
    setGateIndicator((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  return (
    <div className={styles.wrapper}>
      <h5 className={styles.title}>{t('title', locale)}</h5>

      {/* Search form */}
      <div className={styles.formSection}>
        <div className={styles.sectionHeader}>{t('search', locale)}</div>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="identifier">{t('identifier', locale)}</label>
              <input
                type="text"
                id="identifier"
                className={styles.input}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder=""
              />
              {formSubmitted && !identifier?.trim() && (
                <div className={styles.invalidFeedback}>{t('form.error.required', locale) || 'This field is required'}</div>
              )}
            </div>
            <div className={styles.formGroup} ref={identifierTypeRef}>
              <label>{t('identifier-type', locale)}</label>
              <div
                className={styles.multiselect}
                onClick={() => setIdentifierTypeDropdownOpen(!identifierTypeDropdownOpen)}
              >
                {identifierType.length === 0 ? (
                  <span className={styles.placeholder}>Select</span>
                ) : (
                  <div className={styles.tags}>
                    {identifierType.map((item) => (
                      <span key={item} className={styles.tag}>
                        {item}{' '}
                        <button
                          type="button"
                          className={styles.tagRemove}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleIdentifierType(item);
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {identifierTypeDropdownOpen && (
                  <div className={styles.dropdown}>
                    {IDENTIFIER_TYPES.map((item) => (
                      <div
                        key={item}
                        className={styles.dropdownItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleIdentifierType(item);
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="registrationCountry">{t('registration-country-code', locale)}</label>
              <select
                id="registrationCountry"
                className={styles.select}
                value={registrationCountryCode}
                onChange={(e) => setRegistrationCountryCode(e.target.value)}
              >
                <option value=""> </option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="modeCode">{t('mode-code', locale)}</label>
              <select
                id="modeCode"
                className={styles.select}
                value={modeCode}
                onChange={(e) => setModeCode(e.target.value)}
              >
                <option value=""> </option>
                {TRANSPORT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{t(m.labelKey, locale)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>{t('is-dangerous-good', locale)}</label>
              <div className={styles.radioGroup}>
                {(['YES', 'NO', 'NA'] as const).map((val) => (
                  <label key={val} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="dangerousGoods"
                      value={val}
                      checked={dangerousGoodsIndicator === val}
                      onChange={() => setDangerousGoodsIndicator(val)}
                    />
                    {t(val === 'YES' ? 'yes' : val === 'NO' ? 'no' : 'na', locale)}
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.formGroup} ref={gateRef}>
              <label>{t('gate-indicator', locale)}</label>
              <div
                className={styles.multiselect}
                onClick={() => setGateDropdownOpen(!gateDropdownOpen)}
              >
                {gateIndicator.length === 0 ? (
                  <span className={styles.placeholder}>Select</span>
                ) : (
                  <div className={styles.tags}>
                    {gateIndicator.map((item) => (
                      <span key={item} className={styles.tag}>
                        {item}{' '}
                        <button
                          type="button"
                          className={styles.tagRemove}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGate(item);
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {gateDropdownOpen && (
                  <div className={styles.dropdown}>
                    {COUNTRIES.map((item) => (
                      <div
                        key={item}
                        className={styles.dropdownItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGate(item);
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.btnLink} onClick={reset}>
              {t('reset', locale)}
            </button>
            <button type="submit" className={styles.btnPrimary} id="search-btn">
              <i className="fas fa-magnifying-glass" /> {t('send-search', locale)}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {currentSearch.requestId && (
        <div className={styles.resultSection}>
          <div className={styles.sectionHeader}>{t('result', locale)}</div>
          {error && <div className={styles.errorMessage}>{error}</div>}
          <div className={styles.resultLayout}>
            <div className={styles.mapColumn}>
              <div className={styles.mapContainer}>
                <div className={styles.mapTitle}>eFTI</div>
                <div className={styles.mapPlaceholder}>
                  <div className={styles.mapLegend}>
                    <span className={styles.legendItem}><span className={styles.legendDot + ' ' + styles.legendError} /> Error</span>
                    <span className={styles.legendItem}><span className={styles.legendDot + ' ' + styles.legendGrey} /> Not called</span>
                    <span className={styles.legendItem}><span className={styles.legendDot + ' ' + styles.legendBlue} /> In Progress</span>
                    <span className={styles.legendItem}><span className={styles.legendDot + ' ' + styles.legendOrange} /> Timeout</span>
                    <span className={styles.legendItem}><span className={styles.legendDot + ' ' + styles.legendGreen} /> Success</span>
                  </div>
                  <div className={styles.mapAttribution}>Highcharts.com © Natural Earth</div>
                </div>
              </div>
            </div>
            <div className={styles.cardsColumn}>
              <div className={styles.resultHeader}>
                <div className={styles.resultMeta}>
                  <span className={styles.key}>{t('request-id', locale)}</span>
                  <span className={styles.value}>{currentSearch.requestId}</span>
                </div>
                <div className={styles.resultMeta}>
                  <span className={styles.key}>{t('status', locale)}</span>
                  <span className={getStatusClass(currentSearch.status)}>{currentSearch.status}</span>
                </div>
                <button
                  type="button"
                  className={styles.btnRefresh}
                  onClick={pollResult}
                  title={t('update-status', locale)}
                >
                  <i className="fas fa-arrows-rotate" />
                </button>
              </div>
              <div className={styles.resultCards}>
                {identifiers.length > 0 ? (
                  identifiers.map((id, i) => (
                    <div
                      key={`${id.datasetId}-${i}`}
                      className={`${styles.resultCard} ${expandedCards.has(i) ? styles.expanded : ''} ${getDangerousGoodsIndicator(id) === 'YES' ? styles.hasAdr : ''}`}
                    >
                      <div
                        className={styles.resultSummary}
                        onClick={() => toggleCard(i)}
                      >
                        <div className={styles.expandIcon}>
                          <i className={`fas fa-chevron-right ${expandedCards.has(i) ? styles.rotated : ''}`} />
                        </div>
                        <div className={styles.cardContent}>
                          <div className={styles.cardRow1}>
                            <span className={styles.gateName}>Gate{id.gateId}</span>
                            <span className={styles.separator}>|</span>
                            <span className={styles.datasetInfo}>
                              <span className={styles.datasetLabel}>{t('dataset-id', locale)}:</span>
                              <span className={styles.datasetValue}>{id.datasetId?.slice(0, 12)}…</span>
                            </span>
                            <span className={styles.separator}>|</span>
                            <span className={styles.dateInfo}>
                              <span className={styles.dateLabel}>ACCEPTED</span>
                              <span className={styles.dateValue}>{formatDate(id.carrierAcceptanceDatetime)}</span>
                            </span>
                            <span className={styles.separator}>|</span>
                            <span className={styles.dateInfo}>
                              <span className={styles.dateLabel}>DELIVERED</span>
                              <span className={styles.dateValue}>{formatDate(id.deliveryEventActualOccurrenceDatetime)}</span>
                            </span>
                          </div>
                          <div className={styles.cardRow2}>
                            {getMainTransportMode(id) != null && (
                              <span className={styles.transportBadge}>
                                {getTransportModeName(getMainTransportMode(id)!)}
                                {getMainTransportCountry(id) && ` · ${getMainTransportCountry(id)}`}
                                {getDangerousGoodsIndicator(id) === 'YES' && <span className={styles.adrBadge}> · ADR</span>}
                              </span>
                            )}
                            <span className={styles.equipmentBadge}>
                              <i className="fas fa-trailer" /> {getUsedEquipmentCount(id)}
                            </span>
                            {getCarriedEquipmentCount(id) > 0 && (
                              <span className={styles.equipmentBadge}>
                                <i className="fas fa-box" /> {getCarriedEquipmentCount(id)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenIdentifier(id);
                          }}
                          title={t('open', locale)}
                        >
                          <i className="fas fa-arrow-up-right-from-square" />
                        </button>
                      </div>
                      {expandedCards.has(i) && (
                        <div className={styles.resultDetails}>
                          <div className={styles.detailsContainer}>
                            {id.mainCarriageTransportMovement?.length > 0 && (
                              <div className={styles.detailsSection}>
                                <div className={styles.detailsSectionTitle}>{t('transport-movement', locale)}</div>
                                <div className={styles.transportList}>
                                  {id.mainCarriageTransportMovement.map((transport, ti) => (
                                    <div key={ti} className={styles.transportItem}>
                                      <span className={styles.transportDetail}>
                                        <i className={`fas fa-${transport.modeCode === 1 ? 'ship' : transport.modeCode === 2 ? 'train' : transport.modeCode === 3 ? 'truck' : 'plane'}`} />
                                        {getTransportModeName(transport.modeCode)}
                                      </span>
                                      <span className={styles.transportSep}>|</span>
                                      <span className={styles.transportDetail}>
                                        <span className={`${styles.dangerousBadge} ${String(transport.dangerousGoodsIndicator) === 'true' ? styles.dgYes : String(transport.dangerousGoodsIndicator) === 'false' ? styles.dgNo : styles.dgNa}`}>
                                          {String(transport.dangerousGoodsIndicator) === 'true' ? 'ADR' : String(transport.dangerousGoodsIndicator) === 'false' ? 'No' : 'N/A'}
                                        </span>
                                      </span>
                                      <span className={styles.transportSep}>|</span>
                                      <span className={styles.transportDetail}>{t('registration-country', locale)}: {transport.registrationCountryCode || '—'}</span>
                                      <span className={styles.transportSep}>|</span>
                                      <span className={styles.transportDetail}>{t('scheme-agency-id', locale)}: {transport.schemeAgencyId || '—'}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {id.usedTransportEquipment?.length > 0 && (
                              <div className={styles.detailsSection}>
                                <div className={styles.detailsSectionTitle}>
                                  {t('used-transport-equipment', locale)} ({id.usedTransportEquipment.length})
                                </div>
                                <div className={styles.equipmentList}>
                                  {id.usedTransportEquipment.map((eq, eqi) => (
                                    <div key={eqi} className={styles.equipmentItem}>
                                      <div className={styles.equipmentHeader}>
                                        #{eqi + 1} <span className={styles.equipmentIdBadge}>{eq.id ?? '—'}</span>
                                      </div>
                                      <div className={styles.equipmentDetails}>
                                        <span>{t('sequence-number', locale)}: {eq.sequenceNumber}</span>
                                        <span className={styles.eqSep}>|</span>
                                        <span>{t('category-code', locale)}: {eq.categoryCode || '—'}</span>
                                        <span className={styles.eqSep}>|</span>
                                        <span>{t('registration-country', locale)}: {eq.registrationCountryCode || '—'}</span>
                                        <span className={styles.eqSep}>|</span>
                                        <span>{t('scheme-agency-id', locale)}: {eq.schemeAgencyId || '—'}</span>
                                      </div>
                                      {eq.carriedTransportEquipment?.length > 0 ? (
                                        <div className={styles.carriedSection}>
                                          <div className={styles.carriedHeader}>{t('carried-equipment', locale)} ({eq.carriedTransportEquipment.length})</div>
                                          <div className={styles.carriedGrid}>
                                            {eq.carriedTransportEquipment.map((c, ci) => (
                                              <div key={ci} className={styles.carriedItem}>
                                                <span className={styles.carriedValue}>{c.id ?? '—'}</span>
                                                <span className={styles.carriedMeta}>Seq: {c.sequenceNumber}</span>
                                                {c.schemeAgencyId && <span className={styles.carriedMeta}>{c.schemeAgencyId}</span>}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className={styles.carriedSection}>
                                          <div className={styles.emptyCarried}>{t('no-carried-equipment', locale)}</div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={styles.noResults}>{t('no-results', locale)}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentifiersSearch;
