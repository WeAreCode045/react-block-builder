
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import PropertiesPanel from './components/PropertiesPanel';
import BlockRenderer from './components/BlockRenderer';
import PreviewModal from './components/PreviewModal';
import { PageBlock, BlockType, SavedPage } from './types';
import { INITIAL_BLOCKS } from './constants';
import { PreviewIcon, PlusIcon } from './components/Icons';
import { exportBlocksToHtml } from './services/htmlExportService';

const App: React.FC = () => {
  const [blocks, setBlocks] = useState<PageBlock[]>(INITIAL_BLOCKS);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('lumina_current_page');
    if (saved) {
      try {
        setBlocks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved page", e);
      }
    }
  }, []);

  const saveToLocalStorage = () => {
    localStorage.setItem('lumina_current_page', JSON.stringify(blocks));
    alert('Project saved to browser storage!');
  };

  const handleExportHtml = () => {
    const html = exportBlocksToHtml(blocks);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina-template-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const findBlockById = (currentBlocks: PageBlock[], id: string): PageBlock | null => {
    for (const block of currentBlocks) {
      if (block.id === id) return block;
      if (block.children) {
        const found = findBlockById(block.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const isDescendant = (parent: PageBlock, targetId: string): boolean => {
    if (!parent.children) return false;
    for (const child of parent.children) {
      if (child.id === targetId) return true;
      if (isDescendant(child, targetId)) return true;
    }
    return false;
  };

  const createNewBlock = (type: BlockType): PageBlock => {
    const newId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    return {
      id: newId,
      type,
      content: type === 'title' ? 'New Title' : 
               type === 'text' ? 'New Text Content' : 
               type === 'image' ? 'https://picsum.photos/800/400' : 
               type === 'button' ? 'Click Me' : '',
      styles: type === 'container' ? {
        padding: '20px',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '100px',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        gap: '20px'
      } : { padding: '10px 0', width: '100%' },
      children: type === 'container' ? [] : undefined
    };
  };

  const handleResizeBlock = (id: string, newWidth: string) => {
    const updateRecursive = (list: PageBlock[], parentLayout?: string): PageBlock[] => {
      const newList = [...list];
      const index = newList.findIndex(b => b.id === id);
      
      if (index !== -1) {
        const currentBlock = newList[index];
        const oldWidthVal = parseFloat(currentBlock.styles.width || '100');
        const newWidthVal = parseFloat(newWidth);
        
        newList[index] = {
          ...currentBlock,
          styles: { ...currentBlock.styles, width: newWidth }
        };

        if (parentLayout === 'row') {
          const nextSibling = newList[index + 1];
          if (nextSibling && nextSibling.styles.width?.includes('%')) {
            const nextWidthVal = parseFloat(nextSibling.styles.width);
            const diff = newWidthVal - oldWidthVal;
            const adjustedNextWidth = Math.max(5, nextWidthVal - diff);
            newList[index + 1] = {
              ...nextSibling,
              styles: { ...nextSibling.styles, width: `${adjustedNextWidth.toFixed(1)}%` }
            };
          }
        }
        return newList;
      }

      return newList.map(block => {
        if (block.children) {
          return { 
            ...block, 
            children: updateRecursive(block.children, block.styles.flexDirection || 'column') 
          };
        }
        return block;
      });
    };

    setBlocks(prev => updateRecursive(prev));
  };

  const handleDrop = (sourceId: string | null, sourceType: BlockType | null, targetId: string) => {
    if (sourceId === targetId) return;

    let blockToInsert: PageBlock | null = null;
    let newBlocksList = [...blocks];

    if (sourceId) {
      const sourceBlock = findBlockById(blocks, sourceId);
      if (!sourceBlock || isDescendant(sourceBlock, targetId)) return;

      const removeSource = (list: PageBlock[]): PageBlock[] => {
        return list.reduce((acc: PageBlock[], block) => {
          if (block.id === sourceId) {
            blockToInsert = { ...block };
            return acc;
          }
          if (block.children) {
            return [...acc, { ...block, children: removeSource(block.children) }];
          }
          return [...acc, block];
        }, []);
      };
      newBlocksList = removeSource(blocks);
    } else if (sourceType) {
      blockToInsert = createNewBlock(sourceType);
    }

    if (!blockToInsert) return;

    const insertIntoTarget = (list: PageBlock[]): PageBlock[] => {
      return list.reduce((acc: PageBlock[], block) => {
        if (block.id === targetId) {
          if (block.type === 'container') {
            return [...acc, { ...block, children: [blockToInsert!, ...(block.children || [])] }];
          }
          return [...acc, block, blockToInsert!];
        }
        if (block.children) {
          return [...acc, { ...block, children: insertIntoTarget(block.children) }];
        }
        return [...acc, block];
      }, []);
    };

    setBlocks(insertIntoTarget(newBlocksList));
    setSelectedBlockId(blockToInsert.id);
  };

  const findAndReplaceBlock = (currentBlocks: PageBlock[], id: string, updates: Partial<PageBlock>): PageBlock[] => {
    return currentBlocks.map(block => {
      if (block.id === id) {
        return { ...block, ...updates };
      }
      if (block.children) {
        return { ...block, children: findAndReplaceBlock(block.children, id, updates) };
      }
      return block;
    });
  };

  const findAndDeleteBlock = (currentBlocks: PageBlock[], id: string): PageBlock[] => {
    return currentBlocks.reduce((acc: PageBlock[], block) => {
      if (block.id === id) return acc;
      if (block.children) {
        return [...acc, { ...block, children: findAndDeleteBlock(block.children, id) }];
      }
      return [...acc, block];
    }, []);
  };

  const findAndDuplicateBlock = (currentBlocks: PageBlock[], id: string): PageBlock[] => {
    const cloneBlock = (block: PageBlock): PageBlock => ({
      ...block,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      children: block.children ? block.children.map(cloneBlock) : undefined
    });

    return currentBlocks.reduce((acc: PageBlock[], block) => {
      if (block.id === id) return [...acc, block, cloneBlock(block)];
      if (block.children) return [...acc, { ...block, children: findAndDuplicateBlock(block.children, id) }];
      return [...acc, block];
    }, []);
  };

  const handleUpdateBlock = (updates: Partial<PageBlock>) => {
    if (!selectedBlockId) return;
    setBlocks(prev => findAndReplaceBlock(prev, selectedBlockId, updates));
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(prev => findAndDeleteBlock(prev, id));
    setSelectedBlockId(null);
  };

  const handleDuplicateBlock = (id: string) => {
    setBlocks(prev => findAndDuplicateBlock(prev, id));
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock = createNewBlock(type);
    if (selectedBlockId) {
      const parent = findBlockById(blocks, selectedBlockId);
      if (parent && parent.type === 'container') {
        setBlocks(prev => findAndReplaceBlock(prev, selectedBlockId, {
          children: [...(parent.children || []), newBlock]
        }));
        setSelectedBlockId(newBlock.id);
        return;
      }
    }
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const selectedBlock = selectedBlockId ? findBlockById(blocks, selectedBlockId) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar 
        onAddBlock={handleAddBlock} 
        onSave={saveToLocalStorage}
        onExport={handleExportHtml}
        onNew={() => { if (confirm('Clear canvas?')) { setBlocks([]); setSelectedBlockId(null); } }}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-50">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-slate-700">Project Canvas</h2>
          </div>
          <button 
            onClick={() => setIsPreviewMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-md"
          >
            <PreviewIcon /> Live Preview
          </button>
        </header>

        <div className="flex-1 overflow-y-auto editor-canvas p-12 bg-slate-100 flex justify-center items-start">
          <div 
            className="w-full max-w-4xl bg-white min-h-[800px] shadow-xl relative rounded-sm"
            onClick={() => setSelectedBlockId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              if (blocks.length === 0) {
                const draggedType = e.dataTransfer.getData('blockType') as BlockType;
                if (draggedType) {
                  handleAddBlock(draggedType);
                }
              }
            }}
          >
            {blocks.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                <PlusIcon /> <p>Empty Canvas. Drag a block here to start.</p>
              </div>
            ) : (
              blocks.map((block) => (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  selectedBlockId={selectedBlockId}
                  onSelect={(b) => setSelectedBlockId(b.id)}
                  onDragStart={setDraggedId}
                  onDrop={handleDrop}
                  onResize={handleResizeBlock}
                />
              ))
            )}
          </div>
        </div>
      </main>

      <PropertiesPanel 
        selectedBlock={selectedBlock} 
        onUpdate={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        onDuplicate={handleDuplicateBlock}
      />

      {isPreviewMode && (
        <PreviewModal blocks={blocks} onClose={() => setIsPreviewMode(false)} />
      )}
    </div>
  );
};

export default App;
