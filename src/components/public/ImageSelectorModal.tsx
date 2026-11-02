import React, { useState } from 'react';
import { X, Upload, Grid, Check, Image as ImageIcon, Sparkles } from 'lucide-react';
import { SatelliteSceneItem } from '../../types/chat';

export const PRELOADED_SCENES: SatelliteSceneItem[] = [
  {
    id: 'kerala-flood',
    title: 'Kerala Monsoon Flood Impact (Sentinel-1 SAR)',
    location: 'Wayanad & Periyar Delta, Kerala, India',
    description: 'Microwave backscatter specular reflection mapping water logging and submerged roads through heavy monsoon cloud cover.',
    category: 'Disaster',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=76.0,10.0,76.5,11.5&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Analyze Sentinel-1 SAR backscatter for flood inundation boundaries and submerged transportation corridors.'
  },
  {
    id: 'wayanad-landslide',
    title: 'Wayanad Landslide Scar (NISAR L-Band SAR)',
    location: 'Chooralmala, Wayanad, India',
    description: 'L-band polarimetric SAR ground penetration resolving headscarp erosion, debris flow tracks, and washed-out structural lines.',
    category: 'Disaster',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=76.15,11.45,76.35,11.65&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Evaluate NISAR L-band SAR backscatter to map mudslide debris runout and structural collapse.'
  },
  {
    id: 'assam-brahmaputra-sar',
    title: 'Assam Brahmaputra Basin (Sentinel-1 C-Band SAR)',
    location: 'Kaziranga & Majuli, Assam, India',
    description: 'Cloud-penetrating C-band radar intensity monitoring active river bank spillover, embankment breaches, and wildlife reserve flooding.',
    category: 'Disaster',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=92.5,26.2,93.5,26.9&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Perform Sentinel-1 C-Band SAR backscatter extraction for Brahmaputra river overflow and embankment breach analysis.'
  },
  {
    id: 'punjab-stubble',
    title: 'Punjab Agricultural Stubble Fires (Radar-Optical Fusion)',
    location: 'Ludhiana & Patiala, Punjab, India',
    description: 'Multi-sensor fusion combining Sentinel-2 Shortwave Infrared with SAR surface roughness to isolate carbonized burn scars.',
    category: 'Agriculture',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=75.5,30.5,76.5,31.5&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Map active agricultural burn scars and estimate burned farmland area in hectares.'
  },
  {
    id: 'nisar-soil-moisture',
    title: 'Punjab Crop Moisture & Roughness (NISAR Dual-Pol)',
    location: 'Jalandhar & Sangrur, Punjab, India',
    description: 'NISAR L-band HH/HV polarimetric decomposition mapping root-zone soil moisture and crop height canopy structure.',
    category: 'Agriculture',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=75.2,31.0,75.9,31.6&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Analyze NISAR polarimetric backscatter to measure agricultural soil moisture levels and crop canopy structure.'
  },
  {
    id: 'valencia-mudflow',
    title: 'Valencia Suburban Mudflow Inundation',
    location: 'Sedaví & Paiporta, Valencia, Spain',
    description: 'Severe storm-induced flash flooding and thick sediment deposition submerging roads.',
    category: 'Disaster',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-0.5,39.3,-0.2,39.6&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Examine mudflow sediment boundaries across urban districts.'
  },
  {
    id: 'houston-flood-sar',
    title: 'Houston Urban Storm Inundation (Sentinel-1 SAR)',
    location: 'Houston & Galveston Bay, Texas, USA',
    description: 'Sentinel-1 VV backscatter specular reflection detecting urban roadway flooding and residential water pooling through hurricane clouds.',
    category: 'Disaster',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-95.5,29.5,-95.0,30.0&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Use Sentinel-1 SAR microwave reflection to detect urban road flooding and standing water levels.'
  },
  {
    id: 'amazon-logging',
    title: 'Amazon Canopy Structure (ALOS-2 PALSAR SAR)',
    location: 'Pará Region, Amazon Basin, Brazil',
    description: 'L-band microwave backscatter penetrating dense tropical cloud cover to expose selective logging tracks and canopy biomass loss.',
    category: 'Ecology',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-53.0,-4.0,-51.0,-2.0&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Analyze ALOS-2 SAR canopy penetration to isolate illegal forest clearing corridors.'
  },
  {
    id: 'mumbai-urban',
    title: 'Mumbai Coastal Reclamation (TerraSAR-X SAR)',
    location: 'South Mumbai & Coastal Road, India',
    description: 'High-resolution X-band SAR amplitude returning intense urban double-bounce reflections for seawall and highway construction.',
    category: 'Urban',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=72.7,18.8,73.1,19.2&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Identify coastal land reclamation structures using X-band SAR double-bounce backscatter.'
  },
  {
    id: 'sundarbans-mangrove',
    title: 'Sundarbans Estuarine Mangroves (Sentinel-1 SAR)',
    location: 'Bay of Bengal, India/Bangladesh',
    description: 'Radar backscatter ratio (VV/VH) analyzing tidal inundation dynamics and dense mangrove roots under cloud cover.',
    category: 'Ecology',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=88.5,21.5,89.5,22.5&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Assess mangrove canopy structure and tidal water boundaries using dual-pol SAR.'
  },
  {
    id: 'himalayan-glacial',
    title: 'Sikkim Glacial Lake Outburst (NISAR SAR)',
    location: 'South Lhonak, Sikkim, India',
    description: 'Proglacial lake expansion and moraine dam stability monitoring through high-altitude cloud cover.',
    category: 'Geologic',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=88.1,27.6,88.4,27.9&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Detect glacial lake surface boundary changes using NISAR L-band SAR backscatter.'
  },
  {
    id: 'california-wildfire',
    title: 'California Wildfire Burn Scar (SAR Soil Coherence)',
    location: 'Sierra Nevada, California, USA',
    description: 'Interferometric SAR coherence degradation mapping severe vegetation loss and hydrophobic soil conditions.',
    category: 'Disaster',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-121.5,39.5,-120.5,40.5&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Map active wildfire burn scars and soil coherence loss using SAR microwave reflectance.'
  },
  {
    id: 'dubai-palm',
    title: 'Dubai Coastal Infrastructure (TerraSAR-X)',
    location: 'Persian Gulf, Dubai, UAE',
    description: 'X-band radar phase stability monitoring land subsidence and breakwater integrity.',
    category: 'Urban',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=55.1,25.0,55.2,25.1&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Evaluate coastal infrastructure stability using high-frequency SAR backscatter.'
  },
  {
    id: 'reykjanes-volcano',
    title: 'Reykjanes Volcanic Fissure (SAR Interferometry)',
    location: 'Reykjanes Peninsula, Iceland',
    description: 'SAR interferometric fringe patterns mapping ground displacement and fresh lava field boundaries.',
    category: 'Geologic',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=-22.5,63.8,-22.3,63.9&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Delineate volcanic lava flows and ground deformation fringes using SAR backscatter.'
  },
  {
    id: 'nile-delta',
    title: 'Nile Delta Agricultural Irrigation Grid',
    location: 'Nile Basin, Egypt',
    description: 'Soil moisture and crop vigor monitoring across irrigated Nile farmland parcels.',
    category: 'Agriculture',
    imageUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=30.0,30.0,32.0,31.5&bboxSR=4326&size=800,500&format=jpg&f=image',
    defaultPrompt: 'Analyze crop foliage vigor and soil moisture distribution across Nile farmlands.'
  }
];

interface ImageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, title?: string, prompt?: string) => void;
}

export const ImageSelectorModal: React.FC<ImageSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUploadUrl, setPreviewUploadUrl] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreviewUploadUrl(base64);
      setUploadFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmSelection = () => {
    if (activeTab === 'upload' && previewUploadUrl) {
      onSelectImage(previewUploadUrl, uploadFileName || 'Uploaded Image');
      onClose();
    } else if (activeTab === 'library' && selectedSceneId) {
      const scene = PRELOADED_SCENES.find((s) => s.id === selectedSceneId);
      if (scene) {
        onSelectImage(scene.imageUrl, scene.title, scene.defaultPrompt);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-4xl bg-[#F3F4F1] text-[#2A1B2E] rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]"
        style={{ fontFamily: 'Calibri, system-ui, sans-serif' }}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#FF8C00]" />
            <h2 className="text-lg font-bold text-[#2A1B2E]">Select Satellite Image Source</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-[#2A1B2E] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="px-6 pt-4 bg-[#F3F4F1] border-b border-slate-200 flex gap-2">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 font-semibold text-sm rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 border-t border-x ${
              activeTab === 'library'
                ? 'bg-white text-[#2A1B2E] border-slate-200 border-b-transparent shadow-sm'
                : 'text-slate-600 hover:text-[#2A1B2E] border-transparent'
            }`}
          >
            <Grid className="w-4 h-4 text-[#FF8C00]" />
            <span>Preloaded Library (12 Scenes)</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 font-semibold text-sm rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 border-t border-x ${
              activeTab === 'upload'
                ? 'bg-white text-[#2A1B2E] border-slate-200 border-b-transparent shadow-sm'
                : 'text-slate-600 hover:text-[#2A1B2E] border-transparent'
            }`}
          >
            <Upload className="w-4 h-4 text-[#FF8C00]" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {activeTab === 'library' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Choose a pre-analyzed, high-resolution satellite scene from our global constellation archive:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {PRELOADED_SCENES.map((scene) => {
                  const isSelected = selectedSceneId === scene.id;
                  return (
                    <div
                      key={scene.id}
                      onClick={() => setSelectedSceneId(scene.id)}
                      className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 flex flex-col ${
                        isSelected
                          ? 'border-[#FF8C00] bg-amber-50/50 shadow-md ring-2 ring-[#FF8C00]/20'
                          : 'border-slate-200 bg-[#F3F4F1]/40 hover:border-slate-400 hover:bg-[#F3F4F1]'
                      }`}
                    >
                      <div className="h-32 w-full overflow-hidden bg-slate-200 relative">
                        <img
                          src={scene.imageUrl}
                          alt={scene.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-black/60 text-white backdrop-blur-xs">
                          {scene.category}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 p-1 bg-[#FF8C00] text-white rounded-full shadow">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-[#2A1B2E] line-clamp-1">{scene.title}</h4>
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">{scene.location}</span>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-snug">{scene.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Upload your own satellite raster, drone photo, or imagery file (PNG, JPG, WebP, GeoTIFF):
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors flex flex-col items-center justify-center min-h-[220px] cursor-pointer ${
                  isDragging
                    ? 'border-[#FF8C00] bg-amber-50/60'
                    : 'border-slate-300 bg-[#F3F4F1]/30 hover:border-slate-400 hover:bg-[#F3F4F1]'
                }`}
                onClick={() => {
                  const input = document.getElementById('modal-file-upload-input');
                  if (input) input.click();
                }}
              >
                <input
                  id="modal-file-upload-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                {previewUploadUrl ? (
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="w-40 h-28 rounded-lg overflow-hidden border border-slate-300 shadow-sm relative">
                      <img src={previewUploadUrl} alt="Upload preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-semibold text-[#2A1B2E]">{uploadFileName}</span>
                    <span className="text-[11px] text-[#FF8C00] underline font-medium">Click to change file</span>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="p-3 bg-[#FF8C00]/10 text-[#FF8C00] rounded-full">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-sm text-[#2A1B2E]">Drag & Drop your image here</div>
                    <div className="text-xs text-slate-500">or click to browse local files</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#F3F4F1] border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-[#2A1B2E] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={
              (activeTab === 'library' && !selectedSceneId) ||
              (activeTab === 'upload' && !previewUploadUrl)
            }
            className="px-5 py-2 rounded-xl bg-[#FF8C00] hover:bg-[#e07b00] disabled:opacity-40 disabled:hover:bg-[#FF8C00] text-white font-bold text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <span>Attach Selected Image</span>
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
