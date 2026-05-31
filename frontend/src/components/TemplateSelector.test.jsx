import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import TemplateSelector, { TEMPLATES } from './TemplateSelector';

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
});

describe('TemplateSelector', () => {
  it('defines all six templates with id, name, and description', () => {
    expect(TEMPLATES).toHaveLength(6);
    const ids = TEMPLATES.map((t) => t.id);
    expect(ids).toEqual(['modern', 'traditional', 'creative', 'minimalist', 'executive', 'tech']);
    TEMPLATES.forEach((t) => {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
    });
  });

  it('renders all six template cards with name and description', () => {
    act(() => {
      root.render(<TemplateSelector selected="modern" onSelect={() => {}} />);
    });
    TEMPLATES.forEach((t) => {
      expect(container.textContent).toContain(t.name);
      expect(container.textContent).toContain(t.description);
    });
  });

  it('shows visual distinction for the selected template', () => {
    act(() => {
      root.render(<TemplateSelector selected="creative" onSelect={() => {}} />);
    });
    const cards = container.querySelectorAll('[class*="cursor-pointer"]');
    expect(cards).toHaveLength(6);

    // The selected card (creative is index 2) should have the ring class
    const selectedCard = cards[2];
    expect(selectedCard.className).toContain('ring-2');
    expect(selectedCard.className).toContain('border-[#0066ff]');

    // Non-selected cards should not have the ring class
    const nonSelectedCard = cards[0];
    expect(nonSelectedCard.className).not.toContain('ring-2');
    expect(nonSelectedCard.className).toContain('border-gray-700');
  });

  it('calls onSelect with the template id when a card is clicked', () => {
    const onSelect = jest.fn();
    act(() => {
      root.render(<TemplateSelector selected="modern" onSelect={onSelect} />);
    });
    const cards = container.querySelectorAll('[class*="cursor-pointer"]');

    act(() => {
      cards[3].click(); // minimalist
    });
    expect(onSelect).toHaveBeenCalledWith('minimalist');
  });
});
