export type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

export interface Spread {
  id: string;
  pageNumber: number;
  textContent: string;
  imageUrl?: string;
  status: GenerationStatus;
  error?: string;
}

export interface ImageGenerationConfig {
  style: 'sketch' | 'ink' | 'minimal';
}
