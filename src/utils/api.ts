import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-58aa32b3`;

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  summary: string;
  category: string;
  pdfUrl?: string;
  coverImageUrl?: string;
  createdAt: number;
}

export interface UserProfile {
  id: string;
  login: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  city: string;
  aboutMe: string;
  favorites: string[];
  recent: string[];
}

// ==================== AUTH API ====================

export async function signup(data: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  city: string;
  aboutMe: string;
  password: string;
}) {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signup failed');
  }

  return response.json();
}

export async function signin(login: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ login, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Sign in failed');
  }

  return response.json();
}

export async function getCurrentUser(accessToken: string): Promise<{ user: UserProfile }> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Access-Token': accessToken,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Get current user error response:', text);
    console.error('Access token used:', accessToken);
    try {
      const error = JSON.parse(text);
      throw new Error(error.error || 'Failed to get user');
    } catch (e) {
      throw new Error(`Failed to get user: ${text}`);
    }
  }

  return response.json();
}

// ==================== ADMIN API ====================

export async function adminLogin(password: string) {
  const response = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Admin login failed');
  }

  return response.json();
}

export async function getUsers(adminToken: string) {
  const response = await fetch(`${API_BASE}/admin/users`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Admin-Token': adminToken,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Get users error response:', text);
    try {
      const error = JSON.parse(text);
      throw new Error(error.error || 'Failed to get users');
    } catch (e) {
      throw new Error(`Failed to get users: ${text}`);
    }
  }

  return response.json();
}

export async function addBook(adminToken: string, bookData: {
  title: string;
  author: string;
  description: string;
  summary: string;
  category: string;
  pdfBase64?: string;
  coverImageBase64?: string;
}) {
  const response = await fetch(`${API_BASE}/admin/books`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Admin-Token': adminToken,
    },
    body: JSON.stringify(bookData),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Add book error response:', text);
    try {
      const error = JSON.parse(text);
      throw new Error(error.error || 'Failed to add book');
    } catch (e) {
      throw new Error(`Failed to add book: ${text}`);
    }
  }

  return response.json();
}

export async function deleteBook(adminToken: string, bookId: string) {
  const response = await fetch(`${API_BASE}/admin/books/${bookId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Admin-Token': adminToken,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete book');
  }

  return response.json();
}

// ==================== BOOKS API ====================

export async function getBooks(): Promise<{ books: Book[] }> {
  const response = await fetch(`${API_BASE}/books`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error fetching books:', error);
    throw new Error(error.error || 'Failed to get books');
  }

  return response.json();
}

export async function getBook(bookId: string): Promise<{ book: Book }> {
  const response = await fetch(`${API_BASE}/books/${bookId}`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get book');
  }

  return response.json();
}

// ==================== USER ACTIONS ====================

export async function addToFavorites(accessToken: string, bookId: string) {
  const response = await fetch(`${API_BASE}/user/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Access-Token': accessToken,
    },
    body: JSON.stringify({ bookId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add to favorites');
  }

  return response.json();
}

export async function removeFromFavorites(accessToken: string, bookId: string) {
  const response = await fetch(`${API_BASE}/user/favorites/${bookId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Access-Token': accessToken,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove from favorites');
  }

  return response.json();
}

export async function addToRecent(accessToken: string, bookId: string) {
  const response = await fetch(`${API_BASE}/user/recent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Access-Token': accessToken,
    },
    body: JSON.stringify({ bookId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add to recent');
  }

  return response.json();
}