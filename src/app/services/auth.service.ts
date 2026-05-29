import { Injectable, signal } from '@angular/core';
import { createAuthClient } from '@neondatabase/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private client = createAuthClient(environment.neonAuthUrl);
  
  user = signal<any>(null);
  session = signal<any>(null);
  authError = signal<string | null>(null);

  constructor(private http: HttpClient) {
    this.checkSession();
  }

  async signIn(email: string, password: string) {
    this.authError.set(null);
    try {
      const result = await this.client.signIn.email({ email, password });
      if (result.error) {
        this.authError.set(result.error.message || 'Login failed.');
        return { error: result.error };
      }
      
      if (result.data) {
        this.user.set(result.data.user);
        this.session.set(result.data); // result.data contains the token and user
        return { data: result.data };
      }
    } catch (err: any) {
      this.authError.set(err.message || 'Network error.');
      return { error: err };
    }
    return { error: 'Unknown error' };
  }

  async signOut() {
    await this.client.signOut();
    this.user.set(null);
    this.session.set(null);
  }

  async checkSession() {
    try {
      const { data } = await this.client.getSession();
      if (data) {
        this.user.set(data.user);
        this.session.set(data.session || data);
      }
    } catch (e) {
      console.warn("No active session.");
    }
  }

  // Gets the underlying token for the interceptor
  async getToken(): Promise<string | null> {
    const { data } = await this.client.getSession();
    return data?.session?.token || (data as any)?.token || null; 
  }
}
