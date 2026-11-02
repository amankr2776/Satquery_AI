/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Export GoogleGenAI under the alias GoogleGenerativeAI to satisfy naming requests
// while strictly conforming to the modern @google/genai SDK guidelines.
export { GoogleGenAI as GoogleGenerativeAI };

/**
 * Initializes the GoogleGenAI client with the VITE_GEMINI_API_KEY environment variable.
 * 
 * Note: Under production environments, API calls are recommended to be processed on the
 * server-side to safeguard credentials. In client environments, ensure VITE_GEMINI_API_KEY
 * is configured securely in your settings.
 */
export const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

/**
 * Interface representing the multi-modal inference request.
 */
export interface MultiModalInferenceRequest {
  /**
   * Base64 encoded string of the image (with or without data URI scheme prefix).
   */
  imageDataBase64: string;
  /**
   * The text prompt/query to guide the model's analysis.
   */
  textQuery: string;
  /**
   * Standard IANA MIME type for the image. Defaults to "image/png".
   */
  mimeType?: string;
}

/**
 * Sends image data and text queries to the Gemini model for multi-modal inference.
 * 
 * @param params The multi-modal query parameters including the image data and text query.
 * @returns The GenerateContentResponse from the Gemini API.
 */
export async function performMultiModalInference({
  imageDataBase64,
  textQuery,
  mimeType = "image/png",
}: MultiModalInferenceRequest): Promise<GenerateContentResponse> {
  // Strip any data URI prefix if present (e.g. "data:image/png;base64,")
  let cleanBase64 = imageDataBase64;
  if (cleanBase64.includes(";base64,")) {
    const parts = cleanBase64.split(";base64,");
    cleanBase64 = parts[1];
  }

  const imagePart = {
    inlineData: {
      mimeType,
      data: cleanBase64,
    },
  };

  const textPart = {
    text: textQuery,
  };

  const candidateModels = ["gemini-2.5-flash", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [imagePart, textPart],
        },
      });
      return response;
    } catch (error: any) {
      lastError = error;
      console.warn(`Gemini Multi-Modal Inference failed with model [${model}], trying fallback:`, error?.message || error);
    }
  }

  throw lastError;
}

/**
 * Robust async function that queries the satellite image with a prompt and persona context.
 * Uses gemini-2.5-flash (with optional fallback) for maximum throughput and highest request rates.
 * 
 * @param imageBase64 Base64 encoded string of the satellite imagery.
 * @param query Natural language user query.
 * @param persona Audience persona: 'professional' or 'public'.
 * @returns The GenerateContentResponse from Gemini.
 */
export async function querySatelliteImage(
  imageBase64: string,
  query: string,
  persona: "professional" | "public"
): Promise<GenerateContentResponse> {
  let cleanBase64 = imageBase64;
  if (cleanBase64.includes(";base64,")) {
    const parts = cleanBase64.split(";base64,");
    cleanBase64 = parts[1];
  }

  const mimeType = imageBase64.match(/data:([^;]+);/)?.[1] || "image/png";

  const imagePart = {
    inlineData: {
      mimeType,
      data: cleanBase64,
    },
  };

  const textPart = {
    text: `User Query: "${query}"\nTarget Audience Mode: ${persona}`,
  };

  const candidateModels = ["gemini-2.5-flash", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [imagePart, textPart],
        },
      });
      return response;
    } catch (error: any) {
      lastError = error;
      console.warn(`Gemini querySatelliteImage failed for persona [${persona}] with model [${model}]:`, error?.message || error);
    }
  }

  throw lastError;
}
