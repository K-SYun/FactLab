export const getBackendApiBase = () => {
  return window.location.port === '80' || window.location.port === '' ? '/api' : 'http://localhost/api';
};