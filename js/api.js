const BASE = '';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json();
}

// --- Business Profile ---
export const getBusinessProfile = () => request('/api/business');
export const saveBusinessProfile = (data) => request('/api/business', {
  method: 'POST', body: JSON.stringify(data),
});

// --- Images ---
export const getImages = () => request('/api/images');
export async function uploadImages(files) {
  const form = new FormData();
  for (const f of files) form.append('images', f);
  const res = await fetch('/api/images', { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}
export const deleteImage = (id) => request(`/api/images/${id}`, { method: 'DELETE' });

// --- Inspiration Templates ---
export const getTemplates = () => request('/api/templates');
export const saveTemplate = (data) => request('/api/templates', {
  method: 'POST', body: JSON.stringify(data),
});
export const updateTemplate = (id, data) => request(`/api/templates/${id}`, {
  method: 'PUT', body: JSON.stringify(data),
});
export const deleteTemplate = (id) => request(`/api/templates/${id}`, { method: 'DELETE' });

// --- Generation ---
export const generateVariants = (format) => request('/api/generate', {
  method: 'POST', body: JSON.stringify({ format }),
});

// --- Variants ---
export const getVariants = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/variants${qs ? '?' + qs : ''}`);
};
export const rateVariant = (id, rating) => request(`/api/variants/${id}/rate`, {
  method: 'PUT', body: JSON.stringify({ rating }),
});
export const deleteVariant = (id) => request(`/api/variants/${id}`, { method: 'DELETE' });

// --- Export ---
export async function exportVariantPng(id) {
  const res = await fetch(`/api/variants/${id}/export`, { method: 'POST' });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `variant-${id}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
