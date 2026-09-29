// API Client for KaushalAI

const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('sahakar_token');
export const setAuthToken = (token) => localStorage.getItem('sahakar_token', token);

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('sahakar_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// Offline Queue Management for Smart Attendance
const QUEUE_KEY = 'sahakar_offline_attendance_queue';

export function getOfflineQueue() {
  try {
    const items = localStorage.getItem(QUEUE_KEY);
    return items ? JSON.parse(items) : [];
  } catch (e) {
    return [];
  }
}

export function addToOfflineQueue(event) {
  const queue = getOfflineQueue();
  queue.push(event);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return queue.length;
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function flushOfflineQueue(deviceId = 'KIOSK-001') {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, duplicates: 0 };

  const res = await apiRequest('/attendance/sync', {
    method: 'POST',
    body: JSON.stringify({
      device_id: deviceId,
      events: queue
    })
  });

  clearOfflineQueue();
  return res;
}
