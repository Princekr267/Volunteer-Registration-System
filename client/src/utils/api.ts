const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) {
    return '/api';
  }
  const cleanUrl = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  if (!cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/api`;
  }
  return cleanUrl;
};

const BASE_URL = getBaseUrl();

interface RequestOptions extends RequestInit {
  body?: any;
}

async function request(path: string, options: RequestOptions = {}) {
  const url = `${BASE_URL}${path}`;
  
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.body);
  }
  
  options.credentials = 'include';
  options.headers = headers;

  const response = await fetch(url, options);

  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('text/csv')) {
    return response.blob();
  }

  if (!contentType.includes('application/json')) {
    throw new Error('Server returned invalid response format');
  }

  const data = await response.json().catch(() => null);

  if (data === null || !response.ok) {
    throw new Error(data?.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  get: (path: string, options?: RequestOptions) => 
    request(path, { ...options, method: 'GET' }),
    
  post: (path: string, body?: any, options?: RequestOptions) => 
    request(path, { ...options, method: 'POST', body }),
    
  put: (path: string, body?: any, options?: RequestOptions) => 
    request(path, { ...options, method: 'PUT', body }),
    
  delete: (path: string, options?: RequestOptions) => 
    request(path, { ...options, method: 'DELETE' }),
};
export default api;
