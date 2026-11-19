'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { initialBadgeTemplates } from '../badges/badgeTemplates';
import { ArrowRight, Sparkles, QrCode } from 'lucide-react';

export function BadgeShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const currentTemplate = initialBadgeTemplates[activeTab];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-800/40 text-xs font-semibold text-indigo-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Visual Badge Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            10 Distinct Built-In Badge Layouts
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Choose from calibrated templates for medical symposiums, executive summits, university colloquiums, and expos. Or customize dimensions with millimetric precision.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md flex items-center gap-2 shrink-0 self-start md:self-auto cursor-pointer"
        >
          <span>Open Interactive Designer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {initialBadgeTemplates.map((tpl, idx) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              activeTab === idx
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {tpl.name}
          </button>
        ))}
      </div>

      {/* Interactive Display Area */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 border border-slate-800">
        {/* Left: Template Details */}
        <div className="max-w-md space-y-4">
          <div className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-mono text-indigo-400">
            {currentTemplate.orientation.toUpperCase()} · {currentTemplate.widthInches}&quot; × {currentTemplate.heightInches}&quot;
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {currentTemplate.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {currentTemplate.description}
          </p>

          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Elements on Canvas ({currentTemplate.elements.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentTemplate.elements.map((el) => (
                <span
                  key={el.id}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900/80 border border-slate-700/60 text-slate-300"
                >
                  {el.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Realistic Scaled Badge Render */}
        <div className="flex-1 flex justify-center items-center py-4">
          <div
            className="badge-canvas-container relative rounded-2xl overflow-hidden shadow-2xl border border-slate-300 transition-all duration-300 select-none"
            style={{
              width: currentTemplate.orientation === 'portrait' ? '280px' : '360px',
              height: currentTemplate.orientation === 'portrait' ? '420px' : '250px',
              backgroundColor: currentTemplate.backgroundColor || '#ffffff',
            }}
          >
            {/* Lanyard Clip Slot Simulator */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1.5 rounded-full bg-slate-300 border border-slate-400/60 z-30 pointer-events-none" />

            {/* Elements */}
            {currentTemplate.elements
              .filter((e) => e.visible)
              .map((el) => {
                const style: React.CSSProperties = {
                  position: 'absolute',
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: `${el.width}%`,
                  height: `${el.height}%`,
                  fontSize: el.fontSize ? `${Math.max(8, el.fontSize * 0.75)}px` : '10px',
                  fontWeight: el.fontWeight || 'normal',
                  textAlign: el.textAlign || 'left',
                  color: el.color || '#0f172a',
                  backgroundColor: el.backgroundColor || 'transparent',
                  borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    el.textAlign === 'center'
                      ? 'center'
                      : el.textAlign === 'right'
                      ? 'flex-end'
                      : 'flex-start',
                  textTransform: el.textCase === 'uppercase' ? 'uppercase' : undefined,
                  padding: '2px 4px',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  lineHeight: 1.1,
                  zIndex: el.zIndex || 1,
                };

                if (el.type === 'qrCode') {
                  return (
                    <div key={el.id} style={style} className="p-1 flex items-center justify-center">
                      <div
                        style={{
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          borderRadius: '8px',
                          padding: '6px',
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                        }}
                      >
                        <QrCode
                          style={{
                            width: '100%',
                            height: '100%',
                            color: '#ffffff',
                            stroke: '#ffffff',
                          }}
                        />
                      </div>
                    </div>
                  );
                }

                if (el.type === 'logo') {
                  return (
                    <div key={el.id} style={style} className="font-bold tracking-tight text-slate-700">
                      <div className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-[9px] mr-1">
                        MS
                      </div>
                      <span className="text-[10px]">EVENT APEX</span>
                    </div>
                  );
                }

                if (el.type === 'name') {
                  return (
                    <div key={el.id} style={style} className="font-bold">
                      Surya Kumar
                    </div>
                  );
                }

                if (el.type === 'regNumber') {
                  return (
                    <div key={el.id} style={style} className="font-mono">
                      APX-1042-VIP
                    </div>
                  );
                }

                if (el.type === 'category') {
                  return (
                    <div key={el.id} style={style} className="font-bold tracking-wider">
                      DELEGATE PASS
                    </div>
                  );
                }

                if (el.type === 'eventName') {
                  return (
                    <div key={el.id} style={style}>
                      Global Health Summit 2026
                    </div>
                  );
                }

                if (el.type === 'designation') {
                  return (
                    <div key={el.id} style={style}>
                      Chief Operating Officer
                    </div>
                  );
                }

                if (el.type === 'company') {
                  return (
                    <div key={el.id} style={style}>
                      Apex Health Technologies
                    </div>
                  );
                }

                if (el.type === 'divider') {
                  return (
                    <div
                      key={el.id}
                      style={{
                        ...style,
                        height: '1px',
                        backgroundColor: el.backgroundColor || '#cbd5e1',
                      }}
                    />
                  );
                }

                return (
                  <div key={el.id} style={style}>
                    {el.customText || el.label}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BadgeShowcase;
