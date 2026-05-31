import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import AIToggle from './AIToggle';

// Mock the analytics module
jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

const { trackEvent } = require('@/lib/analytics');

let container = null;
let root = null;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  trackEvent.mockClear();
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  container = null;
  root = null;
});

describe('AIToggle', () => {
  it('renders a switch and label', () => {
    act(() => {
      root.render(<AIToggle enabled={true} onToggle={() => {}} />);
    });
    const label = container.querySelector('label');
    expect(label).not.toBeNull();
    expect(label.textContent).toBe('AI Refinement');

    const switchEl = container.querySelector('button[role="switch"]');
    expect(switchEl).not.toBeNull();
  });

  it('reflects enabled state as checked', () => {
    act(() => {
      root.render(<AIToggle enabled={true} onToggle={() => {}} />);
    });
    const switchEl = container.querySelector('button[role="switch"]');
    expect(switchEl.getAttribute('data-state')).toBe('checked');
  });

  it('reflects disabled state as unchecked', () => {
    act(() => {
      root.render(<AIToggle enabled={false} onToggle={() => {}} />);
    });
    const switchEl = container.querySelector('button[role="switch"]');
    expect(switchEl.getAttribute('data-state')).toBe('unchecked');
  });

  it('calls onToggle with new state when clicked', () => {
    const onToggle = jest.fn();
    act(() => {
      root.render(<AIToggle enabled={false} onToggle={onToggle} />);
    });
    const switchEl = container.querySelector('button[role="switch"]');
    act(() => {
      switchEl.click();
    });
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('fires GA4 ai_toggle_changed event with enabled state on toggle on', () => {
    const onToggle = jest.fn();
    act(() => {
      root.render(<AIToggle enabled={false} onToggle={onToggle} />);
    });
    const switchEl = container.querySelector('button[role="switch"]');
    act(() => {
      switchEl.click();
    });
    expect(trackEvent).toHaveBeenCalledWith('ai_toggle_changed', { state: 'enabled' });
  });

  it('fires GA4 ai_toggle_changed event with disabled state on toggle off', () => {
    const onToggle = jest.fn();
    act(() => {
      root.render(<AIToggle enabled={true} onToggle={onToggle} />);
    });
    const switchEl = container.querySelector('button[role="switch"]');
    act(() => {
      switchEl.click();
    });
    expect(trackEvent).toHaveBeenCalledWith('ai_toggle_changed', { state: 'disabled' });
  });
});
