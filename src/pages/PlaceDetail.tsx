import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Clock, Phone, DollarSign, MessageSquare, UserCircle } from "lucide-react";
import { useParams } from "react-router-dom";

// Mock data for a single place, we'll replace this with real data later
const mockPlace = {
  name: "Phở Haru",
  slug: "pho-haru",
  images: [
    "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1569562211093-429d3758a41c?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?q=80&w=2071&auto=format&fit=crop",
  ],
  rating: 4.8,
  reviewCount: 120,
  cuisine: "Món Việt",
  address: "123 Đường Pasteur, Phường Bến Nghé, Quận 1, TP.HCM",
  openingHours: "08:00 - 22:00",
  phone: "0987 654 321",
  priceRange: "100.000đ - 200.000đ",
  tags: ["phở", "quận 1", "món việt", "truyền thống"],
  ourReview: "Một sự kết hợp tinh tế giữa hương vị phở truyền thống và phong cách phục vụ hiện đại. Nước dùng trong, ngọt thanh từ xương, thịt bò mềm và tươi. Không gian quán sạch sẽ, thoáng đãng. Rất đáng để thử!",
  communityReviews: [
    { user: "An Nguyễn", rating: 5, comment: "Phở ngon nhất mình từng ăn ở Sài Gòn. Sẽ quay lại nhiều lần!" },
    { user: "David Chen", rating: 4, comment: "Không gian đẹp, phục vụ nhanh. Giá hơi cao nhưng chất lượng xứng đáng." },
  ]
};


const PlaceDetailPage = () => {
  const { slug } = useParams();
  // In a real app, you would fetch the place data based on the slug
  const place = mockPlace;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Image Gallery */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-96 mb-8">
          <div className="col-span-2 row-span-2">
            <img src={place.images[0]} alt={place.name} className="w-full h-full object-cover rounded-lg" />
          </div>
          <div className="col-span-1 row-span-1">
            <img src={place.images[1]} alt={place.name} className="w-full h-full object-cover rounded-lg" />
          </div>
          <div className="col-span-1 row-span-1">
            <img src={place.images[2]} alt={place.name} className="w-full h-full object-cover rounded-lg" />
          </div>
           <div className="col-span-2 row-span-1">
            <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <Button variant="outline">Xem tất cả ảnh</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold">{place.name}</h1>
            <div className="flex items-center text-lg text-muted-foreground my-2">
              <Star className="h-5 w-5 mr-1 fill-yellow-400 text-yellow-400" />
              <span>{place.rating}</span>
              <span className="mx-2">·</span>
              <span>({place.reviewCount} đánh giá)</span>
              <span className="mx-2">·</span>
              <Badge variant="secondary">{place.cuisine}</Badge>
            </div>
            
            <Separator className="my-6" />

            {/* Core Info */}
            <div className="space-y-4 text-lg">
                <div className="flex items-center"><MapPin className="h-5 w-5 mr-3 flex-shrink-0" /> {place.address}</div>
                <div className="flex items-center"><Clock className="h-5 w-5 mr-3 flex-shrink-0" /> {place.openingHours}</div>
                <div className="flex items-center"><Phone className="h-5 w-5 mr-3 flex-shrink-0" /> {place.phone}</div>
                <div className="flex items-center"><DollarSign className="h-5 w-5 mr-3 flex-shrink-0" /> {place.priceRange}</div>
            </div>

            <Separator className="my-6" />

            {/* Our Review */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Đánh giá của "Tôi là người Sài Gòn"</h2>
                <div className="prose prose-lg max-w-none text-foreground/90">
                    <p>{place.ourReview}</p>
                </div>
            </div>

            <Separator className="my-6" />

            {/* Community Reviews */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Đánh giá từ cộng đồng</h2>
                <div className="space-y-6">
                    {place.communityReviews.map(review => (
                        <div key={review.user}>
                            <div className="flex items-center mb-1">
                                <UserCircle className="h-8 w-8 mr-2 text-muted-foreground" />
                                <div>
                                    <p className="font-semibold">{review.user}</p>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted-foreground text-muted-foreground'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <p className="text-foreground/80">{review.comment}</p>
                        </div>
                    ))}
                </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Menu/Thực đơn</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Chức năng xem menu sẽ sớm được cập nhật.</p>
                    <Button className="w-full mt-4">Xem Menu</Button>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlaceDetailPage;