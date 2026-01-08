import React from 'react';

interface Definition {
  pos: string;
  meaning: string;
}

interface DefinitionCardProps {
  definitions: Definition[];
  showMeaning?: boolean;
  highlightIndex?: number;
  className?: string;
}

/**
 * DefinitionCard component for displaying word definitions
 */
export const DefinitionCard: React.FC<DefinitionCardProps> = ({
  definitions,
  showMeaning = true,
  highlightIndex,
  className = '',
}) => {
  if (definitions.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {definitions.map((def, index) => (
        <div
          key={index}
          className={`
            flex items-start gap-2 p-3 rounded-lg
            ${highlightIndex === index ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}
          `}
        >
          <span className="inline-block px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded">
            {def.pos}
          </span>
          {showMeaning ? (
            <span className="text-gray-800 flex-1">{def.meaning}</span>
          ) : (
            <span className="text-gray-400 flex-1">???</span>
          )}
        </div>
      ))}
    </div>
  );
};

interface DefinitionOptionsProps {
  definitions: Definition[];
  correctIndex: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  showResult: boolean;
  className?: string;
}

/**
 * DefinitionOptions component for multiple choice definition selection
 */
export const DefinitionOptions: React.FC<DefinitionOptionsProps> = ({
  definitions,
  correctIndex,
  selectedIndex,
  onSelect,
  showResult,
  className = '',
}) => {
  const getOptionClass = (index: number) => {
    if (!showResult) {
      if (selectedIndex === index) {
        return 'border-blue-500 bg-blue-50';
      }
      return 'border-gray-200 hover:border-blue-300 hover:bg-gray-50';
    }

    if (index === correctIndex) {
      return 'border-green-500 bg-green-50';
    }

    if (selectedIndex === index && index !== correctIndex) {
      return 'border-red-500 bg-red-50';
    }

    return 'border-gray-200 opacity-50';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {definitions.map((def, index) => (
        <button
          key={index}
          onClick={() => !showResult && onSelect(index)}
          disabled={showResult}
          className={`
            w-full flex items-start gap-3 p-4 rounded-lg border-2
            transition-all duration-200
            ${getOptionClass(index)}
          `}
        >
          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
            {index + 1}
          </span>
          <div className="flex-1 text-left">
            <span className="inline-block px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded mr-2">
              {def.pos}
            </span>
            <span className="text-gray-800">{def.meaning}</span>
          </div>
          {showResult && index === correctIndex && (
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {showResult && selectedIndex === index && index !== correctIndex && (
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
};
