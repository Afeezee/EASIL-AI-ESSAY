// Drop-in replacement for the Base44 SDK client.
//
// Exposes the same shape the rest of the app expects:
//   base44.entities.Quiz / QuizAttempt  -> list / filter / get / create / update / delete
//   base44.auth                         -> me / login / register / logout
//   base44.integrations.Core            -> InvokeLLM / UploadFile / ExtractDataFromUploadedFile / ...
//
// Because this file preserves that shape, api/entities.js, api/integrations.js and every
// page keep working unchanged — only the backend behind them has changed.

const isLocalHost = (hostname) => ['localhost', '127.0.0.1', '::1'].includes(hostname);
const defaultApiUrl = typeof window !== 'undefined' && !isLocalHost(window.location.hostname)
    ? ''
    : 'http://localhost:4000';
const API_URL = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/$/, '');
const TOKEN_KEY = 'easil_token';
const USER_KEY = 'easil_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredUser = () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch { return null; }
};
function setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}
function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

async function request(pathname, { method = 'GET', body, isForm = false, headers: extraHeaders } = {}) {
    const headers = { ...(extraHeaders || {}) };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let payload;
    if (isForm) {
        payload = body; // FormData: let the browser set the multipart boundary.
    } else if (body !== undefined) {
        if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
        payload = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const requestUrl = API_URL ? `${API_URL}${pathname}` : pathname;
    const res = await fetch(requestUrl, { method, headers, body: payload });

    if (res.status === 204) return null;

    const text = await res.text();
    let data = null;
    if (text) {
        try { data = JSON.parse(text); }
        catch { data = { raw: text }; }
    }

    if (!res.ok) {
        let message = (data && (data.error || data.message || data.raw)) || `Request failed (${res.status})`;
        if (res.status === 404 && pathname.startsWith('/api/') && !API_URL) {
            message = 'API endpoint not found. Set VITE_API_URL to your deployed backend URL.';
        }
        const err = new Error(message);
        err.status = res.status;
        throw err;
    }
    return data;
}

// Build an entity accessor (Base44 entities.<Name> parity).
function makeEntity(name) {
    const base = `/api/entities/${name}`;
    return {
        list: (sort) => {
            const qs = sort ? `?sort=${encodeURIComponent(sort)}` : '';
            return request(`${base}${qs}`);
        },
        filter: (conditions = {}, sort) => {
            const params = new URLSearchParams();
            params.set('filter', JSON.stringify(conditions));
            if (sort) params.set('sort', sort);
            return request(`${base}?${params.toString()}`);
        },
        get: (id) => request(`${base}/${id}`),
        create: (data) => request(base, { method: 'POST', body: data }),
        update: (id, data) => request(`${base}/${id}`, { method: 'PATCH', body: data }),
        delete: (id) => request(`${base}/${id}`, { method: 'DELETE' }),
    };
}

const auth = {
    // Returns the current user, or null if not authenticated (so callers can branch gracefully).
    me: async () => {
        if (!getToken()) return null;
        try {
            const user = await request('/api/auth/me');
            setSession(null, user);
            return user;
        } catch (err) {
            if (err.status === 401) { clearSession(); return null; }
            throw err;
        }
    },
    login: async ({ email, password }) => {
        const { token, user } = await request('/api/auth/login', { method: 'POST', body: { email, password } });
        setSession(token, user);
        return user;
    },
    register: async ({ email, password, full_name }) => {
        const { token, user } = await request('/api/auth/register', {
            method: 'POST',
            body: { email, password, full_name },
        });
        setSession(token, user);
        return user;
    },
    logout: () => { clearSession(); },
    isAuthenticated: () => !!getToken(),
};

const notImplemented = (fn) => () => Promise.reject(new Error(`${fn} is not available in the self-hosted backend`));

const Core = {
    InvokeLLM: ({ prompt, response_json_schema }) =>
        request('/api/integrations/invoke-llm', { method: 'POST', body: { prompt, response_json_schema } }),

    UploadFile: ({ file }) => {
        const form = new FormData();
        form.append('file', file);
        return request('/api/integrations/upload', { method: 'POST', body: form, isForm: true });
    },

    ExtractDataFromUploadedFile: ({ file_url, json_schema }) =>
        request('/api/integrations/extract', { method: 'POST', body: { file_url, json_schema } }),

    // Guardrailed, server-side grading (prompts and score clamping live on the server).
    GradeShortAnswers: ({ items }) =>
        request('/api/integrations/grade-short-answers', { method: 'POST', body: { items } }),

    GradeEssay: ({ question, rubric, max_score, answer }) =>
        request('/api/integrations/grade-essay', { method: 'POST', body: { question, rubric, max_score, answer } }),

    // Unused by EASIL today — stubbed so imports never crash.
    SendEmail: notImplemented('SendEmail'),
    GenerateImage: notImplemented('GenerateImage'),
    CreateFileSignedUrl: notImplemented('CreateFileSignedUrl'),
    UploadPrivateFile: notImplemented('UploadPrivateFile'),
};

export const base44 = {
    entities: {
        Quiz: makeEntity('Quiz'),
        QuizAttempt: makeEntity('QuizAttempt'),
    },
    auth,
    integrations: { Core },
};
