/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('three-hero.js module', () => {
  let threeHeroCode;

  beforeAll(() => {
    threeHeroCode = fs.readFileSync(path.resolve(__dirname, '../three-hero.js'), 'utf8');
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.resetModules();
  });

  it('should safely exit if heroThreeContainer does not exist', () => {
    expect(() => eval(threeHeroCode)).not.toThrow();
  });

  it('should safely exit if WebGL or THREE is not available', () => {
    document.body.innerHTML = '<div id="heroThreeContainer"></div>';
    delete window.THREE;
    expect(() => eval(threeHeroCode)).not.toThrow();
  });

  it('should not throw even with reduced motion match', () => {
    document.body.innerHTML = '<div id="heroThreeContainer"></div>';
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    expect(() => eval(threeHeroCode)).not.toThrow();
  });
});
