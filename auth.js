// auth.js — Supabase auth handling

const Auth = {
  client: null,

  init() {
    if (!window.CONFIG?.SUPABASE_URL || !window.CONFIG?.SUPABASE_ANON) return null;
    this.client = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON);
    return this.client;
  },

  async getUser() {
    if (!this.client) return null;
    const { data: { user } } = await this.client.auth.getUser();
    return user;
  },

  async signUp(email, password) {
    const { data, error } = await this.client.auth.signUp({ email, password });
    return { data, error };
  },

  async signIn(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  async signOut() {
    await this.client.auth.signOut();
    window.location.href = 'login.html';
  },

  async requireAuth() {
    const user = await this.getUser();
    if (!user) { window.location.href = 'login.html'; return null; }
    return user;
  },
};
