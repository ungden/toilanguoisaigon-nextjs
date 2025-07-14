import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FormEvent } from "react";

const collections = [
  {
    title: "Quán Mới Đang Hot",
    description: "Những địa điểm vừa xuất hiện đã gây bão.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
  },
  {
    title: "Quán Lâu Đời Ký Ức",
    description: "Tìm lại hương vị Sài Gòn xưa.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop",
  },
  {
    title: "Cafe 'Deep Work'",
    description: "Không gian yên tĩnh cho dân freelancer.",
    image: "https://images.unsplash.com/photo-1497515114629-48446e82d0ac?q=80&w=2070&auto=format&fit=crop",
  },
  {
    title: "Rooftop View Triệu Đô",
    description: "Ngắm Sài Gòn từ trên cao.",
    image: "https://images.unsplash.com/photo-1590152398939-e33e6134b2b3?q=80&w=1974&auto=format&fit=crop",
  },
];

const newPlaces = [
    { name: "Phở Haru", district: "Quận 1", image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?q=80&w=2070&auto=format&fit=crop" },
    { name: "The Running Bean", district: "Quận 3", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1974&auto=format&fit=crop" },
    { name: "Bún Chả Quán", district: "Phú Nhuận", image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=1964&auto=format&fit=crop" },
    { name: "Cơm Tấm Ba Ghiền", district: "Bình Thạnh", image: "https://images.unsplash.com/photo-1598515599465-f36719464717?q=80&w=2070&auto=format&fit=crop" },
];

const blogPosts = [
    { title: "Một ngày ăn sập Quận 5", excerpt: "Hành trình khám phá thiên đường ẩm thực của người Hoa...", image: "https://images.unsplash.com/photo-1585907279394-90a3d3d49fc7?q=80&w=1974&auto=format&fit=crop" },
    { title: "Top 10 quán Phở ngon nhất Sài Gòn", excerpt: "Danh sách những tô phở khiến bạn phải xuýt xoa.", image: "https://images.unsplash.com/photo-1569562211093-429d3758a41c?q=80&w=2070&auto=format&fit=crop" },
    { title: "Những quán cà phê ẩn mình trong hẻm Sài Gòn", excerpt: "Khám phá những không gian yên tĩnh và đầy chất thơ.", image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=2070&auto=format&fit=crop" },
];

const Index = () => {
  const navigate = useNavigate();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get("query") as string;
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow">
        <section className="relative text-center py-20 md:py-32 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1531697111548-0c45f24911da?q=80&w=2070&auto=format&fit=crop')"}}>
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white">Tìm "chất" Sài Gòn</h1>
            <p className="mt-4 text-lg md:text-xl text-white/90">Khám phá những địa điểm ẩm thực và văn hóa độc đáo của Sài Gòn.</p>
            <form onSubmit={handleSearch} className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2">
              <Input
                type="text"
                name="query"
                placeholder="Tìm kiếm tên quán, món ăn, địa chỉ..."
                className="h-12 text-base"
              />
              <Button type="submit" size="lg" className="h-12">
                <Search className="h-5 w-5 mr-2" />
                Tìm kiếm
              </Button>
            </form>
          </div>
        </section>

        <section className="container mx-auto py-16 px-4">
          <h2 className="text-3xl font-bold text-center mb-2">Bộ sưu tập nổi bật</h2>
          <p className="text-muted-foreground text-center mb-8">Những danh sách chọn lọc theo "gu" và "tâm trạng" của bạn.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {collections.map((collection) => (
              <Card key={collection.title} className="overflow-hidden hover:shadow-lg transition-shadow">
                <img src={collection.image} alt={collection.title} className="h-40 w-full object-cover" />
                <CardHeader>
                  <CardTitle>{collection.title}</CardTitle>
                  <CardDescription>{collection.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-2">Địa điểm mới cập nhật</h2>
            <p className="text-muted-foreground text-center mb-8">Những quán hay ho vừa được thêm vào hệ thống.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newPlaces.map((place) => (
                <Card key={place.name} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <img src={place.image} alt={place.name} className="h-48 w-full object-cover" />
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg">{place.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {place.district}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto py-16 px-4">
          <h2 className="text-3xl font-bold text-center mb-2">Blog & Review chuyên sâu</h2>
          <p className="text-muted-foreground text-center mb-8">Đọc những câu chuyện và khám phá Sài Gòn qua từng góc nhìn.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Card key={post.title} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                <img src={post.image} alt={post.title} className="h-56 w-full object-cover" />
                <CardHeader>
                  <CardTitle>{post.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground">{post.excerpt}</p>
                </CardContent>
                <div className="p-4 pt-0">
                  <Button variant="link" className="p-0">Đọc thêm →</Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;