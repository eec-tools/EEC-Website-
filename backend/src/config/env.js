const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const config = {
  port: parseInt(process.env.PORT || "8000", 10),

  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  useInMemoryDb: process.env.USE_IN_MEMORY_DB !== "0",

  jwtSecret: required("JWT_SECRET"),
  jwtAlgorithm: "HS256",

  appName: process.env.APP_NAME || "elan-exports-v2",
  adminEmail: process.env.ADMIN_EMAIL || "admin@eectrade.com",
  adminPassword: process.env.ADMIN_PASSWORD,

  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleOauthRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
  googleAuthorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  googleTokenUrl: "https://oauth2.googleapis.com/token",
  googleUserinfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",

  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsS3BucketName: process.env.AWS_S3_BUCKET_NAME,
  awsRegion: process.env.AWS_REGION,
  localUploadDir: path.join(__dirname, "..", "..", "uploads"),

  cookieSecure: process.env.COOKIE_SECURE === "1",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3001",

  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || "587", 10),
  smtpUsername: process.env.SMTP_USERNAME,
  smtpPassword: process.env.SMTP_PASSWORD,
  get smtpFrom() {
    return process.env.SMTP_FROM || this.smtpUsername || "no-reply@eectrade.com";
  },

  // Every request in this app sends cookies (withCredentials), and browsers reject
  // a wildcard Access-Control-Allow-Origin whenever credentials are included — so
  // "*" is never actually usable here. Fall back to FRONTEND_URL instead of "*"
  // when CORS_ORIGINS isn't explicitly set.
  get corsOrigins() {
    return process.env.CORS_ORIGINS || this.frontendUrl;
  },
};

module.exports = config;
