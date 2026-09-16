/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Mock IntersectionObserver
class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = IntersectionObserver;

describe('applyTheme functionality', () => {
  beforeEach(() => {
    // Basic DOM setup
    document.documentElement.innerHTML = `
      <head></head>
      <body>
        <button data-theme-toggle>
          <span class="theme-icon"></span>
        </button>
      </body>
    `;
    document.documentElement.removeAttribute('data-theme');

    // Clear localStorage and modules
    localStorage.clear();
    jest.resetModules();
  });

  it('should set light theme correctly', () => {
    localStorage.setItem('theme', 'light');

    const appJs = fs.readFileSync(path.resolve(__dirname, 'app.js'), 'utf8');
    eval(appJs);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    const themeIcon = document.querySelector('.theme-icon');
    expect(themeIcon.textContent).toBe('☾');

    const themeToggle = document.querySelector('[data-theme-toggle]');
    expect(themeToggle.getAttribute('aria-label')).toBe('Switch to dark theme');
  });

  it('should set dark theme correctly', () => {
    localStorage.setItem('theme', 'dark');

    const appJs = fs.readFileSync(path.resolve(__dirname, 'app.js'), 'utf8');
    eval(appJs);

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);

    const themeIcon = document.querySelector('.theme-icon');
    expect(themeIcon.textContent).toBe('☼');

    const themeToggle = document.querySelector('[data-theme-toggle]');
    expect(themeToggle.getAttribute('aria-label')).toBe('Switch to light theme');
  });

  it('should fallback to system theme (light) if no stored preference', () => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const appJs = fs.readFileSync(path.resolve(__dirname, 'app.js'), 'utf8');
    eval(appJs);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should fallback to system theme (dark) if no stored preference', () => {
    window.matchMedia = jest.fn().mockImplementation(query => {
      if (query === '(prefers-color-scheme: dark)') {
        return {
          matches: true,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      }
      return { matches: false, addEventListener: jest.fn() };
    });

    const appJs = fs.readFileSync(path.resolve(__dirname, 'app.js'), 'utf8');
    eval(appJs);

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('should toggle theme when toggle button is clicked', () => {
    localStorage.setItem('theme', 'light');

    const appJs = fs.readFileSync(path.resolve(__dirname, 'app.js'), 'utf8');
    eval(appJs);

    const themeToggle = document.querySelector('[data-theme-toggle]');
    themeToggle.click();

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('dark');

    themeToggle.click();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('should handle missing toggle button gracefully', () => {
    document.documentElement.innerHTML = `
      <head></head>
      <body>
        <!-- No theme toggle button -->
      </body>
    `;
    localStorage.setItem('theme', 'light');

    const appJs = fs.readFileSync(path.resolve(__dirname, 'app.js'), 'utf8');
    expect(() => eval(appJs)).not.toThrow();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
