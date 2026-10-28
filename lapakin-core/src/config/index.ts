const config = {
  app: {
    name: 'lapakin-core',
    port: Number(process.env.PORT) || 3000,
    db: process.env.DATABASE_URL || 'postgres://lapakin:lapakin@localhost:5433/lapakin',
    jwtSecret: process.env.JWT_SECRET || 'lapakin-super-secret-jwt-key-must-be-long-enough',
    jwtAccessTtlSec: Number(process.env.JWT_ACCESS_TTL_SEC) || 900,
    refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS) || 7,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@lapakin.id',
    seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
    wlroutes: ['/health', '/api/auth/login', '/api/auth/refresh'],
  },
};

export default config;
