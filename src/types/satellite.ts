export type PersonaMode = 'professional' | 'public';
export type ThemeMode = 'dark' | 'light';

export interface SatelliteScene {
  id: string;
  title: string;
  description?: string;
  sensor: string;
  acquisitionDate: string;
  resolution: string;
  crs: string;
  bbox: [number, number, number, number];
  center: [number, number];
  defaultPrompt: string;
  imageUrl: string;
  type: string;
  tags?: string[];
  precomputedIndices: {
    ndviMean: number;
    ndwiMean: number;
    cloudCover: number;
  };
}

export interface ConformalPrediction {
  coverageGuarantee: string;
  lowerBound: number;
  upperBound: number;
  pValue: number;
  nonConformityScore: number;
}

export interface RadiometricIndexDetail {
  mean: number;
  min?: number;
  max?: number;
  metricName?: string;
  interpretation: string;
}

export interface RadiometricIndices {
  ndvi: RadiometricIndexDetail;
  ndwi: RadiometricIndexDetail;
  nbrOrSar: RadiometricIndexDetail;
  ndbi?: RadiometricIndexDetail;
  ndmi?: RadiometricIndexDetail;
}

export interface SpectralBandReflectance {
  band: string;
  wavelength: string;
  reflectance: number;
}

export interface GeoreferenceGrid {
  centerLat: number;
  centerLon: number;
  resolutionMeters: number;
  crs: string;
  bbox: [number, number, number, number];
}

export interface DetectedGeoFeature {
  id: string;
  label: string;
  confidence: number;
  areaHectares: number;
  bboxPercent: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-100%
  anomalyDetected: boolean;
}

export interface ExecutionTraceStep {
  stage: string;
  durationMs: number;
  status: string;
  details: string;
}

export interface ProfessionalAnalysis {
  radiometricIndices: RadiometricIndices;
  spectralSignature: SpectralBandReflectance[];
  cloudMaskCoveragePercent: number;
  sarFusionWeight: number;
  georeferenceGrid: GeoreferenceGrid;
  detectedFeatures: DetectedGeoFeature[];
  executionTrace: ExecutionTraceStep[];
}

export interface PublicAnalysis {
  plainLanguageAnswer: string;
  everydayComparison: string;
  keyTakeaway: string;
  actionableAdvice: string;
  visualClarityRating: string;
}

export interface ProvenanceMetadata {
  timestamp: string;
  sensor: string;
  processingLevel: string;
  hash: string;
}

export interface DisasterPlaybook {
  title: string;
  subtitle: string;
  overview: string;
  canopyTitle: string;
  canopyDesc: string;
  canopyAlert: string;
  liquefactionTitle: string;
  liquefactionDesc: string;
  liquefactionAlert: string;
  rescueDesc: string;
  safeHavenDesc: string;
  damageDesc: string;
}

export interface PlainTranslation {
  headline: string;
  what_you_are_seeing: string;
  what_is_happening: string;
  why_it_matters: string;
  what_to_do: string;
}

export interface AnalysisResult {
  executiveSummary: string;
  confidenceScore: number;
  conformalPrediction: ConformalPrediction;
  professionalAnalysis: ProfessionalAnalysis;
  publicAnalysis: PublicAnalysis;
  provenance: ProvenanceMetadata;
  chartsData?: any;
  disasterPlaybook?: DisasterPlaybook;
  plainTranslation?: PlainTranslation;
  plainLanguageTranslation?: PlainTranslation;
}
