import { MadeWithDyad } from "@/components/made-with-dyad";
import { Star, Heart, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-vietnam-blue-900 to-vietnam-red-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Star className="h-8 w-8 text-vietnam-gold-400 fill-vietnam-gold-400" />
              <div>
                <h3 className="text-2xl font-bold text-white">Tôi là người Sài Gòn</h3>
                <p className="text-vietnam-gold-300 text-sm">Khám phá ẩm thực</p>
              </div>
            </div>
            <p className="text-white/80 mb-4 leading-relaxed">
              Nền tảng khám phá ẩm thực và văn hóa Sài Gòn, nơi kết nối những người yêu thích khám phá 
              với những địa điểm độc đáo và đầy chất lượng trong thành phố.
            </p>
            <div className="flex items-center text-vietnam-gold-300">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="text-sm">Thành phố Hồ Chí Minh, Việt Nam</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-vietnam-gold-300">Khám phá</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
                  Bộ sưu tập
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
                  Tìm kiếm địa điểm
                </Link>
              </li>
              <li>
                <Link to="/" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
                  Blog & Review
                </Link>
              </li>
              <li>
                <Link to="/" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
                  Về chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-vietnam-gold-300">Hỗ trợ</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link to="/" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link to="/" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center text-white/80 mb-4 md:mb-0">
              <Heart className="h-4 w-4 mr-2 text-vietnam-red-400 fill-vietnam-red-400" />
              <span className="text-sm">
                &copy; {new Date().getFullYear()} Tôi là người Sài Gòn. Made with love in Saigon.
              </span>
            </div>
            <div className="text-white/60">
              <MadeWithDyad />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}