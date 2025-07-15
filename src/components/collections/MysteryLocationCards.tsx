import { useState } from 'react';
import { useRandomLocations } from '@/hooks/data/useRandomLocations';
import { MysteryCard } from './MysteryCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

export function MysteryLocationCards() {
  const { data: locations, isLoading, error, refetch } = useRandomLocations(4);
  const [revealedCardIndex, setRevealedCardIndex] = useState<number | null>(null);

  const handleReveal = (index: number) => {
    setRevealedCardIndex(index);
  };

  const handleRetry = () => {
    setRevealedCardIndex(null);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-red-50 rounded-lg">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 font-semibold mb-2">Rất tiếc, đã có lỗi xảy ra!</p>
        <p className="text-muted-foreground mb-4">Không thể tải các địa điểm bí ẩn. Vui lòng thử lại.</p>
        <Button onClick={handleRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {locations?.map((location, index) => (
          <MysteryCard
            key={location.id}
            location={location}
            isRevealed={revealedCardIndex === index}
            isFlippable={revealedCardIndex === null}
            onReveal={() => handleReveal(index)}
          />
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button onClick={handleRetry} variant="outline" size="lg">
          <RefreshCw className="mr-2 h-4 w-4" />
          Thử vận may lần nữa
        </Button>
      </div>
    </div>
  );
}