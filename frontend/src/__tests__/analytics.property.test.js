/**
 * Property-based tests for GA4 event suppression.
 *
 * **Validates: Requirements 7.6**
 *
 * Property 12: GA4 events suppressed without measurement ID
 * For any trackable user action (page view, PDF generation, ATS check, toggle change),
 * if the GA4 measurement ID environment variable is not configured, the analytics module
 * SHALL make zero calls to window.gtag.
 */

const fc = require('fast-check');

describe('Property 12: GA4 events suppressed without measurement ID', () => {
  let analytics;

  beforeEach(() => {
    // Ensure REACT_APP_GA4_ID is NOT set
    delete process.env.REACT_APP_GA4_ID;

    // Set up a mock gtag on window to detect any calls
    window.gtag = jest.fn();

    // Clear module cache so analytics.js re-evaluates process.env.REACT_APP_GA4_ID
    jest.resetModules();

    // Re-require the module with the env unset
    analytics = require('../lib/analytics');
  });

  afterEach(() => {
    delete window.gtag;
    jest.resetModules();
  });

  it('initGA4 never calls window.gtag when measurement ID is unset', () => {
    analytics.initGA4();
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it('trackPageView never calls window.gtag for arbitrary paths and titles when measurement ID is unset', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (path, title) => {
          window.gtag.mockClear();
          analytics.trackPageView(path, title);
          expect(window.gtag).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('trackEvent never calls window.gtag for arbitrary event names and params when measurement ID is unset', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
        (eventName, params) => {
          window.gtag.mockClear();
          analytics.trackEvent(eventName, params);
          expect(window.gtag).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no GA4 function calls window.gtag for any combination of actions when measurement ID is unset', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
        (path, title, eventName, params) => {
          window.gtag.mockClear();

          analytics.initGA4();
          analytics.trackPageView(path, title);
          analytics.trackEvent(eventName, params);

          expect(window.gtag).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
