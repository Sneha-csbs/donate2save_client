const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Generic API call function with authentication
const apiCall = async (endpoint, options = {}) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Request APIs
export const requestAPI = {
  getUserRequests: () => apiCall('/requests'), // Get authenticated user's requests
  getAll: () => apiCall('/requests/all'), // Get all requests (for donors)
  create: (data) => apiCall('/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiCall(`/requests/${id}`, {
    method: 'DELETE',
  }),
};

// Appointment APIs
export const appointmentAPI = {
  getUserAppointments: () => apiCall('/appointments'), // Get authenticated user's appointments
  create: (data) => apiCall('/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStatus: (id, status) => apiCall(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
  getDonorAppointments: () => apiCall('/appointments/donor'), // Get authenticated donor's appointments
};

// Donor APIs
export const donorAPI = {
  getHistory: () => apiCall('/donors/history'), // Get authenticated donor's history
  getStats: () => apiCall('/donors/stats'), // Get authenticated donor's stats
  checkEligibility: () => apiCall('/donors/eligibility'), // Check authenticated donor's eligibility
  getByBloodGroup: (bloodGroup) => apiCall(`/donors/bloodgroup/${bloodGroup}`),
};