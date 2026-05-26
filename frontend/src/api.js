const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export async function getItems() {
  const response = await fetch(`${API_BASE_URL}/api/items`);
  return handleResponse(response);
}

export async function createItem(payload) {
  const response = await fetch(`${API_BASE_URL}/api/items`, {
    method: 'POST',
    body: toFormData(payload)
  });
  return handleResponse(response);
}

export async function updateItem(id, payload) {
  const response = await fetch(`${API_BASE_URL}/api/items/${id}`, {
    method: 'PUT',
    body: toFormData(payload)
  });
  return handleResponse(response);
}

export async function deleteItem(id) {
  const response = await fetch(`${API_BASE_URL}/api/items/${id}`, {
    method: 'DELETE'
  });
  if (response.status === 204) return true;
  return handleResponse(response);
}

function toFormData(payload) {
  const data = new FormData();
  data.append('name', payload.name);
  data.append('description', payload.description || '');
  if (payload.file) data.append('file', payload.file);
  if (payload.removeFile) data.append('removeFile', 'true');
  return data;
}

async function handleResponse(response) {
  if (response.ok) {
    return response.json();
  }

  let message = 'Request failed';
  try {
    const error = await response.json();
    message = error.message || message;
  } catch {
    message = response.statusText || message;
  }
  throw new Error(message);
}
