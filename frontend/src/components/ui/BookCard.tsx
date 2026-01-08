import { forwardRef, HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { Card } from './Card';

export interface BookCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  code: string;
  description?: string | null;
  totalWords: number;
  totalUnits: number;
  isFree: boolean;
  coverImage?: string | null;
  onSelect?: () => void;
}

export const BookCard = forwardRef<HTMLDivElement, BookCardProps>(
  (
    {
      name,
      code,
      description,
      totalWords,
      totalUnits,
      isFree,
      coverImage,
      onSelect,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <Card
        ref={ref}
        variant="bordered"
        hoverable
        padding="none"
        className={clsx('overflow-hidden', className)}
        onClick={onSelect}
        {...props}
      >
        {/* Cover Image */}
        <div className="relative h-32 bg-gradient-to-br from-primary-100 to-primary-200">
          {coverImage ? (
            <img
              src={coverImage}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl font-bold text-primary-400">
                {code.slice(0, 2)}
              </span>
            </div>
          )}

          {/* Free Badge */}
          {isFree && (
            <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded">
              免费
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>

          {description && (
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{totalWords} 词</span>
            <span>{totalUnits} 单元</span>
          </div>
        </div>
      </Card>
    );
  },
);

BookCard.displayName = 'BookCard';
