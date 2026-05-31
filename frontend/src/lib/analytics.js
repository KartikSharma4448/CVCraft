/**
 * Google Analytics 4 tracking utilities.
 *
 * All functions no-op when the GA4 measurement ID (REACT_APP_GA4_ID)
 * is not configured in the environment.
 */

const GA4_ID = process.env.REACT_APP_GA4_ID;

/**
 * Dynamically loads the gtag.js script and initializes GA4.
 * No-ops if REACT_APP_GA4_ID is not set.
 */
export function initGA4() {
  if (!GA4_ID) return;

  // Avoid loading the script more than once
  if (document.querySelector(`script[src*="googletagmanager.com/gtag"]`)) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID);
}

/**
 * Sends a page_view event to GA4.
 * No-ops if GA4 measurement ID is not configured or gtag is unavailable.
 *
 * @param {string} path  - The page path (e.g. "/create-cv")
 * @param {string} title - The page title
 */
export function trackPageView(path, title) {
  if (!GA4_ID || !window.gtag) return;
  window.gtag('config', GA4_ID, { page_path: path, page_title: title });
}

/**
 * Sends a custom event to GA4.
 * No-ops if GA4 measurement ID is not configured or gtag is unavailable.
 *
 * @param {string} eventName - The event name (e.g. "pdf_generated")
 * @param {Object} params    - Optional event parameters
 */
export function trackEvent(eventName, params = {}) {
  if (!GA4_ID || !window.gtag) return;
  window.gtag('event', eventName, params);
}
