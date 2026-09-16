/**
 * @jest-environment jsdom
 */

window.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
let reducedMotionMatch = false;
window.matchMedia = jest.fn().mockImplementation(query => {
  return {
    matches: query.includes('reduce') ? reducedMotionMatch : false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }
});

let runCounters;
let resetCounted;

describe('runCounters', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    document.body.innerHTML = `
      <div data-count="100">0</div>
      <div data-count="50">0+</div>
    `;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should animate counters to their target values', () => {
    reducedMotionMatch = false;
    const app = require('./app.js');
    runCounters = app.runCounters;
    resetCounted = app.resetCounted;
    resetCounted();

    runCounters();

    // Check initial intermediate value
    jest.advanceTimersByTime(45);
    const elements = document.querySelectorAll('[data-count]');
    expect(elements[0].textContent).toBe('5'); // 100/24 = ceil 5
    expect(elements[1].textContent).toBe('3+'); // 50/24 = ceil 3

    jest.advanceTimersByTime(1000);

    expect(elements[0].textContent).toBe('100');
    expect(elements[1].textContent).toBe('50+');
  });

  it('should skip animation and set value instantly if reduced motion is preferred', () => {
    reducedMotionMatch = true;
    const app = require('./app.js');
    runCounters = app.runCounters;
    resetCounted = app.resetCounted;
    resetCounted();

    runCounters();

    const elements = document.querySelectorAll('[data-count]');
    expect(elements[0].textContent).toBe('100');
    expect(elements[1].textContent).toBe('50+');
  });

  it('should run only once', () => {
    reducedMotionMatch = false;
    const app = require('./app.js');
    runCounters = app.runCounters;
    resetCounted = app.resetCounted;
    resetCounted();

    runCounters();
    jest.advanceTimersByTime(100);
    const elements = document.querySelectorAll('[data-count]');
    const val1 = elements[0].textContent;

    runCounters(); // Second call should be ignored
    jest.advanceTimersByTime(100);

    expect(elements[0].textContent).not.toBe(val1);
  });
});
