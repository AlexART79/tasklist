declare global {
  namespace Express {
    interface User {
      id: string;
      provider: 'google' | 'github';
      providerUserId: string;
      email: string | null;
      displayName: string | null;
      avatarUrl: string | null;
      createdAt: Date;
    }
  }
}
export {};
