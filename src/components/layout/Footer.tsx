import { Star, Heart, MapPin, Facebook, Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const TikTokIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 12a4 4 0 1 0 4 4V8a8 8 0 1 1-8-8" />
  </svg>
);

export function Footer() {
  return (
    <footer className="bg-vietnam-blue-900 text-white py-16">
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
                <Link to="/collections" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
                  Bộ sưu tập
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
                  Tìm kiếm địa điểm
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
                  Blog & Review
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
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
                <Link to="/contact" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-white/80 hover:text-vietnam-gold-300 transition-colors text-sm">
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
            <div className="flex items-center space-x-4">
              <a href="https://www.facebook.com/languoisaigon" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-vietnam-gold-300 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/toilanguoisaigon" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-vietnam-gold-300 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.tiktok.com/@toilanguoisaigonofficial" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-vietnam-gold-300 transition-colors">
                <TikTokIcon />
              </a>
              <a href="mailto:toilanguoisaigonofficial@gmail.com" className="text-white/80 hover:text-vietnam-gold-300 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}