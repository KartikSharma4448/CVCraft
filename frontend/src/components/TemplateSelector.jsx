import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card';

export const TEMPLATES = [
  { id: 'modern', name: 'ATS Professional', description: 'Jake Ryan style — two-line headers, compact, ATS-optimized' },
  { id: 'clean', name: 'ATS Clean', description: 'Simple single-line headers, spacious, minimal — ATS-friendly' },
];

export default function TemplateSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {TEMPLATES.map((template) => (
        <Card
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={`cursor-pointer transition-all bg-[#0f0f10] border ${
            selected === template.id
              ? 'border-[#0066ff] ring-2 ring-[#0066ff]'
              : 'border-gray-700 hover:border-gray-500'
          }`}
        >
          <CardHeader className="p-4">
            <CardTitle className="text-sm text-white">{template.name}</CardTitle>
            <CardDescription className="text-xs text-gray-400">
              {template.description}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
