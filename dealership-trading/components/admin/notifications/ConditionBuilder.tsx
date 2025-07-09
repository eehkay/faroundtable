'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { getAvailableFields } from '@/lib/notifications/rule-evaluator';
import type { RuleCondition, ConditionOperator, NotificationEvent } from '@/types/notifications';

interface ConditionBuilderProps {
  conditions: RuleCondition[];
  onChange: (conditions: RuleCondition[]) => void;
  event: NotificationEvent;
}

export function ConditionBuilder({ conditions, onChange, event }: ConditionBuilderProps) {
  const availableFields = getAvailableFields(event);
  
  const addCondition = () => {
    const newCondition: RuleCondition = {
      field: availableFields[0]?.field || '',
      operator: 'equals',
      value: ''
    };
    onChange([...conditions, newCondition]);
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const operators: Array<{ value: ConditionOperator; label: string }> = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does Not Contain' }
  ];

  return (
    <div className="space-y-4">
      {conditions.length === 0 ? (
        <div className="text-center py-8 bg-[#1a1a1a] rounded-lg border border-dashed border-[#2a2a2a]">
          <p className="text-gray-400 mb-4">
            No conditions set - notification will be sent to all configured recipients
          </p>
          <button
            type="button"
            onClick={addCondition}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Condition
          </button>
        </div>
      ) : (
        <>
          {conditions.map((condition, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]"
            >
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Field</label>
                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(index, { field: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  >
                    {availableFields.map(field => (
                      <option key={field.field} value={field.field}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Operator</label>
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, { operator: e.target.value as ConditionOperator })}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  >
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Value</label>
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                    placeholder="Enter value..."
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeCondition(index)}
                className="mt-6 p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Remove condition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addCondition}
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-[#2a2a2a] rounded-lg hover:border-blue-500 hover:text-blue-400 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Another Condition
          </button>
        </>
      )}
    </div>
  );
}