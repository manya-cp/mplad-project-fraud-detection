import { Project, AnomalyFinding, RiskCategory, AnomalySeverity } from '../types/project';

export interface AuditResult {
  riskScore: number | null;
  riskCategory: RiskCategory;
  findings: AnomalyFinding[];
  evaluatedRulesCount: number;
  dataLimitations: string[];
  recommendedActions: string[];
}

export function formatINR(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return 'Unavailable';
  return '₹' + Number(val).toLocaleString('en-IN');
}

/**
 * Runs transparent deterministic audit rules against an individual project record,
 * taking optional peer records to benchmark cost deviations and duplicate detection.
 */
export function runFraudRiskAudit(target: Project, peerProjects: Project[] = []): AuditResult {
  const findings: AnomalyFinding[] = [];
  const dataLimitations: string[] = [];
  const recommendedActions: string[] = [];

  const sanctioned = target.sanctionedAmount;
  const released = target.releasedAmount;
  const expenditure = target.recordedExpenditure;

  // Track if key numbers are present
  const hasSanctioned = sanctioned !== undefined && sanctioned !== null && !isNaN(sanctioned);
  const hasExpenditure = expenditure !== undefined && expenditure !== null && !isNaN(expenditure);
  const hasReleased = released !== undefined && released !== null && !isNaN(released);

  // Check 1: Insufficient Financial Data check
  if (!hasSanctioned || sanctioned <= 0) {
    dataLimitations.push('Sanctioned fund amount is missing or recorded as zero, limiting budget variance analysis.');
  }
  if (!hasExpenditure) {
    dataLimitations.push('Recorded expenditure figure is unavailable from the current data source.');
  }

  // RULE 1: Expenditure Exceeding Sanctioned Amount (Section 8.B)
  if (hasSanctioned && hasExpenditure && sanctioned > 0) {
    if (expenditure > sanctioned) {
      const excess = expenditure - sanctioned;
      const pctOver = ((excess / sanctioned) * 100).toFixed(1);
      const isCritical = excess / sanctioned > 0.3; // >30% overbudget is critical

      findings.push({
        ruleId: 'RULE-EXP-01',
        title: 'Expenditure Exceeds Sanctioned Amount',
        severity: isCritical ? 'Critical' : 'High',
        category: 'Expenditure',
        explanation: `The recorded project expenditure of ${formatINR(expenditure)} exceeds the formally sanctioned budget of ${formatINR(sanctioned)} by ${formatINR(excess)} (${pctOver}% excess).`,
        comparedValues: {
          labelA: 'Sanctioned Amount',
          valueA: formatINR(sanctioned),
          labelB: 'Recorded Expenditure',
          valueB: formatINR(expenditure),
          difference: `+${formatINR(excess)} (${pctOver}%)`,
        },
        evidence: `Discrepancy detected in fiscal ledger: Sanctioned = ${sanctioned}, Recorded Expenditure = ${expenditure}. Official MPLADS guidelines prohibit unapproved expenditure exceeding sanction limits without revised administrative sanction.`,
        sourceReference: target.sourceDocument || 'Project Financial Ledger',
        dataLimitations: 'Subject to whether supplementary administrative sanctions or cost escalations were issued under a separate file number.',
        recommendedAction: 'Verify whether a revised sanction order exists with the District Nodal Authority. Request contractor interim billing vouchers and technical sanction records.',
      });
      recommendedActions.push('Request verified copy of Revised Administrative Sanction Order from District Collectorate.');
    }
  }

  // RULE 2: Released Funds Exceed Sanctioned Amount
  if (hasSanctioned && hasReleased && sanctioned > 0) {
    if (released > sanctioned) {
      const excessRelease = released - sanctioned;
      findings.push({
        ruleId: 'RULE-EXP-02',
        title: 'Disbursed Funds Exceed Sanctioned Budget',
        severity: 'Moderate',
        category: 'Expenditure',
        explanation: `Total installment released to implementing agency (${formatINR(released)}) exceeds sanctioned allocation (${formatINR(sanctioned)}) by ${formatINR(excessRelease)}.`,
        comparedValues: {
          labelA: 'Sanctioned Budget',
          valueA: formatINR(sanctioned),
          labelB: 'Released to Agency',
          valueB: formatINR(released),
          difference: `+${formatINR(excessRelease)}`,
        },
        evidence: `Nodal treasury disbursement record exceeds sanctioned cap: Released = ${released}, Sanctioned = ${sanctioned}.`,
        sourceReference: target.sourceDocument || 'District Treasury Transfer Logs',
        dataLimitations: 'May represent accrued interest credited or administrative supervision charges if bundled.',
        recommendedAction: 'Reconcile District Planning Office treasury transfer logs against the sanctioned project milestone requirements.',
      });
      recommendedActions.push('Perform treasury reconciliation for milestone disbursement tranches.');
    }
  }

  // RULE 3: Financial Inconsistencies & Invalid Values (Section 8.D)
  if (hasExpenditure && expenditure < 0) {
    findings.push({
      ruleId: 'RULE-FIN-01',
      title: 'Invalid Negative Expenditure Value',
      severity: 'Critical',
      category: 'Data Integrity',
      explanation: `The project ledger contains a negative expenditure entry (${formatINR(expenditure)}), indicating potential accounting transcription discrepancy or unverified ledger reversal entry.`,
      evidence: `Recorded expenditure raw value: ${expenditure}`,
      sourceReference: 'Financial Ledger Record',
      dataLimitations: 'Could stem from an uncredited refund voucher or database ingestion parsing error.',
      recommendedAction: 'Audit line-item bank statements and cross-check ledger reversing entries.',
    });
  }

  if (hasExpenditure && hasReleased && expenditure > released) {
    const diff = expenditure - released;
    findings.push({
      ruleId: 'RULE-FIN-02',
      title: 'Recorded Expenditure Exceeds Total Released Funds',
      severity: 'High',
      category: 'Data Integrity',
      explanation: `Implementing agency reports having spent ${formatINR(expenditure)}, but only ${formatINR(released)} has been formally released from the nodal account.`,
      comparedValues: {
        labelA: 'Funds Released',
        valueA: formatINR(released),
        labelB: 'Reported Expenditure',
        valueB: formatINR(expenditure),
        difference: `+${formatINR(diff)}`,
      },
      evidence: `Physical expenditure exceeds cash release: ${expenditure} > ${released}. Indicates either agency bridge-financing or erroneous claim submissions.`,
      sourceReference: 'Utilization Certificate Record',
      dataLimitations: 'Agency may have temporarily utilized department revolving funds pending reimbursement.',
      recommendedAction: 'Inspect Utilization Certificates (UC) submitted by the implementing agency to verify fund sourcing.',
    });
    recommendedActions.push('Demand submission of certified Utilization Certificate (Form MPLADS UC-II).');
  }

  // RULE 4: Project Status Discrepancies (Section 8.E)
  if (target.status === 'Completed' && hasExpenditure && expenditure === 0 && hasSanctioned && sanctioned > 0) {
    findings.push({
      ruleId: 'RULE-STA-01',
      title: 'Project Status Marked Completed with Zero Expenditure',
      severity: 'Critical',
      category: 'Status Mismatch',
      explanation: `The project is classified in the portal as 'Completed', yet zero expenditure (₹0) has been booked against the sanctioned budget of ${formatINR(sanctioned)}.`,
      evidence: `Status = 'Completed', Recorded Expenditure = 0, Sanctioned Amount = ${sanctioned}.`,
      sourceReference: 'Status Monitoring Register',
      dataLimitations: 'Completion certificate may have been recorded prior to final invoice clearance.',
      recommendedAction: 'Conduct physical on-site photographic inspection to ascertain whether the physical civil asset exists on the ground.',
    });
    recommendedActions.push('Conduct on-site physical geotagged verification through the District Planning Officer.');
  }

  if ((target.status === 'Proposed' || target.status === 'Sanctioned') && hasExpenditure && hasSanctioned && sanctioned > 0) {
    if (expenditure >= sanctioned * 0.9) {
      findings.push({
        ruleId: 'RULE-STA-02',
        title: 'Premature Full Expenditure on Unstarted Project',
        severity: 'High',
        category: 'Status Mismatch',
        explanation: `Project status is still recorded as '${target.status}', yet ${((expenditure / sanctioned) * 100).toFixed(0)}% (${formatINR(expenditure)}) of the sanctioned allocation has already been recorded as spent.`,
        evidence: `Project Status = '${target.status}', Recorded Expenditure = ${expenditure}, Sanctioned = ${sanctioned}.`,
        sourceReference: 'Progress Monitoring Portal',
        dataLimitations: 'Status update may lag behind actual on-site civil works execution.',
        recommendedAction: 'Verify whether stage inspection reports have been filed and advance payments made to contractors.',
      });
    }
  }

  // RULE 5: Timeline Anomalies (Section 8.F)
  const dRec = target.recommendationDate ? new Date(target.recommendationDate).getTime() : null;
  const dSanc = target.sanctionDate ? new Date(target.sanctionDate).getTime() : null;
  const dComp = target.completionDate ? new Date(target.completionDate).getTime() : null;

  if (dRec && dSanc && !isNaN(dRec) && !isNaN(dSanc)) {
    if (dSanc < dRec) {
      findings.push({
        ruleId: 'RULE-TIME-01',
        title: 'Sanction Date Precedes MP Recommendation Date',
        severity: 'High',
        category: 'Timeline',
        explanation: `Administrative sanction date (${target.sanctionDate}) is chronologically earlier than the Member of Parliament recommendation date (${target.recommendationDate}). Under MPLADS rules, all projects must originate from MP recommendation.`,
        comparedValues: {
          labelA: 'MP Recommendation Date',
          valueA: target.recommendationDate || '',
          labelB: 'Administrative Sanction Date',
          valueB: target.sanctionDate || '',
        },
        evidence: `Timestamp inversion: Sanction (${target.sanctionDate}) < Recommendation (${target.recommendationDate}).`,
        sourceReference: 'Sanction Order File Tracking',
        dataLimitations: 'Date format parsing discrepancy (e.g. DD/MM/YYYY vs MM/DD/YYYY in source document) or typographical error in record entry.',
        recommendedAction: 'Verify physical dispatch register and MP letter of recommendation stamp date.',
      });
    }
  }

  if (dSanc && dComp && !isNaN(dSanc) && !isNaN(dComp)) {
    if (dComp < dSanc) {
      findings.push({
        ruleId: 'RULE-TIME-02',
        title: 'Recorded Completion Precedes Sanction Date',
        severity: 'Critical',
        category: 'Timeline',
        explanation: `Completion date (${target.completionDate}) is recorded before the project was officially sanctioned (${target.sanctionDate}).`,
        comparedValues: {
          labelA: 'Sanction Date',
          valueA: target.sanctionDate || '',
          labelB: 'Completion Date',
          valueB: target.completionDate || '',
        },
        evidence: `Completion date (${target.completionDate}) occurs prior to administrative sanction (${target.sanctionDate}).`,
        sourceReference: 'Completion Certificate Register',
        dataLimitations: 'Possible clerical recording error on the certificate issue date.',
        recommendedAction: 'Retrieve original measurement book (MB) and contractor completion handover certificate.',
      });
    }
  }

  // RULE 6: Duplicate Project Records (Section 8.A)
  // Identify potential duplicates using combination of location, category, title similarity, and MP/constituency
  if (peerProjects.length > 0) {
    const normalize = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanTitle = normalize(target.title);
    const cleanLocation = normalize(target.locationDetails || target.district);

    for (const peer of peerProjects) {
      if (peer.id === target.id) continue;

      const peerCleanTitle = normalize(peer.title);
      const peerCleanLocation = normalize(peer.locationDetails || peer.district);

      const sameCategory = target.category && peer.category && target.category.toLowerCase() === peer.category.toLowerCase();
      const sameDistrict = target.district && peer.district && target.district.toLowerCase() === peer.district.toLowerCase();

      // Check title string similarity or containment
      const titleMatches = cleanTitle.length > 10 && (cleanTitle === peerCleanTitle || cleanTitle.includes(peerCleanTitle) || peerCleanTitle.includes(cleanTitle));
      const locationMatches = sameDistrict && (cleanLocation === peerCleanLocation || cleanLocation.includes(peerCleanLocation) || peerCleanLocation.includes(cleanLocation));

      if (titleMatches && sameCategory && locationMatches) {
        findings.push({
          ruleId: 'RULE-DUP-01',
          title: 'Potential Duplicate or Overlapping Project Detected',
          severity: 'High',
          category: 'Duplication',
          explanation: `This project exhibits near-identical scope, category (${target.category}), and location details with another registered project record (ID: ${peer.id} - "${peer.title}").`,
          comparedValues: {
            labelA: `Current Project (${target.id})`,
            valueA: `${target.title} (${formatINR(target.sanctionedAmount)})`,
            labelB: `Peer Project (${peer.id})`,
            valueB: `${peer.title} (${formatINR(peer.sanctionedAmount)})`,
          },
          evidence: `High lexical and geographic overlap: District: ${target.district}, Category: ${target.category}, Titles matching. MPLADS guidelines forbid sanctioning double funding for identical civil assets.`,
          sourceReference: `Peer Reference Record: ${peer.id}`,
          dataLimitations: 'Could represent Phase-II of an identical multi-stage infrastructure project if sanctioned as separate work packages.',
          recommendedAction: 'Examine detailed work estimates and GIS asset coordinates to confirm physical asset exclusivity.',
        });
        recommendedActions.push(`Cross-verify GIS asset coordinates with overlapping project ${peer.id}.`);
        break;
      }
    }
  }

  // RULE 7: Unusual Costs & Statistical Deviation (Section 8.C)
  // Compare similar project costs only when reliable comparable records exist in the same category
  const peersInSameCategory = peerProjects.filter(
    (p) => p.category === target.category && p.sanctionedAmount > 0 && p.id !== target.id
  );

  if (peersInSameCategory.length >= 3 && hasSanctioned && sanctioned > 0) {
    const costs = peersInSameCategory.map((p) => p.sanctionedAmount).sort((a, b) => a - b);
    const mid = Math.floor(costs.length / 2);
    const medianCost = costs.length % 2 !== 0 ? costs[mid] : (costs[mid - 1] + costs[mid]) / 2;

    if (sanctioned > medianCost * 2.5) {
      const multiplier = (sanctioned / medianCost).toFixed(1);
      findings.push({
        ruleId: 'RULE-DEV-01',
        title: 'Unusual Cost Outlier Relative to Category Peer Median',
        severity: 'Moderate',
        category: 'Cost Deviation',
        explanation: `The sanctioned budget of ${formatINR(sanctioned)} is ${multiplier}x higher than the median cost (${formatINR(medianCost)}) of ${peersInSameCategory.length} comparable ${target.category} projects in the repository.`,
        comparedValues: {
          labelA: 'Project Budget',
          valueA: formatINR(sanctioned),
          labelB: `Peer Median (${peersInSameCategory.length} peers)`,
          valueB: formatINR(medianCost),
          difference: `${multiplier}x Peer Median`,
        },
        evidence: `Category '${target.category}' peer sample size = ${peersInSameCategory.length}. Project cost deviates significantly from typical standard schedule of rates (SoR).`,
        sourceReference: 'Category Comparative Baseline Analysis',
        dataLimitations: `Sample size limited to ${peersInSameCategory.length} recorded peer projects. Does not account for localized terrain difficulties, material transportation distance, or expanded capacity scale.`,
        recommendedAction: 'Audit engineering Schedule of Rates (CPWD/State PWD DSR) and bill of quantities (BOQ) technical sanction.',
      });
    }
  } else if (hasSanctioned) {
    dataLimitations.push(`Peer comparison limited: Only ${peersInSameCategory.length} comparable records found in category '${target.category || 'Unspecified'}'.`);
  }

  // RULE 8: Missing Critical Accountability Metadata (Section 8.D)
  if (!target.implementingAgency || target.implementingAgency.trim() === '') {
    findings.push({
      ruleId: 'RULE-DATA-01',
      title: 'Missing Implementing Agency Reference',
      severity: 'Low',
      category: 'Data Integrity',
      explanation: 'No implementing agency or executive department is specified in the official record.',
      evidence: 'Field implementingAgency is null or empty string.',
      sourceReference: 'Executive Agency Master',
      dataLimitations: 'Field may be omitted in summary district dashboards.',
      recommendedAction: 'Confirm the designated implementing agency in the sanction proceeding file.',
    });
  }

  // SCORE CALCULATION (Transparent & Documented)
  // If essential figures are missing completely:
  if (!hasSanctioned && !hasExpenditure) {
    return {
      riskScore: null,
      riskCategory: 'Insufficient Data',
      findings,
      evaluatedRulesCount: 8,
      dataLimitations: [
        'Critical financial metrics (both Sanctioned Amount and Recorded Expenditure) are missing.',
        ...dataLimitations,
      ],
      recommendedActions: [
        'Acquire complete financial ledger records from District Planning Office before conducting automated risk assessment.',
      ],
    };
  }

  // Weighted scoring based on finding severities:
  // Critical: 35 points
  // High: 25 points
  // Moderate: 15 points
  // Low: 5 points
  let calculatedScore = 0;
  for (const f of findings) {
    switch (f.severity) {
      case 'Critical':
        calculatedScore += 35;
        break;
      case 'High':
        calculatedScore += 25;
        break;
      case 'Moderate':
        calculatedScore += 15;
        break;
      case 'Low':
        calculatedScore += 5;
        break;
    }
  }

  // Cap score at 100
  const finalScore = Math.min(100, Math.max(0, calculatedScore));

  let category: RiskCategory = 'Low';
  if (finalScore >= 80) category = 'Critical';
  else if (finalScore >= 55) category = 'High';
  else if (finalScore >= 25) category = 'Moderate';
  else category = 'Low';

  if (recommendedActions.length === 0) {
    recommendedActions.push('No acute warning signs detected. Maintain routine quarterly milestone monitoring and physical inspection schedule.');
  }

  return {
    riskScore: finalScore,
    riskCategory: category,
    findings,
    evaluatedRulesCount: 8,
    dataLimitations,
    recommendedActions,
  };
}
