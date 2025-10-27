/**
 * 统一的 API 请求封装：
 * - 自动附带 JWT 到 Authorization 头
 * - 支持通过 data 传递 POST/PUT/PATCH 请求体（JSON 或 FormData）
 * - 当未登录或返回 401 时在浏览器端跳转到登录页
 */
export interface ApiOptions extends RequestInit {
  headers?: HeadersInit;
  /** 便捷传参：POST/PUT/PATCH 的请求体，支持 JSON 或 FormData */
  data?: any;
  /** 认证错误（未登录/过期）是否自动跳转登录页，默认 true */
  redirectOnAuthError?: boolean;
  /** 登录页路径，默认 '/login' */
  loginPath?: string;
}

function getTokenFromClient(): string | null {
  if (typeof window === 'undefined') return null;
  const lsToken = window.localStorage.getItem('authToken');
  if (lsToken) return lsToken;
  const match = document.cookie.match(/(?:^|; )authToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiFetch(url: string, options: ApiOptions = {}) {
  const isBrowser = typeof window !== 'undefined';
  const token = getTokenFromClient();
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  const method = (options.method || 'GET').toString().toUpperCase();

  // 认证处理：无 token 时在浏览器端跳转登录页
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (isBrowser && options.redirectOnAuthError !== false) {
    const loginPath = options.loginPath || '/login';
    const back = encodeURIComponent(window.location.pathname + window.location.search);
    // 先跳转登录页，再抛出错误阻断后续逻辑
    window.location.href = `${loginPath}?redirect=${back}`;
    throw new Error('UNAUTHENTICATED');
  }

  // 便捷请求体：支持 data 传参（JSON 或 FormData）
  const hasBody = (options as any).body !== undefined;
  const isFormData = typeof FormData !== 'undefined' && options.data instanceof FormData;
  if (!hasBody && method !== 'GET' && options.data !== undefined) {
    if (isFormData) {
      (options as any).body = options.data;
    } else {
      // 默认按 JSON 发送
      // 注意：HeadersInit 可能不是普通对象，这里按对象方式设置即可
      (headers as any)['Content-Type'] = (headers as any)['Content-Type'] || 'application/json';
      (options as any).body = (headers as any)['Content-Type']?.includes('application/json')
        ? JSON.stringify(options.data)
        : options.data;
    }
  }

  // 默认接受 JSON 响应
  if (!('Accept' in (headers as any))) {
    (headers as any)['Accept'] = 'application/json';
  }

  const resp = await fetch(url, {
    ...options,
    method,
    headers,
  });

  // 认证过期处理：收到 401 自动跳转登录页
  if (isBrowser && resp.status === 401 && options.redirectOnAuthError !== false) {
    const loginPath = options.loginPath || '/login';
    const back = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${loginPath}?redirect=${back}`;
  }

  return resp;
}