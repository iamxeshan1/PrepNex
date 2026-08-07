export const isAppMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('app') === 'false') {
    localStorage.removeItem('prepnext_app_mode');
    return false;
  }
  if (searchParams.get('app') === 'true') {
    localStorage.setItem('prepnext_app_mode', 'true');
    return true;
  }
  if (window.location.pathname.startsWith('/app')) {
    localStorage.setItem('prepnext_app_mode', 'true');
    return true;
  }
  return localStorage.getItem('prepnext_app_mode') === 'true';
};

export const clearAppMode = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('prepnext_app_mode');
  }
};
