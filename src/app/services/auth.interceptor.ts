import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (token && !req.url.includes('/api/auth/')) {
    console.log(`[Auth] Adding Bearer token to: ${req.method} ${req.url}`);
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  if (!token) {
    console.warn(`[Auth] No token found for: ${req.method} ${req.url}`);
  }

  return next(req);
};
