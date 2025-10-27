'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { apiFetch } from '@/lib/utils/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        data: { username, password },
        // 登录页不需要认证重定向，避免因无 token 拦截
        redirectOnAuthError: false,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '登录失败');
      }

      // 保存认证信息到本地存储（供前端 Authorization 使用）
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // 登录成功，跳转到首页
      router.push('/tryon');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white rounded-lg shadow-xl w-96 p-8">
        <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="group p-3 rounded-xl bg-white transition">
                <img
                  src="/WebEye_logo_RGB_Web-08.png"
                  alt="Logo"
                  width={200}
                  height={120}
                  className="object-contain duration-300"
                />
              </div>
            </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Aictr Center - AI创意平台
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            请登录您的平台账户
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <UserOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-base" style={{ color: 'gray' }}/>
              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                className="w-full py-2 pl-9 pr-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-black placeholder:text-gray-400"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="relative">
              <LockOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-base" style={{ color: 'gray' }}/>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="w-full py-2 pl-9 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-black placeholder:text-gray-400"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* 显示/隐藏密码 */}
              <button
                type="button"
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeInvisibleOutlined className="text-base" />
                ) : (
                  <EyeOutlined className="text-base" />
                )}
              </button>
            </div>
            
            {error && (
              <div className="text-red-500 text-xs mb-8">{error}</div>
            )}

            
            {/* <div className="flex justify-between items-center text-xs">
              <div className="text-gray-500">记住密码</div>
              <Link href="#" className="text-blue-500 hover:underline">
                忘记密码?
              </Link>
            </div> */}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md text-sm 
              font-medium transition-colors duration-200 mt-6"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}