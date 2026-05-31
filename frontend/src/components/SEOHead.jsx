import { useEffect } from 'react';

const BASE_URL = 'https://cvcraft.app';
const DEFAULT_IMAGE = '/og-image.png';
const DEFAULT_KEYWORDS = 'resume builder, CV maker, AI resume, professional resume, ATS optimization';

/**
 * SEOHead component that programmatically sets document title and meta tags.
 * Manages description, keywords, Open Graph, and Twitter Card meta tags.
 *
 * @param {object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page meta description
 * @param {string} props.path - Page path (e.g. "/" or "/create")
 */
export default function SEOHead({ title, description, path }) {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Helper to create or update a meta tag
    const setMeta = (attribute, key, content) => {
      let element = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard meta tags
    setMeta('name', 'description', description);
    setMeta('name', 'keywords', DEFAULT_KEYWORDS);

    // Open Graph meta tags
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', `${BASE_URL}${DEFAULT_IMAGE}`);
    setMeta('property', 'og:url', `${BASE_URL}${path}`);

    // Twitter Card meta tags
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', `${BASE_URL}${DEFAULT_IMAGE}`);
  }, [title, description, path]);

  return null;
}
