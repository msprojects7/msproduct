import React from 'react';
import { BadgeElement, BadgeTemplate } from '../../types';
import { 
  Type, 
  Move, 
  Maximize2, 
  Eye, 
  EyeOff, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Bold, 
  Italic, 
  Layers, 
  Trash2, 
  Plus,
  Palette,
  QrCode,
  User,
  Image,
  CreditCard,
  Building2,
  Briefcase,
  Calendar,
  Minus,
  Sparkles,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface BadgePropertiesPanelProps {
  template: BadgeTemplate;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<BadgeElement>) => void;
  onDeleteElement: (id: string) => void;
  onAddElement: (type: BadgeElement['type']) => void;
  onUpdateTemplate: (updates: Partial<BadgeTemplate>) => void;
}

export const BadgePropertiesPanel: React.FC<BadgePropertiesPanelProps> = ({
  template,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onAddElement,
  onUpdateTemplate
}) => {
  const selectedElement = template.elements.find(e => e.id === selectedElementId);

  // Alignment helpers
  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'full' | 'center-x') => {
    if (!selectedElement) return;
    if (alignment === 'left') {
      onUpdateElement(selectedElement.id, { x: 5, textAlign: 'left' });
    } else if (alignment === 'center') {
      onUpdateElement(selectedElement.id, { textAlign: 'center' });
    } else if (alignment === 'right') {
      onUpdateElement(selectedElement.id, { textAlign: 'right' });
    } else if (alignment === 'full') {
      onUpdateElement(selectedElement.id, { x: 0, width: 100 });
    } else if (alignment === 'center-x') {
      const newX = Math.max(0, Math.round((100 - selectedElement.width) / 2));
      onUpdateElement(selectedElement.id, { x: newX });
    }
  };

  const handleLayerOrder = (direction: 'front' | 'back') => {
    if (!selectedElement) return;
    const newZ = direction === 'front' 
      ? Math.max(...template.elements.map(e => e.zIndex || 1)) + 1 
      : Math.min(...template.elements.map(e => e.zIndex || 1)) - 1;
    onUpdateElement(selectedElement.id, { zIndex: Math.max(1, newZ) });
  };

  return (
    <div className="w-80 rounded-3xl glass-panel p-4 border border-slate-800 text-xs text-slate-300 flex flex-col gap-4 max-h-[780px] overflow-y-auto shrink-0 shadow-2xl">
      
      {/* SECTION 1: BADGE CANVAS SPECS */}
      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white uppercase tracking-wider text-[11px]">Badge Geometry</span>
          <span className="font-mono text-indigo-400 font-bold">
            {template.widthInches}" × {template.heightInches}"
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Preset Sizes</label>
            <select
              value={`${template.widthInches}x${template.heightInches}`}
              onChange={(e) => {
                const [w, h] = e.target.value.split('x').map(Number);
                onUpdateTemplate({ 
                  widthInches: w, 
                  heightInches: h,
                  orientation: w > h ? 'landscape' : 'portrait'
                });
              }}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="4x6">4 × 6 in (Standard)</option>
              <option value="4x3">4 × 3 in (Conference)</option>
              <option value="3x2">3 × 2 in (Pocket)</option>
              <option value="4x4">4 × 4 in (Square)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Orientation</label>
            <div className="grid grid-cols-2 gap-1 p-0.5 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => onUpdateTemplate({ orientation: 'portrait' })}
                className={`py-1 rounded-lg text-center font-medium transition-colors ${
                  template.orientation === 'portrait' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Port
              </button>
              <button
                type="button"
                onClick={() => onUpdateTemplate({ orientation: 'landscape' })}
                className={`py-1 rounded-lg text-center font-medium transition-colors ${
                  template.orientation === 'landscape' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Land
              </button>
            </div>
          </div>
        </div>

        {/* Custom Width / Height Inputs */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Width (in)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="12"
              value={template.widthInches}
              onChange={(e) => onUpdateTemplate({ widthInches: parseFloat(e.target.value) || 4 })}
              className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Height (in)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="12"
              value={template.heightInches}
              onChange={(e) => onUpdateTemplate({ heightInches: parseFloat(e.target.value) || 6 })}
              className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: COMPLETE INSERT TOOLBOX (ALL 10+ BADGE ELEMENT TYPES) */}
      <div>
        <span className="font-semibold text-white uppercase tracking-wider text-[11px] block mb-2">
          Insert Badge Element (10 Types)
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onAddElement('name')}
            className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">Attendee Name</span>
          </button>

          <button
            type="button"
            onClick={() => onAddElement('regNumber')}
            className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">Reg Number</span>
          </button>

          <button
            type="button"
            onClick={() => onAddElement('qrCode')}
            className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">Access QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => onAddElement('category')}
            className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">Category Ribbon</span>
          </button>

          <button
            type="button"
            onClick={() => onAddElement('designation')}
            className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">Designation</span>
          </button>

          <button
            type="button"
            onClick={() => onAddElement('company')}
            className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">Company / Org</span>
          </button>

          <button
            type="button"
            onClick={() => onAddElement('eventName')}
            className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">Event Header</span>
          </button>

          <button
            type="button"
            onClick={() => onAddElement('logo')}
            className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">Event Logo</span>
          </button>

          <button
            type="button"
            onClick={() => onAddElement('photo')}
            className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Image className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">Photo Avatar</span>
          </button>

          <button
            type="button"
            onClick={() => onAddElement('customText')}
            className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Type className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">Custom Text</span>
          </button>

          <button
            type="button"
            onClick={() => onAddElement('divider')}
            className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-200 flex items-center gap-1.5 transition-colors col-span-2"
          >
            <Minus className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">Horizontal Hairline Divider</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: SELECTED ELEMENT PROPERTIES (SYNCHRONIZED DIRECTLY) */}
      {selectedElement ? (
        <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/40 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-900/50">
            <div>
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">Selected Element</span>
              <span className="font-bold text-white text-xs">{selectedElement.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateElement(selectedElement.id, { visible: !selectedElement.visible })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={selectedElement.visible ? 'Hide Element' : 'Show Element'}
              >
                {selectedElement.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onDeleteElement(selectedElement.id)}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 transition-colors"
                title="Delete element"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Custom text content if applicable */}
          {selectedElement.type === 'customText' && (
            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Custom Label String</label>
              <input
                type="text"
                value={selectedElement.customText || ''}
                onChange={(e) => onUpdateElement(selectedElement.id, { customText: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
              />
            </div>
          )}

          {/* QUICK ALIGNMENT TOOLBAR */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Alignment & Placement
            </span>
            <div className="grid grid-cols-5 gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-center">
              <button
                type="button"
                onClick={() => handleAlign('left')}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
                title="Align Left (X: 5%)"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleAlign('center')}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
                title="Align Center Text"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleAlign('right')}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
                title="Align Right Text"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleAlign('center-x')}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-[10px] font-mono"
                title="Center Element Horizontally"
              >
                Center
              </button>
              <button
                type="button"
                onClick={() => handleAlign('full')}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-[10px] font-mono"
                title="Stretch Full Width (100%)"
              >
                100%
              </button>
            </div>
          </div>

          {/* Position & Coordinates (%) */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Coordinates & Dimensions (%)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px]">X:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(selectedElement.x)}
                  onChange={(e) => onUpdateElement(selectedElement.id, { x: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-transparent text-white font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px]">Y:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(selectedElement.y)}
                  onChange={(e) => onUpdateElement(selectedElement.id, { y: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-transparent text-white font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px]">W:</span>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={Math.round(selectedElement.width)}
                  onChange={(e) => onUpdateElement(selectedElement.id, { width: parseInt(e.target.value, 10) || 10 })}
                  className="w-full bg-transparent text-white font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-mono text-[10px]">H:</span>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={Math.round(selectedElement.height)}
                  onChange={(e) => onUpdateElement(selectedElement.id, { height: parseInt(e.target.value, 10) || 4 })}
                  className="w-full bg-transparent text-white font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Typography Controls (if text-based) */}
          {selectedElement.type !== 'qrCode' && selectedElement.type !== 'divider' && selectedElement.type !== 'photo' && (
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Typography & Styling
              </span>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Font Size ({selectedElement.fontSize || 14}pt)</label>
                  <input
                    type="range"
                    min="8"
                    max="36"
                    value={selectedElement.fontSize || 14}
                    onChange={(e) => onUpdateElement(selectedElement.id, { fontSize: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Style</label>
                  <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => onUpdateElement(selectedElement.id, { 
                        fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' 
                      })}
                      className={`flex-1 py-0.5 rounded text-center font-bold ${
                        selectedElement.fontWeight === 'bold' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateElement(selectedElement.id, { 
                        fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' 
                      })}
                      className={`flex-1 py-0.5 rounded text-center italic ${
                        selectedElement.fontStyle === 'italic' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateElement(selectedElement.id, { 
                        textCase: selectedElement.textCase === 'uppercase' ? 'normal' : 'uppercase' 
                      })}
                      className={`flex-1 py-0.5 rounded text-center uppercase text-[10px] ${
                        selectedElement.textCase === 'uppercase' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      AA
                    </button>
                  </div>
                </div>
              </div>

              {/* Text & Background Color Pickers */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Text Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={selectedElement.color || '#0f172a'}
                      onChange={(e) => onUpdateElement(selectedElement.id, { color: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={selectedElement.color || '#0f172a'}
                      onChange={(e) => onUpdateElement(selectedElement.id, { color: e.target.value })}
                      className="w-full px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-white font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Background Fill</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={selectedElement.backgroundColor || '#ffffff'}
                      onChange={(e) => onUpdateElement(selectedElement.id, { backgroundColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateElement(selectedElement.id, { backgroundColor: 'transparent' })}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-white"
                      title="Clear background"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Layer Arrangement */}
          <div className="pt-2 border-t border-indigo-900/40 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Layer Z-Index: {selectedElement.zIndex || 1}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleLayerOrder('front')}
                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 border border-slate-800"
              >
                <ArrowUp className="w-3 h-3" />
                <span>Bring Forward</span>
              </button>
              <button
                type="button"
                onClick={() => handleLayerOrder('back')}
                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 border border-slate-800"
              >
                <ArrowDown className="w-3 h-3" />
                <span>Send Backward</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-center text-slate-500 text-xs">
          Click any element on the badge canvas to adjust position, typography, colors, and coordinates.
        </div>
      )}

      {/* SECTION 4: ALL ELEMENTS LIST QUICK SELECTOR */}
      <div className="space-y-1.5">
        <span className="font-semibold text-white uppercase tracking-wider text-[11px] block">
          Canvas Element Hierarchy ({template.elements.length})
        </span>
        <div className="space-y-1 max-h-36 overflow-y-auto">
          {template.elements.map(el => (
            <button
              key={el.id}
              type="button"
              onClick={() => onSelectElement(el.id)}
              className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                el.id === selectedElementId 
                  ? 'bg-indigo-600 text-white font-semibold' 
                  : 'text-slate-300 bg-slate-950/50 hover:bg-slate-900 border border-slate-800/60'
              }`}
            >
              <span className="truncate">{el.label}</span>
              <span className="text-[10px] opacity-70 font-mono">Z:{el.zIndex}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
