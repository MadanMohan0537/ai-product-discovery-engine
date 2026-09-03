export function createOpportunityBrief(opportunity) {
  if (!opportunity?.title || !Array.isArray(opportunity.evidence)) throw new TypeError("A scored opportunity with evidence is required");
  return {
    opportunity: opportunity.title,
    customerProblem: opportunity.problem,
    affectedSegments: opportunity.affectedSegments,
    evidenceSummary: `${opportunity.evidenceCount} records across ${Object.keys(opportunity.sourceCounts).length} sources`,
    potentialImpact: opportunity.score >= 70 ? "high" : opportunity.score >= 40 ? "medium" : "exploratory",
    confidence: opportunity.confidence,
    recommendedExperiment: opportunity.recommendedExperiment,
    evidenceIds: opportunity.evidence.map(item => item.id)
  };
}
