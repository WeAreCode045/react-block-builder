
import React, { useState } from 'react';
import { PageBlock, BlockStyles } from '../types';
import { TrashIcon, MagicIcon, LayersIcon, DuplicateIcon } from './Icons';
import { FONT_SIZES, FONT_WEIGHTS, TEXT_ALIGNS, BACKGROUND_SIZES, OBJECT_FITS } from '../constants';
import { generateContentSuggestion, suggestStylePairing } from '../services/geminiService';

interface PropertiesPanelProps {
  selectedBlock: PageBlock | null;
  onUpdate: (updates: Partial<PageBlock>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedBlock, onUpdate, onDelete, onDuplicate }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!selectedBlock) {
    return (
      <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 flex items-center justify-center text-center text-slate-500">
        <div>
          <div className="flex justify-center opacity-20 mb-4">
            <LayersIcon />
          </div>
          <p className="text-sm">Select an element to edit properties</p>
        </div>
      </div>
    );
  }

  const handleStyleChange = (key: keyof BlockStyles, value: string) => {
    onUpdate({
      styles: {
        ...selectedBlock.styles,
        [key]: value
      }
    });
  };

  const handleMagicContent = async () => {
    if (selectedBlock.type !== 'title' && selectedBlock.type !== 'text') return;
    setIsAiLoading(true);
    const suggestion = await generateContentSuggestion(selectedBlock.content, selectedBlock.type);
    if (suggestion) {
      onUpdate({ content: suggestion });
    }
    setIsAiLoading(false);
  };

  const handleMagicColors = async () => {
    if (!selectedBlock.styles.backgroundColor) return;
    setIsAiLoading(true);
    const pairing = await suggestStylePairing(selectedBlock.styles.backgroundColor);
    if (pairing) {
      onUpdate({
        styles: {
          ...selectedBlock.styles,
          color: pairing.text,
          borderColor: pairing.accent
        }
      });
    }
    setIsAiLoading(false);
  };

  const inputClass = "w-full p-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-600";
  const labelClass = "text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block";
  const sectionTitleClass = "text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-800";

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden text-slate-300">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <h2 className="font-bold text-slate-200 text-xs uppercase tracking-tighter flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          {selectedBlock.type}
        </h2>
        <div className="flex gap-1">
          <button 
            onClick={() => onDuplicate(selectedBlock.id)}
            title="Duplicate"
            className="text-slate-400 hover:text-blue-400 hover:bg-slate-800 p-1.5 rounded transition-all"
          >
            <DuplicateIcon />
          </button>
          <button 
            onClick={() => onDelete(selectedBlock.id)}
            title="Delete"
            className="text-slate-400 hover:text-red-400 hover:bg-slate-800 p-1.5 rounded transition-all"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
        {/* Layout Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Layout & Sizing</h3>
            <button 
              onClick={() => handleStyleChange('width', '100%')}
              className="text-[9px] text-blue-400 hover:text-blue-300 underline"
            >
              Reset to 100%
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className={labelClass}>Width</span>
              <input
                type="text"
                className={inputClass}
                value={selectedBlock.styles.width || ''}
                onChange={(e) => handleStyleChange('width', e.target.value)}
                placeholder="100%"
              />
            </div>
            <div>
              <span className={labelClass}>Height</span>
              <input
                type="text"
                className={inputClass}
                value={selectedBlock.styles.height || ''}
                onChange={(e) => handleStyleChange('height', e.target.value)}
                placeholder="auto"
              />
            </div>
          </div>
        </div>

        {/* Container Specific */}
        {selectedBlock.type === 'container' && (
          <div>
            <h3 className={sectionTitleClass}>Container Flow</h3>
            <div className="space-y-4">
              <div>
                <span className={labelClass}>Direction</span>
                <div className="flex bg-slate-800 p-1 rounded border border-slate-700">
                  <button
                    onClick={() => handleStyleChange('flexDirection', 'column')}
                    className={`flex-1 py-1.5 text-xs rounded transition-all ${selectedBlock.styles.flexDirection === 'column' || !selectedBlock.styles.flexDirection ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Column
                  </button>
                  <button
                    onClick={() => handleStyleChange('flexDirection', 'row')}
                    className={`flex-1 py-1.5 text-xs rounded transition-all ${selectedBlock.styles.flexDirection === 'row' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Row
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className={labelClass}>Align</span>
                  <select 
                    className={inputClass}
                    value={selectedBlock.styles.alignItems || 'stretch'}
                    onChange={(e) => handleStyleChange('alignItems', e.target.value)}
                  >
                    <option value="flex-start">Start</option>
                    <option value="center">Center</option>
                    <option value="flex-end">End</option>
                    <option value="stretch">Stretch</option>
                  </select>
                </div>
                <div>
                  <span className={labelClass}>Gap</span>
                  <input
                    type="text"
                    className={inputClass}
                    value={selectedBlock.styles.gap || ''}
                    onChange={(e) => handleStyleChange('gap', e.target.value)}
                    placeholder="20px"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        {(selectedBlock.type === 'title' || selectedBlock.type === 'text' || selectedBlock.type === 'button') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Content</h3>
              <button 
                onClick={handleMagicContent}
                disabled={isAiLoading}
                className="text-[9px] bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded hover:bg-indigo-800 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <MagicIcon /> AI Smart
              </button>
            </div>
            <textarea
              className={`${inputClass} h-24 resize-none`}
              value={selectedBlock.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
            />
          </div>
        )}

        {selectedBlock.type === 'image' && (
          <div className="space-y-4">
            <h3 className={sectionTitleClass}>Image Options</h3>
            <div>
              <label className={labelClass}>Source URL</label>
              <input
                type="text"
                className={inputClass}
                value={selectedBlock.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Fit Mode</label>
              <div className="flex bg-slate-800 p-1 rounded border border-slate-700">
                <button
                  onClick={() => handleStyleChange('objectFit', 'cover')}
                  className={`flex-1 py-1.5 text-xs rounded transition-all ${selectedBlock.styles.objectFit === 'cover' || !selectedBlock.styles.objectFit ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`}
                >
                  Cover
                </button>
                <button
                  onClick={() => handleStyleChange('objectFit', 'contain')}
                  className={`flex-1 py-1.5 text-xs rounded transition-all ${selectedBlock.styles.objectFit === 'contain' ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`}
                >
                  Contain
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Style Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Appearance</h3>
            <button 
              onClick={handleMagicColors}
              disabled={isAiLoading}
              className="text-[9px] bg-purple-900/50 text-purple-300 border border-purple-700/50 px-2 py-0.5 rounded hover:bg-purple-800 transition-colors flex items-center gap-1"
            >
              <MagicIcon /> Palette
            </button>
          </div>
          <div>
            <span className={labelClass}>Background Color</span>
            <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded border border-slate-700">
              <input
                type="color"
                className="w-8 h-8 bg-transparent border-none p-0 cursor-pointer"
                value={selectedBlock.styles.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              />
              <span className="text-xs font-mono text-slate-400 uppercase">{selectedBlock.styles.backgroundColor || '#ffffff'}</span>
            </div>
          </div>
          <div>
            <span className={labelClass}>Padding</span>
            <input
              type="text"
              className={inputClass}
              value={selectedBlock.styles.padding || ''}
              onChange={(e) => handleStyleChange('padding', e.target.value)}
              placeholder="20px"
            />
          </div>
        </div>

        {/* Typography */}
        {(selectedBlock.type === 'title' || selectedBlock.type === 'text' || selectedBlock.type === 'button') && (
          <div className="space-y-4">
            <h3 className={sectionTitleClass}>Typography</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className={labelClass}>Size</span>
                <select
                  className={inputClass}
                  value={selectedBlock.styles.fontSize || '16px'}
                  onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                >
                  {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <span className={labelClass}>Alignment</span>
                <select
                  className={inputClass}
                  value={selectedBlock.styles.textAlign || 'left'}
                  onChange={(e) => handleStyleChange('textAlign', e.target.value as any)}
                >
                  {TEXT_ALIGNS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="flex-1">
              <span className={labelClass}>Text Color</span>
              <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded border border-slate-700">
                <input
                  type="color"
                  className="w-8 h-8 bg-transparent border-none p-0 cursor-pointer"
                  value={selectedBlock.styles.color || '#000000'}
                  onChange={(e) => handleStyleChange('color', e.target.value)}
                />
                <span className="text-xs font-mono text-slate-400 uppercase">{selectedBlock.styles.color || '#000000'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-slate-800 text-[9px] text-slate-600 text-center uppercase tracking-widest">
        Property Inspector Alpha
      </div>
    </div>
  );
};

export default PropertiesPanel;
