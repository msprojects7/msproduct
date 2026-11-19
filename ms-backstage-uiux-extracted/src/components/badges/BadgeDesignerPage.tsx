import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../navigation/BackButton';
import { BadgeCanvas } from './BadgeCanvas';
import { BadgePropertiesPanel } from './BadgePropertiesPanel';
import { BadgeElement, BadgeTemplate, Attendee } from '../../types';
import { 
  Save, 
  Printer, 
  RotateCcw, 
  Eye, 
  Sparkles, 
  Layers, 
  Copy, 
  Trash2, 
  Undo2, 
  Redo2,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { initialBadgeTemplates } from '../../lib/badge-templates';

export const BadgeDesignerPage: React.FC = () => {
  const { 
    activeBadgeTemplate, 
    setActiveBadgeTemplate, 
    saveBadgeTemplate, 
    badgeTemplates, 
    attendees, 
    selectedBadgeAttendee, 
    setSelectedBadgeAttendee, 
    navigate, 
    addToast,
    openConfirm 
  } = useApp();

  // Local working copy of the active template
  const [template, setTemplate] = useState<BadgeTemplate>(activeBadgeTemplate);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(template.elements[0]?.id || null);
  const [history, setHistory] = useState<BadgeTemplate[]>([activeBadgeTemplate]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Push to undo stack
  const updateTemplateWithHistory = (newTemplate: BadgeTemplate) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newTemplate);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setTemplate(newTemplate);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setTemplate(prev);
      addToast({ type: 'info', title: 'Undo', message: 'Reverted previous change.' });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setTemplate(next);
      addToast({ type: 'info', title: 'Redo', message: 'Restored change.' });
    }
  };

  const handleSelectTemplate = (tplId: string) => {
    const found = badgeTemplates.find(t => t.id === tplId) || initialBadgeTemplates.find(t => t.id === tplId);
    if (found) {
      setTemplate(found);
      setActiveBadgeTemplate(found);
      setSelectedElementId(found.elements[0]?.id || null);
      setHistory([found]);
      setHistoryIndex(0);
      addToast({
        type: 'info',
        title: `Template Loaded: ${found.name}`,
        message: 'Canvas coordinates updated.'
      });
    }
  };

  const handleUpdateElement = (id: string, updates: Partial<BadgeElement>) => {
    const newElements = template.elements.map(el => el.id === id ? { ...el, ...updates } : el);
    const updated = { ...template, elements: newElements };
    setTemplate(updated);
  };

  const handleDeleteElement = (id: string) => {
    const newElements = template.elements.filter(el => el.id !== id);
    const updated = { ...template, elements: newElements };
    updateTemplateWithHistory(updated);
    setSelectedElementId(null);
    addToast({ type: 'info', title: 'Element Removed', message: 'Element deleted from badge layout.' });
  };

  const handleAddElement = (type: BadgeElement['type']) => {
    const newId = 'el-' + Math.random().toString(36).substring(2, 8);
    const newElement: BadgeElement = {
      id: newId,
      type,
      label: type === 'customText' ? 'Custom Text' : type.toUpperCase(),
      x: 10,
      y: 50,
      width: 80,
      height: 8,
      fontSize: 14,
      fontWeight: 'normal',
      textAlign: 'center',
      color: '#0f172a',
      visible: true,
      zIndex: template.elements.length + 1,
      customText: type === 'customText' ? 'VIP Access Area' : undefined
    };

    const updated = { ...template, elements: [...template.elements, newElement] };
    updateTemplateWithHistory(updated);
    setSelectedElementId(newId);
    addToast({ type: 'success', title: 'Element Added', message: `Inserted ${newElement.label} onto canvas.` });
  };

  const handleSave = () => {
    saveBadgeTemplate(template);
    setActiveBadgeTemplate(template);
  };

  const handleResetToDefault = () => {
    openConfirm({
      title: 'Reset Template to Default?',
      message: 'This will reset all coordinates, elements, and dimensions of this template to its original preset geometry.',
      confirmLabel: 'Reset Layout',
      isDestructive: true,
      onConfirm: () => {
        const original = initialBadgeTemplates.find(t => t.id === template.id) || initialBadgeTemplates[0];
        setTemplate(original);
        setActiveBadgeTemplate(original);
        setHistory([original]);
        setHistoryIndex(0);
        addToast({ type: 'info', title: 'Template Reset', message: 'Restored original preset geometry.' });
      }
    });
  };

  const handleDuplicate = () => {
    const dup: BadgeTemplate = {
      ...template,
      id: 'tpl-copy-' + Math.random().toString(36).substring(2, 7),
      name: `${template.name} (Copy)`
    };
    saveBadgeTemplate(dup);
    setTemplate(dup);
    setActiveBadgeTemplate(dup);
    addToast({ type: 'success', title: 'Template Duplicated', message: `Created "${dup.name}".` });
  };

  return (
    <div className="w-full pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-4">
        
        {/* TOP BAR WITH PREDICTABLE NAVIGATION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <BackButton label="Back to Badge Desk" targetRoute="badges" />
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Interactive Badge Designer</span>
              </h1>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Template Selector Dropdown */}
            <div className="relative">
              <select
                value={template.id}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 pr-8"
              >
                {initialBadgeTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.orientation})</option>
                ))}
              </select>
            </div>

            {/* Undo / Redo */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex === 0}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg"
                title="Redo"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Duplicate */}
            <button
              onClick={handleDuplicate}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs"
              title="Duplicate current layout"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Reset */}
            <button
              onClick={handleResetToDefault}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs"
              title="Reset template coordinates to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Save Layout */}
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Layout</span>
            </button>

            {/* Print Preview */}
            <button
              onClick={() => {
                setActiveBadgeTemplate(template);
                navigate('print-preview');
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Preview</span>
            </button>
          </div>
        </div>

        {/* SAMPLE ATTENDEE PICKER STRIP */}
        <div className="p-2.5 rounded-2xl glass-dock flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-semibold text-white">Previewing with Sample Identity:</span>
            <span className="font-bold text-indigo-300">{selectedBadgeAttendee.fullName}</span>
            <span className="text-slate-500 font-mono">({selectedBadgeAttendee.registrationNumber} · {selectedBadgeAttendee.category})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Test other attendee fits:</span>
            <select
              value={selectedBadgeAttendee.id}
              onChange={(e) => {
                const found = attendees.find(a => a.id === e.target.value);
                if (found) setSelectedBadgeAttendee(found);
              }}
              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white font-medium text-xs focus:outline-none"
            >
              {attendees.map(a => (
                <option key={a.id} value={a.id}>{a.fullName} ({a.category})</option>
              ))}
            </select>
          </div>
        </div>

        {/* WORKSPACE CENTERPIECE: CANVAS & SIDE PROPERTIES PANEL */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* INTERACTIVE CANVAS */}
          <BadgeCanvas
            template={template}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={handleUpdateElement}
            sampleAttendee={selectedBadgeAttendee}
          />

          {/* SYNCHRONIZED PROPERTIES INSPECTOR PANEL */}
          <BadgePropertiesPanel
            template={template}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onAddElement={handleAddElement}
            onUpdateTemplate={(updates) => {
              const updated = { ...template, ...updates };
              updateTemplateWithHistory(updated);
            }}
          />
        </div>

      </div>
    </div>
  );
};
