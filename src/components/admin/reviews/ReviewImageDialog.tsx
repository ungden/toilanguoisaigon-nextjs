"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewImageDialogProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewImageDialog({ images, isOpen, onClose }: ReviewImageDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Ảnh đánh giá ({currentIndex + 1}/{images.length})
          </DialogTitle>
        </DialogHeader>

        <div className="relative flex items-center justify-center min-h-[300px]">
          <div className="relative w-full h-[400px]">
            <Image
              src={images[currentIndex]}
              alt={`Ảnh đánh giá ${currentIndex + 1}`}
              fill
              className="object-contain rounded-lg"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2"
                onClick={handlePrev}
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2"
                onClick={handleNext}
                aria-label="Ảnh sau"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 justify-center mt-2 overflow-x-auto py-1">
            {images.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-14 w-14 flex-shrink-0 rounded border-2 overflow-hidden transition-all ${
                  idx === currentIndex
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
                aria-label={`Chọn ảnh ${idx + 1}`}
              >
                <Image
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
