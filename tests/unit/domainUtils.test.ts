import { describe, expect, it } from 'bun:test';
import { areDomainsRelated, extractBaseDomain } from '@/libs/utils/domainUtils';

describe('extractBaseDomain', () => {
  it('extracts base from simple .com domain', () => {
    expect(extractBaseDomain('nike.com')).toBe('nike');
    expect(extractBaseDomain('adidas.com')).toBe('adidas');
  });

  it('extracts base from country-code TLD', () => {
    expect(extractBaseDomain('nike.it')).toBe('nike');
    expect(extractBaseDomain('nike.de')).toBe('nike');
    expect(extractBaseDomain('nike.fr')).toBe('nike');
  });

  it('extracts base from subdomain with simple TLD', () => {
    expect(extractBaseDomain('shop.nike.com')).toBe('nike');
    expect(extractBaseDomain('it.on.com')).toBe('on');
    expect(extractBaseDomain('docs.google.com')).toBe('google');
  });

  it('extracts base from compound TLD like .co.uk', () => {
    expect(extractBaseDomain('shop.adidas.co.uk')).toBe('adidas');
    expect(extractBaseDomain('adidas.co.uk')).toBe('adidas');
    expect(extractBaseDomain('www.bbc.co.uk')).toBe('bbc');
  });

  it('extracts base from compound TLD like .com.au', () => {
    expect(extractBaseDomain('example.com.au')).toBe('example');
    expect(extractBaseDomain('shop.brand.com.au')).toBe('brand');
  });

  it('extracts base from compound TLD like .co.jp', () => {
    expect(extractBaseDomain('shop.nike.co.jp')).toBe('nike');
  });
});

describe('areDomainsRelated', () => {
  it('same domain returns true', () => {
    expect(areDomainsRelated('nike.com', 'nike.com')).toBe(true);
    expect(areDomainsRelated('adidas.com', 'adidas.com')).toBe(true);
  });

  it('different TLD extensions of same brand return true', () => {
    expect(areDomainsRelated('nike.com', 'nike.it')).toBe(true);
    expect(areDomainsRelated('nike.de', 'nike.fr')).toBe(true);
    expect(areDomainsRelated('nike.co.uk', 'nike.com')).toBe(true);
  });

  it('subdomain and base domain with different extensions return true', () => {
    expect(areDomainsRelated('shop.adidas.co.uk', 'adidas.com')).toBe(true);
  });

  it('different subdomains with same TLD return true', () => {
    expect(areDomainsRelated('on.com', 'it.on.com')).toBe(true);
    expect(areDomainsRelated('shop.nike.com', 'nike.com')).toBe(true);
    expect(areDomainsRelated('docs.google.com', 'google.com')).toBe(true);
  });

  it('different brands return false', () => {
    expect(areDomainsRelated('nike.com', 'adidas.com')).toBe(false);
    expect(areDomainsRelated('apple.com', 'google.com')).toBe(false);
  });

  it('brands with similar-looking names are not considered related', () => {
    expect(areDomainsRelated('nikeplus.com', 'nike.com')).toBe(false);
    expect(areDomainsRelated('adidasoriginals.com', 'adidas.com')).toBe(false);
  });
});
