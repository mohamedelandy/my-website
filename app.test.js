describe('setMenu functionality', () => {
  let menuBtn;
  let mobileMenu;

  beforeEach(() => {
    // Set up our document body
    document.body.innerHTML = `
      <button id="menuToggle" aria-expanded="false"></button>
      <div id="mobileMenu" hidden>
        <a href="#">Link 1</a>
      </div>
    `;

    // We need to mock matchMedia for app.js
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      })),
    });

    // Reset modules to ensure app.js runs fresh and re-evaluates the IIFE
    jest.resetModules();

    menuBtn = document.getElementById('menuToggle');
    mobileMenu = document.getElementById('mobileMenu');

    // require app.js so that it binds events to the elements in JSDOM
    require('./app.js');
  });

  it('opens the menu when menuToggle is clicked', () => {
    menuBtn.click();

    expect(menuBtn.getAttribute('aria-expanded')).toBe('true');
    expect(menuBtn.getAttribute('aria-label')).toBe('Close navigation menu');
    expect(document.body.classList.contains('menu-open')).toBe(true);
    expect(mobileMenu.hidden).toBe(false);
  });

  it('closes the menu when menuToggle is clicked again', () => {
    menuBtn.click(); // Open
    menuBtn.click(); // Close

    expect(menuBtn.getAttribute('aria-expanded')).toBe('false');
    expect(menuBtn.getAttribute('aria-label')).toBe('Open navigation menu');
    expect(document.body.classList.contains('menu-open')).toBe(false);
    expect(mobileMenu.hidden).toBe(true);
  });

  it('focuses on the first link when opened', () => {
    const firstLink = mobileMenu.querySelector('a');
    firstLink.focus = jest.fn();

    menuBtn.click();

    expect(firstLink.focus).toHaveBeenCalled();
  });

  it('focuses on the menuBtn when closed', () => {
    menuBtn.focus = jest.fn();

    menuBtn.click(); // Open
    menuBtn.click(); // Close

    expect(menuBtn.focus).toHaveBeenCalled();
  });

  it('closes the menu when a link inside mobileMenu is clicked', () => {
    menuBtn.click(); // Open

    const firstLink = mobileMenu.querySelector('a');
    firstLink.click();

    expect(menuBtn.getAttribute('aria-expanded')).toBe('false');
    expect(mobileMenu.hidden).toBe(true);
  });

  it('closes the menu when Escape key is pressed', () => {
    menuBtn.click(); // Open

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(menuBtn.getAttribute('aria-expanded')).toBe('false');
    expect(mobileMenu.hidden).toBe(true);
  });

  it('does nothing if elements are missing', () => {
    document.body.innerHTML = '';
    jest.resetModules();
    expect(() => require('./app.js')).not.toThrow();
  });
});
