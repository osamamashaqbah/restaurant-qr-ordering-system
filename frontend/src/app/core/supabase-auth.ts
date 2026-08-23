import { HttpClient } from '@angular/common/http';
import { EnvironmentProviders, Injectable, InjectionToken, inject, makeEnvironmentProviders, signal } from '@angular/core';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';

export interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
}

export interface StaffIdentity {
  role: 'admin' | 'cashier' | 'kitchen';
  fullName: string;
}

export const SUPABASE_RUNTIME_CONFIG = new InjectionToken<SupabaseRuntimeConfig>('SUPABASE_RUNTIME_CONFIG');
export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient | null | Promise<SupabaseClient | null>>('SUPABASE_CLIENT');

export function provideSupabaseAuth(config: SupabaseRuntimeConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SUPABASE_RUNTIME_CONFIG, useValue: config },
    {
      provide: SUPABASE_CLIENT,
      useFactory: () => {
        const runtime = inject(SUPABASE_RUNTIME_CONFIG);
        if (!runtime.url || !runtime.anonKey) return null;

        return import('@supabase/supabase-js').then(({ createClient }) => createClient(runtime.url, runtime.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
          },
        }));
      },
    },
  ]);
}

@Injectable({ providedIn: 'root' })
export class StaffAuthService {
  private readonly clientProvider = inject(SUPABASE_CLIENT);
  private readonly http = inject(HttpClient);
  private readonly sessionState = signal<Session | null>(null);
  private readonly identityState = signal<StaffIdentity | null>(null);
  private client: SupabaseClient | null = null;
  private readonly readyPromise: Promise<void>;

  readonly session = this.sessionState.asReadonly();
  readonly identity = this.identityState.asReadonly();

  constructor() {
    this.readyPromise = this.initialize();
  }

  ready(): Promise<void> {
    return this.readyPromise;
  }

  async signIn(email: string, password: string): Promise<string | null> {
    const client = await this.resolveClient();
    if (!client) return 'Staff sign-in is not configured.';

    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.session) return 'Invalid email or password.';

    this.sessionState.set(data.session);
    if (await this.loadIdentity(false)) return null;

    await this.signOut();
    return 'Your account does not have an assigned staff role.';
  }

  async signOut(): Promise<void> {
    this.identityState.set(null);
    this.sessionState.set(null);
    const client = await this.resolveClient();
    await client?.auth.signOut();
  }

  async refreshIdentity(): Promise<StaffIdentity | null> {
    return this.loadIdentity(false);
  }

  private async initialize(): Promise<void> {
    const client = await this.resolveClient();
    if (!client) return;

    client.auth.onAuthStateChange((_event, session) => {
      this.sessionState.set(session);
      if (!session) {
        this.identityState.set(null);
        return;
      }

      queueMicrotask(() => void this.loadIdentity(true));
    });

    const { data } = await client.auth.getSession();
    this.sessionState.set(data.session);
    if (data.session) await this.loadIdentity(true);
  }

  private async resolveClient(): Promise<SupabaseClient | null> {
    if (this.client) return this.client;

    this.client = await this.clientProvider;
    return this.client;
  }

  private async loadIdentity(signOutOnFailure: boolean): Promise<StaffIdentity | null> {
    if (!this.sessionState()) return null;

    try {
      const identity = await firstValueFrom(this.http.get<StaffIdentity>('/api/staff/me'));
      this.identityState.set(identity);
      return identity;
    } catch {
      this.identityState.set(null);
      if (signOutOnFailure) await this.signOut();
      return null;
    }
  }
}
