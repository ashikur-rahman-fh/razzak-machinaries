export const API_ROUTES = {
  health: '/api/health/',
  hello: '/api/hello/',
  publicGeo: {
    divisions: '/api/public/geo/divisions/',
    districts: '/api/public/geo/districts/',
    upazilas: '/api/public/geo/upazilas/',
    unions: '/api/public/geo/unions/',
  },
  adminAuth: {
    csrf: '/api/admin/auth/csrf/',
    login: '/api/admin/auth/login/',
    logout: '/api/admin/auth/logout/',
    me: '/api/admin/auth/me/',
    changePassword: '/api/admin/auth/change-password/',
  },
  adminGeo: {
    divisions: '/api/admin/geo/divisions/',
    districts: '/api/admin/geo/districts/',
    upazilas: '/api/admin/geo/upazilas/',
    unions: '/api/admin/geo/unions/',
    divisionDetail: (id: number) => `/api/admin/geo/divisions/${id}/`,
    districtDetail: (id: number) => `/api/admin/geo/districts/${id}/`,
    upazilaDetail: (id: number) => `/api/admin/geo/upazilas/${id}/`,
    unionDetail: (id: number) => `/api/admin/geo/unions/${id}/`,
  },
} as const;
