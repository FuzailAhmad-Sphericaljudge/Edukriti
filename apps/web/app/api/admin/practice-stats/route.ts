import { apiError } from '../../../../lib/api-error.ts';
import { getQuestionBankStats } from '../../../../lib/practice-provider.ts';
import { getParametricMetrics, getImportedDatasetMetrics } from '@edukriti/questions';

export async function GET() {
  try {
    const bankStats = getQuestionBankStats();
    const parametricMetrics = getParametricMetrics();
    const importedMetrics = getImportedDatasetMetrics();

    return Response.json({
      ...bankStats,
      parametricRegistry: {
        totalFamilies: parametricMetrics.totalTemplateFamilies,
        estimatedCombinations: parametricMetrics.totalCombinationsEstimate,
        bySubject: parametricMetrics.bySubject,
        familyIds: parametricMetrics.familyIds,
      },
      importedDatasets: {
        totalQuestions: importedMetrics.totalImportedQuestions,
        byDataset: importedMetrics.byDataset,
        bySubject: importedMetrics.bySubject,
        byLicense: importedMetrics.byLicense,
        verifiedCount: importedMetrics.verifiedCount,
      },
    });
  } catch (error) {
    return apiError(
      500,
      'STATS_FAILED',
      error instanceof Error ? error.message : 'Failed to retrieve practice stats',
    );
  }
}

