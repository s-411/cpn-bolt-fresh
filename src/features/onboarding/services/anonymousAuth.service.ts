export class AnonymousAuthService {
  static async createAnonymousSession() {
    throw new Error('Not implemented');
  }

  static async getCurrentSession(userId: string) {
    throw new Error('Not implemented');
  }

  static async updateStep(sessionId: string, step: number) {
    throw new Error('Not implemented');
  }

  static async convertAnonymousToPermanent(email: string) {
    throw new Error('Not implemented');
  }

  static async isAnonymousUser() {
    return false;
  }
}
