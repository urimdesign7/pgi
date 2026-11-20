import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { resolveAssetUrl } from '../data/pgiData';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectClassName?: string;
  fallbackLabel?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  aspectClassName = 'aspect-[4/3]',
  fallbackLabel,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-[#EBE6DF] text-[#57534E] overflow-hidden ${aspectClassName} ${className}`}
        role="img"
        aria-label={alt}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 25%, rgba(154,107,34,0.16), transparent 60%)',
          }}
        />
        <BookOpen className="w-7 h-7 text-[#9A6B22] mb-2 relative z-10" strokeWidth={1.5} />
        <p className="text-xs font-editorial tracking-wide text-center px-6 relative z-10 text-[#44403C]">
          {fallbackLabel || alt}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#EBE6DF] ${aspectClassName}`}>
      <img
        src={resolveAssetUrl(src)}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover ${className}`}
      />
    </div>
  );
}
