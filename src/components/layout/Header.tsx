import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold sm:inline-block">
              Tôi là người Sài Gòn
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              to="/"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Bộ sưu tập
            </Link>
            <Link
              to="/"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Blog
            </Link>
            <Link
              to="/"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Về chúng tôi
            </Link>
          </nav>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link to="/" className="flex items-center">
              <span className="font-bold">Tôi là người Sài Gòn</span>
            </Link>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-3">
                 <Link to="/">Bộ sưu tập</Link>
                 <Link to="/">Blog</Link>
                 <Link to="/">Về chúng tôi</Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button>Đăng nhập</Button>
        </div>
      </div>
    </header>
  );
}