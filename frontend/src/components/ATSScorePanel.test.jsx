import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import ATSScorePanel from './ATSScorePanel';

// Mock the analytics module
jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

// Mock the api module
jest.mock('@/lib/api', () => ({
  getATSScore: jest.fn(),
}));

const { trackEvent } = require('@/lib/analytics');
const { getATSScore } = require('@/lib/api');

let container = null;
let root = null;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  jest.clearAllMocks();
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  container = null;
  root = null;
});

describe('ATSScorePanel', () => {
  it('renders textarea for job description input', () => {
    act(() => {
      root.render(<ATSScorePanel cvText="My resume text" />);
    });
    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();
    expect(textarea.getAttribute('placeholder')).toContain('job description');
  });

  it('renders Check Score button', () => {
    act(() => {
      root.render(<ATSScorePanel cvText="My resume text" />);
    });
    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button.textContent).toBe('Check Score');
  });

  it('disables button when job description is empty', () => {
    act(() => {
      root.render(<ATSScorePanel cvText="My resume text" />);
    });
    const button = container.querySelector('button');
    expect(button.disabled).toBe(true);
  });

  it('enables button when job description has content', () => {
    act(() => {
      root.render(<ATSScorePanel cvText="My resume text" />);
    });
    const textarea = container.querySelector('textarea');
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      nativeInputValueSetter.call(textarea, 'Looking for a developer');
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const button = container.querySelector('button');
    expect(button.disabled).toBe(false);
  });

  it('fires GA4 ats_score_checked event when score is requested', async () => {
    getATSScore.mockResolvedValue({
      score: 75,
      matched_terms: ['react', 'javascript'],
      missing_terms: ['python'],
      method: 'semantic',
    });

    act(() => {
      root.render(<ATSScorePanel cvText="My resume with react and javascript" />);
    });

    const textarea = container.querySelector('textarea');
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      nativeInputValueSetter.call(textarea, 'Need react developer');
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const button = container.querySelector('button');
    await act(async () => {
      button.click();
    });

    expect(trackEvent).toHaveBeenCalledWith('ats_score_checked');
  });

  it('displays score, matched terms, and missing terms after check', async () => {
    getATSScore.mockResolvedValue({
      score: 82,
      matched_terms: ['react', 'node.js'],
      missing_terms: ['kubernetes', 'terraform'],
      method: 'semantic',
    });

    act(() => {
      root.render(<ATSScorePanel cvText="Resume with react and node.js" />);
    });

    const textarea = container.querySelector('textarea');
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      nativeInputValueSetter.call(textarea, 'Need react and kubernetes');
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await act(async () => {
      container.querySelector('button').click();
    });

    expect(container.textContent).toContain('82');
    expect(container.textContent).toContain('/100');
    expect(container.textContent).toContain('react');
    expect(container.textContent).toContain('node.js');
    expect(container.textContent).toContain('kubernetes');
    expect(container.textContent).toContain('terraform');
  });

  it('displays method indicator (semantic)', async () => {
    getATSScore.mockResolvedValue({
      score: 60,
      matched_terms: ['python'],
      missing_terms: [],
      method: 'semantic',
    });

    act(() => {
      root.render(<ATSScorePanel cvText="Python developer" />);
    });

    const textarea = container.querySelector('textarea');
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      nativeInputValueSetter.call(textarea, 'Python role');
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await act(async () => {
      container.querySelector('button').click();
    });

    expect(container.textContent).toContain('Semantic');
  });

  it('displays method indicator (heuristic)', async () => {
    getATSScore.mockResolvedValue({
      score: 45,
      matched_terms: ['java'],
      missing_terms: ['spring'],
      method: 'heuristic',
    });

    act(() => {
      root.render(<ATSScorePanel cvText="Java developer" />);
    });

    const textarea = container.querySelector('textarea');
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      nativeInputValueSetter.call(textarea, 'Java spring role');
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await act(async () => {
      container.querySelector('button').click();
    });

    expect(container.textContent).toContain('Heuristic');
  });

  it('uses onCheckScore prop when provided instead of default API', async () => {
    const mockOnCheckScore = jest.fn().mockResolvedValue({
      score: 90,
      matched_terms: ['aws'],
      missing_terms: [],
      method: 'semantic',
    });

    act(() => {
      root.render(<ATSScorePanel cvText="AWS engineer" onCheckScore={mockOnCheckScore} />);
    });

    const textarea = container.querySelector('textarea');
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      nativeInputValueSetter.call(textarea, 'AWS cloud role');
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await act(async () => {
      container.querySelector('button').click();
    });

    expect(mockOnCheckScore).toHaveBeenCalledWith('AWS engineer', 'AWS cloud role');
    expect(getATSScore).not.toHaveBeenCalled();
    expect(container.textContent).toContain('90');
  });

  it('shows error message when API call fails', async () => {
    getATSScore.mockRejectedValue(new Error('Network error'));

    act(() => {
      root.render(<ATSScorePanel cvText="Resume text" />);
    });

    const textarea = container.querySelector('textarea');
    act(() => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      ).set;
      nativeInputValueSetter.call(textarea, 'Some job description');
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await act(async () => {
      container.querySelector('button').click();
    });

    expect(container.textContent).toContain('Failed to check ATS score');
  });
});
