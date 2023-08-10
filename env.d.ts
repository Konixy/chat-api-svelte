declare namespace NodeJS {
  interface ProcessEnv {
    URL: string;
    PORT: string;
    CLIENT_ORIGIN: string;
    MONGODB_URI: string;
    NEXTAUTH_URL: string;
  }
}
