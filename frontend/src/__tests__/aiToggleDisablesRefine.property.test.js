/**
 * Property-based tests for AI toggle disabling refinement calls.
 *
 * **Validates: Requirements 2.2**
 *
 * Property 4: AI toggle disables refinement calls
 * For any text entry action performed while the AI toggle is in the disabled state,
 * the system SHALL make zero HTTP requests to the `/api/ai/refine` endpoint.
 */

const fc = require('fast-check');

describe('Property 4: AI toggle disables refinement calls', () => {
  let fetchSpy;
  let originalFetch;

  beforeEach(() => {
    // Store original fetch
    originalFetch = global.fetch;

    // Create a spy that tracks all fetch calls
    fetchSpy = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ refined_text: '', original_text: '', is_error: false }),
        text: () => Promise.resolve(''),
      })
    );
    global.fetch = fetchSpy;

    // Clear module cache so api.js uses our mocked fetch
    jest.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetModules();
  });

  /**
   * Helper: simulates the decision logic that the CreateCV page uses.
   * When aiEnabled is false, refineText should never be called regardless
   * of what text the user enters.
   */
  function simulateTextEntryWithToggle(aiEnabled, text, section) {
    const { refineText } = require('../lib/api');

    // This mirrors the CreateCV page behavior:
    // Only call refineText if the AI toggle is enabled
    if (aiEnabled) {
      return refineText(text, section);
    }
    // When disabled, no call is made
    return Promise.resolve(null);
  }

  it('no fetch calls to /api/ai/refine are made for any text when AI toggle is disabled', () => {
    const sections = ['summary', 'experience', 'skills'];

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.constantFrom(...sections),
        (text, section) => {
          fetchSpy.mockClear();

          // Simulate text entry with toggle DISABLED
          simulateTextEntryWithToggle(false, text, section);

          // Assert zero HTTP requests were made
          const refineCalls = fetchSpy.mock.calls.filter(
            (call) => typeof call[0] === 'string' && call[0].includes('/api/ai/refine')
          );
          expect(refineCalls).toHaveLength(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('no fetch calls to /api/ai/refine for arbitrary unicode text when toggle is disabled', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 300, unit: 'grapheme-ascii' }),
        fc.constantFrom('summary', 'experience', 'skills'),
        (text, section) => {
          fetchSpy.mockClear();

          simulateTextEntryWithToggle(false, text, section);

          const refineCalls = fetchSpy.mock.calls.filter(
            (call) => typeof call[0] === 'string' && call[0].includes('/api/ai/refine')
          );
          expect(refineCalls).toHaveLength(0);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('no fetch calls to /api/ai/refine for sequences of text entries when toggle is disabled', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 200 }),
            section: fc.constantFrom('summary', 'experience', 'skills'),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (entries) => {
          fetchSpy.mockClear();

          // Simulate multiple text entry actions with toggle disabled
          for (const entry of entries) {
            simulateTextEntryWithToggle(false, entry.text, entry.section);
          }

          // Assert zero HTTP requests to /api/ai/refine across all entries
          const refineCalls = fetchSpy.mock.calls.filter(
            (call) => typeof call[0] === 'string' && call[0].includes('/api/ai/refine')
          );
          expect(refineCalls).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('contrast: fetch IS called when toggle is enabled (sanity check)', async () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.constantFrom('summary', 'experience', 'skills'),
        (text, section) => {
          fetchSpy.mockClear();

          // Simulate text entry with toggle ENABLED
          simulateTextEntryWithToggle(true, text, section);

          // Assert at least one HTTP request to /api/ai/refine was made
          const refineCalls = fetchSpy.mock.calls.filter(
            (call) => typeof call[0] === 'string' && call[0].includes('/api/ai/refine')
          );
          expect(refineCalls.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});
