import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    // Kiểm tra an toàn xem window có tồn tại không
    if (typeof window === 'undefined') {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Thêm listener
    mql.addEventListener("change", onChange);
    
    // Thiết lập giá trị ban đầu
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // Dọn dẹp listener khi component unmount
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}