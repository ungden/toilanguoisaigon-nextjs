import { Star, Heart, MapPin, Facebook, Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const TikTokIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white/80 group-hover:text-vietnam-gold-300 transition-colors"
  >
    <defs>
      <path
        id="tiktok-path"
        d="M16.6 5.82s.51.5 0 0A4.27 4.27 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.59A2.59 2.59 0 0 1 7.27 15.4a2.59 2.59 0 0 1 2.59-2.59h.4v-2.89h-.4a5.48 5.48 0 0 0-5.48 5.48A5.48 5.48 0 0 0 9.86 21a5.48 5.48 0 0 0 5.48-5.48V5.82h1.26Z"
      />
    </defs>
    <use href="#tiktok-path" fill="#FF0050" transform="translate(1.5, 0)" />
    <use href="#tiktok-path" fill="#00F2EA" transform="translate(-1.5, 0)" />
    <use href="#tiktok-path" fill="currentColor" />
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
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center text-white/80 text-center md:text-left">
              <Heart className="h-4 w-4 mr-2 text-vietnam-red-400 fill-vietnam-red-400 flex-shrink-0" />
              <span className="text-sm">
                &copy; {new Date().getFullYear()} Tôi là người Sài Gòn. Made with love in Saigon.
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-x-6 gap-y-4">
              <div className="flex items-center space-x-5">
                <a href="https://www.facebook.com/languoisaigon" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-vietnam-gold-300 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://www.instagram.com/toilanguoisaigon" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-vietnam-gold-300 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://www.tiktok.com/@toilanguoisaigonofficial" target="_blank" rel="noopener noreferrer" className="group">
                  <TikTokIcon />
                </a>
              </div>
              <a href="mailto:toilanguoisaigonofficial@gmail.com" className="text-white/80 hover:text-vietnam-gold-300 transition-colors flex items-center gap-2 text-sm">
                <Mail className="h-5 w-5" />
                toilanguoisaigonofficial@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}