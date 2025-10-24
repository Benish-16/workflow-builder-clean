import { getAccessTokenFromStorage } from './storage-util';

export const authFetch = async (url: string, options: RequestInit = {}) => {
  const tokenObj = getAccessTokenFromStorage();
  if (!tokenObj) throw new Error("No auth token found. User might not be logged in.");

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${tokenObj.token}`,
    ...(options.headers || {}), // merge custom headers
  };

  const response = await fetch(url, { ...options, headers });
  return response;
};
