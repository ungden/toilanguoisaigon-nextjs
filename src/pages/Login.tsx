import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const LoginPage = () => {
  const { session } = useAuth();
  const location = useLocation();

  if (session) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Chào mừng trở lại!</CardTitle>
            <CardDescription>Đăng nhập hoặc tạo tài khoản để khám phá Sài Gòn</CardDescription>
          </CardHeader>
          <CardContent>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={[]}
              theme="light"
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Địa chỉ email',
                    password_label: 'Mật khẩu',
                    button_label: 'Đăng nhập',
                    link_text: 'Đã có tài khoản? Đăng nhập',
                  },
                  sign_up: {
                    email_label: 'Địa chỉ email',
                    password_label: 'Mật khẩu',
                    button_label: 'Đăng ký',
                    link_text: 'Chưa có tài khoản? Đăng ký',
                  },
                  forgotten_password: {
                    email_label: 'Địa chỉ email',
                    button_label: 'Gửi hướng dẫn đặt lại mật khẩu',
                    link_text: 'Quên mật khẩu?',
                  },
                  update_password: {
                    password_label: 'Mật khẩu mới',
                    button_label: 'Cập nhật mật khẩu'
                  }
                },
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;