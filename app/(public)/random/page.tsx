"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dices, MapPin, DollarSign, Loader2, ArrowRight } from "lucide-react";
import { useRandomLocation } from "@/src/hooks/data/useRandomLocation";
import { LocationCard } from "@/src/components/location/LocationCard";
import { toast } from "sonner";
import Link from "next/link";
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const DISTRICTS = [
  "Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5",
  "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11", "Quận 12",
  "Bình Thạnh", "Phú Nhuận", "Gò Vấp", "Tân Bình", "Tân Phú", "Bình Tân",
  "Thủ Đức", "Bình Chánh", "Hóc Môn", "Nhà Bè"
];

const PRICE_RANGES = [
  { value: "$", label: "Dưới 50k ($)" },
  { value: "$$", label: "50k - 150k ($$)" },
  { value: "$$$", label: "150k - 500k ($$$)" },
  { value: "$$$$", label: "Trên 500k ($$$$)" }
];

export default function RandomizerPage() {
  const [district, setDistrict] = useState<string>("all");
  const [price, setPrice] = useState<string>("all");
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const getRandomLocation = useRandomLocation();
  const { width, height } = useWindowSize();

  const handleSpin = async () => {
    setIsSpinning(true);
    setResult(null);
    setShowConfetti(false);
    
    try {
      // Minimum spinning time for UX
      const spinPromise = new Promise(resolve => setTimeout(resolve, 1500));
      
      const fetchPromise = getRandomLocation({
        district: district !== "all" ? district : null,
        price_range: price !== "all" ? price : null
      });

      const [_, location] = await Promise.all([spinPromise, fetchPromise]);
      
      if (location) {
        setResult(location);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000); // Stop confetti after 5s
      } else {
        toast.error("Không tìm thấy địa điểm nào phù hợp! Hãy thử đổi bộ lọc.");
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi tìm địa điểm.");
    } finally {
      setIsSpinning(false);
    }
  };

  return (
    <div className="container py-12 max-w-4xl">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />}
      
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-vietnam-red-600 sm:text-4xl mb-4">
          Ăn gì hôm nay?
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Cứ đến giờ ăn lại không biết ăn gì? Hãy để Vòng Quay Ẩm Thực của Sài Gòn quyết định thay bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-6">
          <Card className="border-vietnam-red-100 shadow-md">
            <CardHeader className="bg-vietnam-red-50/50 rounded-t-xl pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Dices className="h-5 w-5 text-vietnam-red-600" />
                Bộ lọc quay
              </CardTitle>
              <CardDescription>
                Thu hẹp phạm vi để có kết quả ưng ý nhất
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Khu vực
                </label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả các quận" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Bất kỳ đâu cũng đi</SelectItem>
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Mức giá
                </label>
                <Select value={price} onValueChange={setPrice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mọi mức giá" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Sẵn sàng chi trả</SelectItem>
                    {PRICE_RANGES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSpin} 
                disabled={isSpinning}
                className="w-full mt-4 bg-vietnam-red-600 hover:bg-vietnam-red-700 text-white font-bold h-14 text-lg shadow-lg shadow-vietnam-red-200 transition-all active:scale-95"
              >
                {isSpinning ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Đang chọn ngẫu nhiên...
                  </>
                ) : (
                  <>
                    <Dices className="mr-2 h-6 w-6" />
                    Quay ngay!
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-7">
          <div className="h-full min-h-[400px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 text-center bg-gray-50/50">
            {isSpinning ? (
              <div className="space-y-4 animate-pulse">
                <Dices className="h-20 w-20 text-vietnam-red-300 mx-auto animate-bounce" />
                <p className="text-xl font-medium text-vietnam-blue-700">Đang tìm quán chân ái cho bạn...</p>
              </div>
            ) : result ? (
              <div className="w-full space-y-4 animate-in fade-in zoom-in duration-500">
                <h3 className="text-2xl font-bold text-vietnam-blue-900 mb-2">Tèn tén ten! Hôm nay ăn ở đây nhé:</h3>
                <div className="text-left w-full max-w-sm mx-auto">
                   <LocationCard location={result} />
                </div>
                <Button asChild variant="outline" className="mt-4 border-vietnam-red-200 text-vietnam-red-600 hover:bg-vietnam-red-50">
                  <Link href={`/place/${result.slug}`}>
                    Xem chi tiết quán này <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4 opacity-60">
                <Dices className="h-20 w-20 text-gray-400 mx-auto" />
                <p className="text-lg font-medium text-gray-500">Nhấn nút quay để tìm địa điểm ngẫu nhiên</p>
                <p className="text-sm text-gray-400">Có hơn 1000+ quán ăn đang chờ bạn khám phá</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
