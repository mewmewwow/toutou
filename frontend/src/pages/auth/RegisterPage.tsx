import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { useGuestStore } from '../../stores/guestStore';
import { RegisterDto } from 'shared/types/user';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  
  // Get guest user info if available
  const guestUserId = useGuestStore((state) => state.fingerprint); // We use fingerprint as ID reference for now? 
  // Wait, guestUserId in backend/register.dto.ts is optional string.
  // In authService.migrateGuest logic, it expects a guestUserId from somewhere. 
  // Let's assume for now we don't automatically attach it during register unless user opts in, 
  // OR we can fetch the actual guest user ID if we have an endpoint for it.
  // Actually, the guest migration usually happens AFTER registration/login. 
  // For simplicity, let's just focus on basic registration first.
  
  const { register: registerField, handleSubmit, formState: { errors }, watch } = useForm<RegisterDto & { confirmPassword: string }>();
  
  const password = watch('password');

  const onSubmit = async (data: RegisterDto & { confirmPassword: string }) => {
    clearError();
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = data;
      await register(registerData);
      navigate('/');
    } catch (e) {
      // Error is handled in store
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          注册新账号
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          已有账号？{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            立即登录
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <Input
              label="用户名"
              id="username"
              type="text"
              autoComplete="username"
              error={errors.username?.message}
              {...registerField('username', { 
                required: '请输入用户名',
                minLength: { value: 2, message: '用户名至少2位' },
                maxLength: { value: 50, message: '用户名最多50位' }
              })}
            />

            <Input
              label="邮箱"
              id="email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...registerField('email', { 
                required: '请输入邮箱',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '请输入有效的邮箱地址'
                }
              })}
            />

            <Input
              label="密码"
              id="password"
              type="password"
              autoComplete="new-password"
              hint="8-50位，必须包含大小写字母和数字"
              error={errors.password?.message}
              {...registerField('password', { 
                required: '请输入密码',
                minLength: { value: 8, message: '密码至少8位' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                  message: '密码必须包含大写字母、小写字母和数字'
                }
              })}
            />

            <Input
              label="确认密码"
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...registerField('confirmPassword', { 
                required: '请确认密码',
                validate: value => value === password || '两次输入的密码不一致'
              })}
            />

            <div>
              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
              >
                注册
              </Button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  注册即代表同意服务条款和隐私政策
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
