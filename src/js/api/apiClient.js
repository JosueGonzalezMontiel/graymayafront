export class APIClient {
  constructor() {
    this.API_BASE = window.__API_BASE__ || "https://api.graymaya.shop";
    this.API_KEY = window.__API_KEY__ || "dev_key_gms_330455";
  }

  async fetch(path, options = {}) {
    const url = path.startsWith("http") ? path : `${this.API_BASE}${path}`;
    const headers = options.headers || {};
    headers["X-API-KEY"] = this.API_KEY;
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${text}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  async fetchBlob(path, options = {}) {
    const url = path.startsWith("http") ? path : `${this.API_BASE}${path}`;
    const headers = options.headers || {};
    headers["X-API-KEY"] = this.API_KEY;
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${text}`);
    }
    return res.blob();
  }

  async fetchReference(resource) {
    const res = await this.fetch(`/${resource}?limit=200&offset=0`);
    if (res && res.items) return res.items;
    return Array.isArray(res) ? res : [];
  }
  async createReference(resource, payload) {
    return this.fetch(`/${resource}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  async updateReference(resource, id, payload) {
    return this.fetch(`/${resource}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }
  async deleteReference(resource, id) {
    return this.fetch(`/${resource}/${id}`, { method: "DELETE" });
  }

  async fetchText(path, options = {}) {
    const url = path.startsWith("http") ? path : `${this.API_BASE}${path}`;
    const headers = options.headers || {};
    headers["X-API-KEY"] = this.API_KEY;
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${msg || res.statusText}`);
    }
    return res.text();
  }
}

export const API = new APIClient();
window.API = API; // compat
