export type OpenDatasetId = 'gsm8k' | 'math_hendrycks' | 'arc' | 'openbookqa';

export interface DatasetManifest {
  id: OpenDatasetId;
  name: string;
  description: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  citation: string;
  subjects: string[];
  grades: string[];
}
