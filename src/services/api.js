// src/services/api.js

// Ajusta al dominio de tu backend
export const BACKEND_URL = "https://posback-production.up.railway.app";

/******************************************************
 *   Manejo de LocalStorage de sesión
 ******************************************************/
export function storeSessionToLocalStorage(user, session) {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
  if (session) {
    localStorage.setItem('currentSession', JSON.stringify(session));
  } else {
    localStorage.removeItem('currentSession');
  }
}

export function restoreSessionFromLocalStorage() {
  let user = null;
  let session = null;
  const lsUser = localStorage.getItem('currentUser');
  if (lsUser) {
    user = JSON.parse(lsUser);
  }
  const lsSession = localStorage.getItem('currentSession');
  if (lsSession) {
    session = JSON.parse(lsSession);
  }
  return { user, session };
}

/******************************************************
 *   Manejo de data en Local Storage (cache)
 ******************************************************/
export function storeDataInCache(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
export function getDataFromCache(key) {
  const str = localStorage.getItem(key);
  if (!str) return null;
  return JSON.parse(str);
}

/******************************************************
 *   Fetch genéricos (puedes ajustar según tus endpoints)
 ******************************************************/
export async function fetchAllUsers() {
  const resp = await fetch(`${BACKEND_URL}/users?limit=99999&offset=0&order=username:asc`);
  return resp.json();
}
export async function fetchCategories(limit = 99999) {
  const resp = await fetch(`${BACKEND_URL}/categories?limit=${limit}&offset=0&order=name:asc`);
  return resp.json();
}
export async function fetchBrands(limit = 99999) {
  const resp = await fetch(`${BACKEND_URL}/brands?limit=${limit}&offset=0&order=name:asc`);
  return resp.json();
}
export async function fetchProducts(limit = 99999) {
  const resp = await fetch(`${BACKEND_URL}/products?limit=${limit}&offset=0&order=name:asc`);
  return resp.json();
}
export async function fetchSales() {
  const resp = await fetch(`${BACKEND_URL}/sales?limit=99999&offset=0&order=date:asc`);
  return resp.json();
}

/******************************************************
 *   Prefetch data con caché local
 ******************************************************/
export async function prefetchData(key, fetchFunc, limit=50) {
  // Si ya existe en caché, devuélvelo
  const existing = getDataFromCache(key);
  if (existing && existing.length > 0) return existing;

  // Sino, fetch y almacenar
  const data = await fetchFunc(limit);
  storeDataInCache(key, data);
  return data;
}

/******************************************************
 *   Conversión de imagen a WebP
 ******************************************************/
export async function convertToWebp(base64Data) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
      let canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      let ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      let webpData = canvas.toDataURL('image/webp', 0.8);
      resolve(webpData);
    };
    img.onerror = function(err) {
      reject(err);
    };
    img.src = base64Data;
  });
}
