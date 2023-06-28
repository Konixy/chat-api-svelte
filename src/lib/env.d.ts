declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      URL: string;
      CLIENT_ORIGIN: string;
    }
  }
}

export {};
