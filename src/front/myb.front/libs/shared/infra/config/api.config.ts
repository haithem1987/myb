/**
 * API Configuration
 * Adjust these URLs based on deployment environment
 * Development (Docker Compose): uses mapped ports 8084, 8085, etc.
 * Production: adjust to your production domains
 */

const isDevelopment = !window.location.hostname.includes('prod');

// Determine API base URLs based on environment
const getApiBaseUrl = () => {
  if (isDevelopment) {
    // Docker Compose mapped ports
    return {
      payment: 'http://localhost:8084',
      notification: 'http://localhost:8085',
      invoice: 'http://localhost:8083',
      document: 'http://localhost:8086',
      ocr: 'http://127.0.0.1:5000', // OCR service (separate Python service)
    };
  } else {
    // Production URLs - adjust as needed
    return {
      payment: `${window.location.origin}/api/payment`,
      notification: `${window.location.origin}/api/notification`,
      invoice: `${window.location.origin}/api/invoice`,
      document: `${window.location.origin}/api/document`,
      ocr: `${window.location.origin}/api/ocr`,
    };
  }
};

export const API_CONFIG = getApiBaseUrl();
