'use client';

import React from 'react';
import {
  WebsiteElement,
  WEBSITE_FONTS,
  resolveElementProperty,
} from '@/lib/website/config';
import {
  Type,
  Link as LinkIcon,
  Palette,
  Image as ImageIcon,
  Sliders,
  Move,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Upload,
  EyeOff,
  Smartphone,
  Tablet,
} from 'lucide-react';

interface ElementPropertiesPanelProps {
  element: WebsiteElement;
  previewDevice?: 'desktop' | 'tablet' | 'mobile';
  onUpdate: (patch: Partial<WebsiteElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function ElementPropertiesPanel({
  element,
  previewDevice = 'desktop',
  onUpdate,
  onDelete,
  onDuplicate,
}: ElementPropertiesPanelProps) {
  const effectiveX = resolveElementProperty(element, 'x', previewDevice);
  const effectiveY = resolveElementProperty(element, 'y', previewDevice);
  const effectiveWidth = resolveElementProperty(element, 'width', previewDevice);
  const effectiveHeight = resolveElementProperty(element, 'height', previewDevice);
  const effectiveFontSize = resolveElementProperty(element, 'fontSize', previewDevice) || element.fontSize || 16;
  const isHiddenOnDevice = Boolean(resolveElementProperty(element, 'hidden', previewDevice));

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header with Type & Quick Actions */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span>{element.type} Properties</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ locked: !element.locked })}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            title={element.locked ? 'Unlock' : 'Lock'}
          >
            {element.locked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Breakpoint Context Banner */}
      {previewDevice !== 'desktop' && (
        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300 flex items-center gap-1">
              {previewDevice === 'mobile' ? <Smartphone className="w-3 h-3" /> : <Tablet className="w-3 h-3" />}
              {previewDevice.toUpperCase()} Override Active
            </span>
            <span className="text-[9px] text-blue-600 dark:text-blue-400">Desktop untouched</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-blue-200/50 dark:border-blue-800/40">
            <span className="text-[11px] text-slate-700 dark:text-slate-200">Hide on {previewDevice}</span>
            <input
              type="checkbox"
              checked={isHiddenOnDevice}
              onChange={(e) => onUpdate({ hidden: e.target.checked } as any)}
              className="rounded text-blue-600 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* 1. TEXT SPECIFIC PROPERTIES */}
      {element.type === 'text' && (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Text Content
            </label>
            <textarea
              rows={3}
              value={element.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Font Family
            </label>
            <select
              value={element.fontFamily || 'inter'}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
            >
              {WEBSITE_FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                <span>Font Size</span>
                <span>{effectiveFontSize}px</span>
              </div>
              <input
                type="range"
                min="11"
                max="64"
                step="1"
                value={effectiveFontSize}
                onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Weight
              </label>
              <select
                value={element.fontWeight || 'normal'}
                onChange={(e) => onUpdate({ fontWeight: e.target.value as any })}
                className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800"
              >
                <option value="normal">Normal (400)</option>
                <option value="medium">Medium (500)</option>
                <option value="semibold">Semibold (600)</option>
                <option value="bold">Bold (700)</option>
                <option value="extrabold">Extra Bold (800)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Text Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={element.color || '#0f172a'}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={element.color || '#0f172a'}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="flex-1 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Transform
              </label>
              <select
                value={element.textTransform || 'none'}
                onChange={(e) => onUpdate({ textTransform: e.target.value as any })}
                className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800"
              >
                <option value="none">Normal</option>
                <option value="uppercase">UPPERCASE</option>
                <option value="capitalize">Capitalize</option>
                <option value="lowercase">lowercase</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Style
              </label>
              <select
                value={element.fontStyle || 'normal'}
                onChange={(e) => onUpdate({ fontStyle: e.target.value as any })}
                className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800"
              >
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 2. BUTTON SPECIFIC PROPERTIES */}
      {element.type === 'button' && (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Button Label
            </label>
            <input
              type="text"
              value={element.buttonText || ''}
              onChange={(e) => onUpdate({ buttonText: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 font-bold"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Destination URL / Anchor
            </label>
            <input
              type="text"
              value={element.buttonLink || '#tickets'}
              onChange={(e) => onUpdate({ buttonLink: e.target.value })}
              placeholder="#tickets or /register"
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Background Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={element.buttonBg || '#2563eb'}
                onChange={(e) => onUpdate({ buttonBg: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={element.buttonBg || '#2563eb'}
                onChange={(e) => onUpdate({ buttonBg: e.target.value })}
                className="flex-1 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Text Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={element.buttonTextColor || '#ffffff'}
                onChange={(e) => onUpdate({ buttonTextColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={element.buttonTextColor || '#ffffff'}
                onChange={(e) => onUpdate({ buttonTextColor: e.target.value })}
                className="flex-1 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
              <span>Border Radius</span>
              <span>{element.buttonRadius !== undefined ? element.buttonRadius : 10}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="28"
              step="2"
              value={element.buttonRadius !== undefined ? element.buttonRadius : 10}
              onChange={(e) => onUpdate({ buttonRadius: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Variant
              </label>
              <select
                value={element.buttonVariant || 'solid'}
                onChange={(e) => onUpdate({ buttonVariant: e.target.value as any })}
                className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800"
              >
                <option value="solid">Solid Fill</option>
                <option value="outline">Outlined</option>
                <option value="ghost">Ghost</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Icon
              </label>
              <select
                value={element.buttonIcon || 'arrow'}
                onChange={(e) => onUpdate({ buttonIcon: e.target.value as any })}
                className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800"
              >
                <option value="arrow">Chevron Arrow</option>
                <option value="ticket">Ticket Pass</option>
                <option value="calendar">Calendar</option>
                <option value="sparkles">Sparkles</option>
                <option value="none">No Icon</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. IMAGE SPECIFIC PROPERTIES */}
      {element.type === 'image' && (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Upload Image File
            </label>
            <label className="w-full p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 cursor-pointer flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/60 transition">
              <Upload className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold">Choose file...</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => onUpdate({ imageUrl: ev.target?.result as string });
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Image URL
            </label>
            <input
              type="text"
              value={element.imageUrl || ''}
              onChange={(e) => onUpdate({ imageUrl: e.target.value })}
              placeholder="https://... photo.jpg"
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Alt Text
            </label>
            <input
              type="text"
              value={element.altText || ''}
              onChange={(e) => onUpdate({ altText: e.target.value })}
              placeholder="Descriptive text for accessibility"
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Fit Mode
              </label>
              <select
                value={element.objectFit || 'cover'}
                onChange={(e) => onUpdate({ objectFit: e.target.value as any })}
                className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800"
              >
                <option value="cover">Cover (Fill & Crop)</option>
                <option value="contain">Contain (Fit Whole)</option>
                <option value="fill">Fill (Stretch)</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                <span>Radius</span>
                <span>{element.imageRadius !== undefined ? element.imageRadius : 12}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                step="2"
                value={element.imageRadius !== undefined ? element.imageRadius : 12}
                onChange={(e) => onUpdate({ imageRadius: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. CARD SPECIFIC PROPERTIES */}
      {element.type === 'card' && (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Card Content / Text
            </label>
            <textarea
              rows={2}
              value={element.content || ''}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Background Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={element.cardBg || '#ffffff'}
                onChange={(e) => onUpdate({ cardBg: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={element.cardBg || '#ffffff'}
                onChange={(e) => onUpdate({ cardBg: e.target.value })}
                className="flex-1 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Border Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={element.cardBorder || '#e2e8f0'}
                onChange={(e) => onUpdate({ cardBorder: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={element.cardBorder || '#e2e8f0'}
                onChange={(e) => onUpdate({ cardBorder: e.target.value })}
                className="flex-1 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                <span>Radius</span>
                <span>{element.cardRadius !== undefined ? element.cardRadius : 16}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="32"
                step="2"
                value={element.cardRadius !== undefined ? element.cardRadius : 16}
                onChange={(e) => onUpdate({ cardRadius: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                <span>Padding</span>
                <span>{element.cardPadding || 16}px</span>
              </div>
              <input
                type="range"
                min="8"
                max="36"
                step="2"
                value={element.cardPadding || 16}
                onChange={(e) => onUpdate({ cardPadding: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. GENERAL POSITION & DIMENSIONS */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Position & Dimensions ({previewDevice})
        </span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
              <span>X Position</span>
              <div className="flex items-center gap-0.5">
                <input
                  type="number"
                  min="0"
                  max="95"
                  value={effectiveX}
                  onChange={(e) => onUpdate({ x: Number(e.target.value) })}
                  className="w-12 px-1 py-0.5 text-[10px] font-mono border rounded bg-slate-50 dark:bg-slate-800 text-right"
                />
                <span className="text-[9px] text-slate-400">%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="2"
              value={effectiveX}
              onChange={(e) => onUpdate({ x: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
              <span>Y Position</span>
              <div className="flex items-center gap-0.5">
                <input
                  type="number"
                  min="0"
                  max="95"
                  value={effectiveY}
                  onChange={(e) => onUpdate({ y: Number(e.target.value) })}
                  className="w-12 px-1 py-0.5 text-[10px] font-mono border rounded bg-slate-50 dark:bg-slate-800 text-right"
                />
                <span className="text-[9px] text-slate-400">%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="2"
              value={effectiveY}
              onChange={(e) => onUpdate({ y: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
              <span>Width</span>
              <div className="flex items-center gap-0.5">
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={effectiveWidth}
                  onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                  className="w-12 px-1 py-0.5 text-[10px] font-mono border rounded bg-slate-50 dark:bg-slate-800 text-right"
                />
                <span className="text-[9px] text-slate-400">%</span>
              </div>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="2"
              value={effectiveWidth}
              onChange={(e) => onUpdate({ width: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
              <span>Height</span>
              <div className="flex items-center gap-0.5">
                <input
                  type="number"
                  min="24"
                  max="600"
                  value={effectiveHeight || 40}
                  onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                  className="w-12 px-1 py-0.5 text-[10px] font-mono border rounded bg-slate-50 dark:bg-slate-800 text-right"
                />
                <span className="text-[9px] text-slate-400">px</span>
              </div>
            </div>
            <input
              type="range"
              min="24"
              max="400"
              step="4"
              value={effectiveHeight || 40}
              onChange={(e) => onUpdate({ height: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
