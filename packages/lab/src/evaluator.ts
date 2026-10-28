import type { LabReportSubmission, LabReportGrade, ExperimentDefinition } from './types.ts';

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
}

/**
 * Computes ordinary least squares linear regression on 2D data points.
 */
export function computeLinearRegression(points: { x: number; y: number }[]): LinearRegressionResult {
  if (points.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }
  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
    sumYY += p.y * p.y;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < 1e-12) {
    return { slope: 0, intercept: sumY / n, rSquared: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Correlation coefficient r and rSquared
  const numeratorR = n * sumXY - sumX * sumY;
  const denomR = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  const r = denomR > 0 ? numeratorR / denomR : 0;
  const rSquared = Math.max(0, Math.min(1, r * r));

  return {
    slope: parseFloat(slope.toFixed(4)),
    intercept: parseFloat(intercept.toFixed(4)),
    rSquared: parseFloat(rSquared.toFixed(4)),
  };
}

export function evaluateLabReport(
  submission: LabReportSubmission,
  experiment: ExperimentDefinition
): LabReportGrade {
  const observations = submission.observations;
  const strengths: string[] = [];
  const diagnosedMisconceptions: string[] = [];

  // 1. Evaluate Reading Accuracy
  let readingAccuracyScore = 80;
  if (observations.length >= 3) {
    readingAccuracyScore += 10;
    strengths.push(`Collected comprehensive dataset with ${observations.length} discrete observation trials.`);
  } else {
    readingAccuracyScore -= 20;
  }

  // 2. Evaluate Graph Quality via Linear Regression
  const xKey = experiment.graph.xKey;
  const yKey = experiment.graph.yKey;
  // If experiment has multiple modes (like series vs parallel), filter by primary mode (mode === 1)
  const filteredObs = observations.some((o: Record<string, number>) => o['mode'] === 1)
    ? observations.filter((o: Record<string, number>) => o['mode'] === 1)
    : observations;

  const dataPoints = filteredObs
    .map((o: Record<string, number>) => ({ x: Number(o[xKey] ?? 0), y: Number(o[yKey] ?? 0) }))
    .filter((p) => !isNaN(p.x) && !isNaN(p.y) && (p.x !== 0 || p.y !== 0));

  const regression = computeLinearRegression(dataPoints);
  let graphQualityScore = Math.round(regression.rSquared * 100);
  if (graphQualityScore >= 95) {
    strengths.push(`Outstanding experimental linearity (R² = ${regression.rSquared.toFixed(3)}) on ${experiment.graph.xLabel} vs ${experiment.graph.yLabel} plot.`);
  } else if (graphQualityScore < 80) {
    diagnosedMisconceptions.push(`Experimental scatter observed (R² = ${regression.rSquared.toFixed(3)}). Ensure steady apparatus and accurate parallax-free least count reading.`);
  }

  // 3. Evaluate Calculation & Percentage Error
  const resultCalc = experiment.calculateResult(observations);
  const theoreticalVal = resultCalc.theoreticalValue;
  const experimentalVal = submission.calculatedValue > 0 ? submission.calculatedValue : resultCalc.calculatedValue;
  const percentageError = theoreticalVal !== 0 ? Math.abs(experimentalVal - theoreticalVal) / Math.abs(theoreticalVal) * 100 : 0;

  let calculationScore = 100;
  if (percentageError <= 3.0) {
    calculationScore = 100;
    strengths.push(`High experimental accuracy: error is only ${percentageError.toFixed(2)}% (within ±3% laboratory benchmark).`);
  } else if (percentageError <= 8.0) {
    calculationScore = 85;
    strengths.push(`Good accuracy with ${percentageError.toFixed(2)}% percentage error.`);
  } else if (percentageError <= 15.0) {
    calculationScore = 70;
    diagnosedMisconceptions.push(`Moderate error of ${percentageError.toFixed(2)}%. Review zero error calibration and significant figures.`);
  } else {
    calculationScore = 50;
    diagnosedMisconceptions.push(`High error of ${percentageError.toFixed(2)}%. Re-verify formula application and unit conversions.`);
  }

  // 4. Evaluate Viva Questions
  let correctVivaCount = 0;
  const totalViva = experiment.vivaQuestions.length;
  const answeredVivaCount = Object.keys(submission.vivaAnswers).length;
  for (const q of experiment.vivaQuestions) {
    const chosen = (submission.vivaAnswers as Record<string, number>)[q.id];
    if (chosen === q.correctOptionIndex) {
      correctVivaCount++;
    } else if (chosen !== undefined && q.misconceptionTag) {
      diagnosedMisconceptions.push(`Conceptual Viva: ${q.explanation}`);
    }
  }
  const vivaScore = answeredVivaCount > 0 && totalViva > 0
    ? Math.round((correctVivaCount / totalViva) * 100)
    : 80;
  if (vivaScore === 100 && answeredVivaCount > 0) {
    strengths.push('Demonstrated flawless conceptual grasp on viva voce examination questions.');
  }

  // 5. Composite Score & Letter Grade
  const overallScore = Math.round(
    readingAccuracyScore * 0.35 +
    graphQualityScore * 0.25 +
    calculationScore * 0.20 +
    vivaScore * 0.20
  );

  let letterGrade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'B';
  if (overallScore >= 92) letterGrade = 'A+';
  else if (overallScore >= 82) letterGrade = 'A';
  else if (overallScore >= 70) letterGrade = 'B';
  else if (overallScore >= 55) letterGrade = 'C';
  else letterGrade = 'D';

  const teacherFeedback = `Teacher Aarohi's Assessment: ${
    letterGrade === 'A+' || letterGrade === 'A'
      ? 'Outstanding laboratory work! Your experimental observations were precise, the graph exhibited strong correlation, and your calculations aligned closely with physical theory.'
      : 'Good laboratory attempt. Pay closer attention to zero errors, avoid parallax while reading analog scales, and review the concept links below to reinforce underlying principles.'
  }`;

  return {
    experimentId: experiment.id,
    overallScore,
    letterGrade,
    readingAccuracyScore,
    graphQualityScore,
    calculationScore,
    vivaScore,
    percentageError: parseFloat(percentageError.toFixed(2)),
    theoreticalValue: theoreticalVal,
    experimentalValue: experimentalVal,
    strengths,
    diagnosedMisconceptions,
    teacherFeedback,
    conceptRevisionLinks: experiment.conceptIds,
  };
}
