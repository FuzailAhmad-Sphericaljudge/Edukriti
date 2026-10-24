import { z } from 'zod';

export type Point3D = [number, number, number];

export interface AnnotationPoint3D {
  id: string;
  title: string;
  description: string;
  position: Point3D;
  normal?: Point3D;
  partCategory?: string;
}

export interface NarrationCue3D {
  timeInSeconds: number;
  cameraPosition: Point3D;
  cameraTarget: Point3D;
  highlightPartId?: string;
  caption: string;
  action?: 'orbit' | 'zoom_in' | 'explode' | 'reset' | 'highlight';
}

export interface QuizPrompt3D {
  id: string;
  question: string;
  targetPartId: string;
  hint: string;
  successFeedback: string;
}

export interface ProceduralMeshElement {
  id: string;
  name: string;
  type: 'sphere' | 'cylinder' | 'box' | 'ring' | 'tube' | 'cone' | 'custom_mesh' | 'line';
  position: Point3D;
  rotation?: Point3D;
  scale?: Point3D;
  color: string;
  opacity?: number;
  wireframe?: boolean;
  emissive?: string;
  roughness?: number;
  metalness?: number;
  radius?: number;
  height?: number;
  radialSegments?: number;
  points?: Point3D[];
  userData?: Record<string, unknown>;
}

export interface SceneGeometryData {
  elements: ProceduralMeshElement[];
  boundingRadius: number;
  defaultCameraPosition: Point3D;
  defaultCameraTarget: Point3D;
  suggestedMeasurementPoints?: Array<{ id: string; name: string; position: Point3D }>;
  educationalSummary: {
    keyFormulas?: string[];
    constants?: Record<string, string>;
    insights: string[];
  };
}

export interface Scene3DDefinition {
  id: string;
  title: string;
  subject: 'physics' | 'chemistry' | 'biology' | 'mathematics' | 'astronomy';
  conceptIds: string[];
  description: string;
  paramKeys: string[];
  paramsSchema: z.ZodTypeAny;
  defaultParams: Record<string, unknown>;
  annotations: AnnotationPoint3D[];
  narrationCues: NarrationCue3D[];
  quizPrompts: QuizPrompt3D[];
  generateGeometry: (params?: Record<string, unknown>) => SceneGeometryData;
  validateParams: (params: Record<string, unknown>) => {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
  };
}

export const point3DSchema = z.tuple([z.number(), z.number(), z.number()]);

export const annotationPoint3DSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  position: point3DSchema,
  normal: point3DSchema.optional(),
  partCategory: z.string().optional(),
});

export const narrationCue3DSchema = z.object({
  timeInSeconds: z.number().min(0),
  cameraPosition: point3DSchema,
  cameraTarget: point3DSchema,
  highlightPartId: z.string().optional(),
  caption: z.string(),
  action: z.enum(['orbit', 'zoom_in', 'explode', 'reset', 'highlight']).optional(),
});

export const quizPrompt3DSchema = z.object({
  id: z.string(),
  question: z.string(),
  targetPartId: z.string(),
  hint: z.string(),
  successFeedback: z.string(),
});

