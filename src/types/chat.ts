export interface SystemCoordinateMetadata {
  regionName: string;
  centroidLat: string;
  centroidLng: string;
  bbox: [number, number, number, number];
  areaHectares: number;
  verticesCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
  timestamp: string;
  systemMetadata?: SystemCoordinateMetadata;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  selectedImage: string | null;
  createdAt: string;
}

export interface SatelliteSceneItem {
  id: string;
  title: string;
  location: string;
  description: string;
  category: 'Disaster' | 'Urban' | 'Ecology' | 'Agriculture' | 'Geologic' | 'Coastal';
  imageUrl: string;
  defaultPrompt: string;
}
