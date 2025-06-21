// Next.js API Routes 기반으로 변경
const getBaseURL = () => {
  // 환경변수가 설정되어 있으면 우선 사용
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // 브라우저 환경에서 현재 호스트 기반으로 API URL 생성
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }
  
  // 서버사이드에서는 기본값 사용 (Next.js 개발 서버)
  return 'http://localhost:3000';
};

const BASE_URL = getBaseURL();

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  // Next.js API Routes 경로로 변경 (api 접두사 추가)
  const apiPath = path.startsWith('/api') ? path : `/api${path}`;
  
  const res = await fetch(`${BASE_URL}${apiPath}`, {
    ...options,
    headers,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API Error');
  }
  
  return res.json();
}

// 특별한 API 함수들 (기존 코드와의 호환성을 위해)
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
};

export const carAPI = {
  getAll: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch(`/car${query}`);
  },
  getById: (id: string) => apiFetch(`/car/${id}`),
  create: (data: any) => apiFetch('/car', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiFetch(`/car/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiFetch(`/car/${id}`, {
    method: 'DELETE',
  }),
};

export const customerAPI = {
  getAll: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch(`/customer${query}`);
  },
  getById: (id: string) => apiFetch(`/customer/${id}`),
  create: (data: any) => apiFetch('/customer', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiFetch(`/customer/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiFetch(`/customer/${id}`, {
    method: 'DELETE',
  }),
};

export const dashboardAPI = {
  getData: () => apiFetch('/dashboard'),
}; 