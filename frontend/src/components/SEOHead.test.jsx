import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import SEOHead from './SEOHead';

let container = null;
let root = null;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  container = null;
  root = null;
  // Clean up meta tags added during tests
  document.querySelectorAll('meta[name="description"], meta[name="keywords"], meta[property^="og:"], meta[name^="twitter:"]').forEach(el => el.remove());
});

describe('SEOHead', () => {
  it('sets document title', () => {
    act(() => {
      root.render(<SEOHead title="CVCraft - Home" description="Build your resume" path="/" />);
    });
    expect(document.title).toBe('CVCraft - Home');
  });

  it('sets meta description tag', () => {
    act(() => {
      root.render(<SEOHead title="Test" description="AI-powered resume builder" path="/" />);
    });
    const meta = document.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta.getAttribute('content')).toBe('AI-powered resume builder');
  });

  it('sets meta keywords tag', () => {
    act(() => {
      root.render(<SEOHead title="Test" description="desc" path="/" />);
    });
    const meta = document.querySelector('meta[name="keywords"]');
    expect(meta).not.toBeNull();
    expect(meta.getAttribute('content')).toContain('resume builder');
  });

  it('sets Open Graph meta tags', () => {
    act(() => {
      root.render(<SEOHead title="CVCraft" description="Build resumes" path="/create" />);
    });
    expect(document.querySelector('meta[property="og:title"]').getAttribute('content')).toBe('CVCraft');
    expect(document.querySelector('meta[property="og:description"]').getAttribute('content')).toBe('Build resumes');
    expect(document.querySelector('meta[property="og:url"]').getAttribute('content')).toBe('https://cvcraft.app/create');
    expect(document.querySelector('meta[property="og:image"]').getAttribute('content')).toBe('https://cvcraft.app/og-image.png');
  });

  it('sets Twitter Card meta tags', () => {
    act(() => {
      root.render(<SEOHead title="CVCraft" description="Build resumes" path="/" />);
    });
    expect(document.querySelector('meta[name="twitter:card"]').getAttribute('content')).toBe('summary_large_image');
    expect(document.querySelector('meta[name="twitter:title"]').getAttribute('content')).toBe('CVCraft');
    expect(document.querySelector('meta[name="twitter:description"]').getAttribute('content')).toBe('Build resumes');
    expect(document.querySelector('meta[name="twitter:image"]').getAttribute('content')).toBe('https://cvcraft.app/og-image.png');
  });

  it('updates meta tags when props change', () => {
    act(() => {
      root.render(<SEOHead title="Page 1" description="First page" path="/" />);
    });
    expect(document.title).toBe('Page 1');

    act(() => {
      root.render(<SEOHead title="Page 2" description="Second page" path="/create" />);
    });
    expect(document.title).toBe('Page 2');
    expect(document.querySelector('meta[name="description"]').getAttribute('content')).toBe('Second page');
    expect(document.querySelector('meta[property="og:url"]').getAttribute('content')).toBe('https://cvcraft.app/create');
  });

  it('renders nothing (returns null)', () => {
    act(() => {
      root.render(<SEOHead title="Test" description="desc" path="/" />);
    });
    expect(container.innerHTML).toBe('');
  });
});
