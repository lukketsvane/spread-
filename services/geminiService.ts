import { GoogleGenAI } from "@google/genai";

// Ensure API key is available
const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

async function fetchReferenceImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch reference image at ${url}`);
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Remove the data URL prefix to get raw base64
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Error loading reference image:", error);
    return null;
  }
}

export const generateIllustrationForText = async (
  textContent: string,
  stylePrompt: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }

  // We use the 'gemini-3-pro-image-preview' model (Nano Banana Pro) for high-fidelity 4K images
  const model = "gemini-3-pro-image-preview";

  // Try to load the reference image provided by the user
  const referenceImageName = "IMG_6717.jpeg"; 
  const referenceBase64 = await fetchReferenceImageAsBase64(`/${referenceImageName}`);

  const prompt = `
    Create a highly artistic, 4K resolution illustration for a magazine spread or chronicle.
    
    VISUAL STYLE REQUIRED:
    ${stylePrompt}
    
    CRITICAL STYLE INSTRUCTIONS:
    - The image MUST emulate the style of the provided reference image (if available).
    - Aesthetic: "Strek tegninger" (Line drawings).
    - Technique: Hand-drawn black ink on white paper.
    - Elements: Philosophical diagrams, arrows, circles, connecting lines, small simple figures, abstract flowcharts.
    - Atmosphere: Intellectual, minimalist, slightly cryptic, "Cyclonopedia" style diagrams.
    - Lines: Thin, shaky, organic lines. NOT vector perfection.
    - No rendered text, but you can simulate "asemic writing" or scribbles if it fits the diagrammatic style.
    
    CONTEXT FOR THE IMAGE:
    The image should conceptually represent this text segment:
    "${textContent.substring(0, 1000)}"
    
    REQUIREMENTS:
    - Aspect Ratio 16:9.
    - High contrast: Black lines, White background.
  `;

  const parts: any[] = [{ text: prompt }];

  if (referenceBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: referenceBase64
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          imageSize: "4K", // Requested 4K resolution
          aspectRatio: "16:9"
        }
      }
    });

    // Extract image from response
    // The response structure for image generation usually involves inlineData in the parts
    const candidates = response.candidates;
    if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${base64Data}`;
        }
      }
    }
    
    throw new Error("No image data found in response.");
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};