import { forwardRef, HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { Button } from './Button';
import { Card } from './Card';

export interface RegistrationPromptProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  benefits?: string[];
  onRegister?: () => void;
  onLogin?: () => void;
  variant?: 'banner' | 'card' | 'modal';
}

export const RegistrationPrompt = forwardRef<
  HTMLDivElement,
  RegistrationPromptProps
>(
  (
    {
      title = '解锁更多内容',
      message = '注册成为会员，免费试用14天，解锁所有单元和功能。',
      benefits = [
        '解锁所有词书和单元',
        '7种学习模式自由选择',
        '详细学习数据统计',
        '永久保存学习进度',
      ],
      onRegister,
      onLogin,
      variant = 'card',
      className,
      ...props
    },
    ref,
  ) => {
    if (variant === 'banner') {
      return (
        <div
          ref={ref}
          className={clsx(
            'bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 rounded-lg',
            className,
          )}
          {...props}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">{title}</div>
              <div className="text-sm text-primary-100">{message}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              {onLogin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={onLogin}
                >
                  登录
                </Button>
              )}
              {onRegister && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onRegister}
                >
                  免费注册
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Card
        ref={ref}
        variant="bordered"
        padding="lg"
        className={clsx('text-center', className)}
        {...props}
      >
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-primary-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Title & Message */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>

        {/* Benefits */}
        {benefits.length > 0 && (
          <ul className="text-left mb-6 space-y-2">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-700">
                <svg
                  className="w-5 h-5 text-green-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {onRegister && (
            <Button variant="primary" fullWidth onClick={onRegister}>
              免费注册
            </Button>
          )}
          {onLogin && (
            <Button variant="ghost" fullWidth onClick={onLogin}>
              已有账号？登录
            </Button>
          )}
        </div>

        {/* Trial Notice */}
        <p className="mt-4 text-xs text-gray-500">
          注册即可免费试用14天完整功能
        </p>
      </Card>
    );
  },
);

RegistrationPrompt.displayName = 'RegistrationPrompt';
