'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Hash,
  ChevronDown,
  ChevronRight,
  Search,
  HelpCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { getTemplateVariables, processTemplate } from '@/lib/notifications/template-processor';
import type { TemplatePreviewData } from '@/types/notifications';

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  mode?: 'html' | 'text';
  placeholder?: string;
}

// Sample data for preview
const samplePreviewData: TemplatePreviewData = {
  vehicle: {
    year: '2024',
    make: 'Toyota',
    model: 'Camry',
    vin: '1HGCM82633A123456',
    stock_number: 'STK-12345',
    price: '$28,999',
    mileage: '15,234',
    color: 'Silver Metallic',
    location: { name: 'Store 1' },
    image_link1: 'https://via.placeholder.com/600x400',
    image_link2: 'https://via.placeholder.com/600x400',
    image_link3: 'https://via.placeholder.com/600x400'
  },
  transfer: {
    from_location: { name: 'Store 1' },
    to_location: { name: 'Store 3' },
    requested_by: { 
      name: 'John Smith',
      email: 'john@dealer.com'
    },
    approved_by: { 
      name: 'Jane Doe'
    },
    status: 'approved',
    priority: 'high',
    created_at: 'January 8, 2025',
    notes: 'Customer waiting',
    cancellation_reason: ''
  },
  user: {
    name: 'Mike Johnson',
    email: 'mike@dealer.com',
    location: { name: 'Store 2' },
    role: 'manager'
  },
  system: {
    date: 'January 8, 2025',
    time: '2:30 PM'
  },
  link: {
    view_transfer: 'https://app.roundtable.com/transfers/123',
    approve_transfer: 'https://app.roundtable.com/approve/123',
    dashboard: 'https://app.roundtable.com/dashboard',
    view_short: 'https://app.roundtable.com/t/123',
    approve_short: 'https://app.roundtable.com/a/123'
  }
};

export function TemplateEditor({ 
  value, 
  onChange, 
  mode = 'html',
  placeholder = 'Enter HTML template...' 
}: TemplateEditorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [expandedView, setExpandedView] = useState<'preview' | 'editor' | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const templateVariables = getTemplateVariables();

  // Process template for preview
  const processedPreview = mode === 'html' ? processTemplate(value, samplePreviewData) : value;

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  const filterVariables = (variables: ReturnType<typeof getTemplateVariables>) => {
    if (!searchTerm) return variables;
    
    const filtered: Record<string, Array<{key: string; description: string; example: string}>> = {};
    Object.entries(variables).forEach(([category, vars]) => {
      const filteredVars = vars.filter(v => 
        v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filteredVars.length > 0) {
        filtered[category] = filteredVars;
      }
    });
    return filtered;
  };

  const insertVariable = (variable: string) => {
    if (!editorRef.current) return;

    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const newValue = value.substring(0, start) + `{{${variable}}}` + value.substring(end);
    onChange(newValue);
    
    // Restore cursor position after React re-render
    setTimeout(() => {
      if (editorRef.current) {
        const newPosition = start + variable.length + 4;
        editorRef.current.setSelectionRange(newPosition, newPosition);
        editorRef.current.focus();
      }
    }, 0);
  };

  const renderVariableReference = () => {
    const filteredVariables = filterVariables(templateVariables);
    const hasResults = Object.keys(filteredVariables).length > 0;

    return (
      <div className="h-full bg-[#0a0a0a] flex flex-col">
        <div className="p-4 border-b border-[#2a2a2a]">
          <h3 className="font-semibold flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Template Variables
          </h3>
          <p className="text-xs text-gray-400 mt-1 mb-3">
            Click to insert
          </p>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search variables..."
              className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {!hasResults && searchTerm && (
              <p className="text-sm text-gray-400 text-center py-4">
                No variables found matching &quot;{searchTerm}&quot;
              </p>
            )}
            
            {Object.entries(filteredVariables).map(([category, variables]) => {
              const isCollapsed = collapsedCategories.has(category);
              const categoryIcons: Record<string, string> = {
                vehicle: '🚗',
                transfer: '📦',
                user: '👤',
                system: '⚙️',
                link: '🔗'
              };
              
              return (
                <div key={category} className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{categoryIcons[category] || '📋'}</span>
                      <span className="text-sm font-medium text-gray-300 capitalize">
                        {category}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({variables.length})
                      </span>
                    </span>
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {!isCollapsed && (
                    <div className="px-2 pb-2">
                      {variables.map(variable => (
                        <button
                          key={variable.key}
                          type="button"
                          onClick={() => insertVariable(variable.key)}
                          className="w-full text-left px-2 py-1.5 hover:bg-[#2a2a2a] rounded transition-colors group"
                          title={`${variable.description}\nExample: ${variable.example}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-blue-400 group-hover:text-blue-300">
                              {`{{${variable.key}}}`}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {variable.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Conditional Blocks Help */}
            <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-3">
              <h4 className="text-xs font-medium text-gray-300 mb-2 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Conditional Blocks
              </h4>
              <div className="space-y-1 text-xs text-gray-400">
                <code className="block p-1.5 bg-black rounded text-xs">
                  {'{{#if transfer.priority}}URGENT{{/if}}'}
                </code>
                <code className="block p-1.5 bg-black rounded text-xs">
                  {'{{#if transfer.notes}}Notes: {{transfer.notes}}{{/if}}'}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (mode === 'text') {
    // SMS mode - simpler layout
    return (
      <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
        <div className="flex h-64">
          <div className="flex-1 flex flex-col">
            <textarea
              ref={editorRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-4 py-3 bg-[#1a1a1a] focus:outline-none resize-none font-mono text-sm text-gray-300"
            />
            <div className="px-4 py-2 text-sm text-gray-400 border-t border-[#2a2a2a] bg-[#0a0a0a]">
              {value.length} characters • {Math.ceil(value.length / 160)} SMS segment{value.length > 160 ? 's' : ''}
            </div>
          </div>
          <div className="w-80 border-l border-[#2a2a2a]">
            {renderVariableReference()}
          </div>
        </div>
      </div>
    );
  }

  // HTML Email Editor - Three Panel Layout
  return (
    <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-[#2a2a2a] bg-[#0a0a0a]">
        <h3 className="text-sm font-medium text-gray-300">Email Template Editor</h3>
        <div className="flex gap-2">
          {expandedView && (
            <button
              type="button"
              onClick={() => setExpandedView(null)}
              className="p-1.5 hover:bg-[#2a2a2a] rounded transition-colors"
              title="Exit fullscreen"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex" style={{ height: '800px' }}>
        {/* Preview Pane */}
        <div className={`${expandedView === 'editor' ? 'hidden' : expandedView === 'preview' ? 'flex-1' : 'w-1/3'} border-r border-[#2a2a2a] flex flex-col`}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a2a] bg-[#1a1a1a]">
            <span className="text-xs font-medium text-gray-400">Email Preview</span>
            {!expandedView && (
              <button
                type="button"
                onClick={() => setExpandedView('preview')}
                className="p-1 hover:bg-[#2a2a2a] rounded transition-colors"
                title="Expand preview"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex-1 bg-[#f5f5f5] overflow-auto">
            <div 
              className="min-h-full p-6 bg-white"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#333333',
                maxWidth: '600px',
                margin: '0 auto'
              }}
              dangerouslySetInnerHTML={{ __html: processedPreview }}
            />
          </div>
        </div>

        {/* HTML Editor */}
        <div className={`${expandedView === 'preview' ? 'hidden' : expandedView === 'editor' ? 'flex-1' : 'flex-1'} flex flex-col`}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a2a] bg-[#1a1a1a]">
            <span className="text-xs font-medium text-gray-400">HTML Source</span>
            {!expandedView && (
              <button
                type="button"
                onClick={() => setExpandedView('editor')}
                className="p-1 hover:bg-[#2a2a2a] rounded transition-colors"
                title="Expand editor"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={editorRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="absolute inset-0 w-full h-full px-4 py-3 bg-[#1a1a1a] text-gray-300 font-mono text-sm focus:outline-none resize-none"
              spellCheck={false}
              style={{
                tabSize: 2,
                lineHeight: '1.5'
              }}
            />
          </div>
        </div>

        {/* Variables Panel */}
        {expandedView !== 'editor' && expandedView !== 'preview' && (
          <div className="w-80 border-l border-[#2a2a2a]">
            {renderVariableReference()}
          </div>
        )}
      </div>
    </div>
  );
}