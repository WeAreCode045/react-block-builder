
import React from 'react';
import { PageBlock } from '../types';
import BlockRenderer from './BlockRenderer';

interface PreviewModalProps {
  blocks: PageBlock[];
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ blocks, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      <div className="h-16 bg-slate-900 text-white flex items-center justify-between px-6">
        <span className="font-bold">Live Preview</span>
        <button 
          onClick={onClose}
          className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm transition-colors"
        >
          Exit Preview
        </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-200 flex justify-center p-8">
        <div className="bg-white shadow-2xl w-full max-w-5xl overflow-hidden">
          {blocks.map(block => (
            <BlockRenderer 
              key={block.id} 
              block={block} 
              selectedBlockId={null} 
              onSelect={() => {}} 
              onDrop={() => {}}
              onDragStart={() => {}}
              onResize={() => {}}
              isPreview={true} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
