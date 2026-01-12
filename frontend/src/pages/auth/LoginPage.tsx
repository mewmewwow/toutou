import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { LoginDto } from 'shared/types/user';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginDto>();

  const onSubmit = async (data: LoginDto) => {
    clearError();
    try {
      await login(data);
      navigate('/');
    } catch (e) {
      // Error is handled in store
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          登录您的账号
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          还没有账号？{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
            免费注册
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
              label="邮箱"
              id="email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', { 
                required: '请输入邮箱',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '请输入有效的邮箱地址'
                }
              })}
            />

            <div>
              <Input
                label="密码"
                id="password"
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password', { 
                  required: '请输入密码'
                })}
              />
              <div className="flex items-center justify-end mt-1">
                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    忘记密码？
                  </a>
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
              >
                登录
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
                  或者
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
               <Button
                 variant="secondary"
                 fullWidth
                 onClick={() => navigate('/')}
               >
                 以访客身份继续
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
