import { describe, expect, it } from 'bun:test';
import { parseTargetLocation } from '@/libs/ai/userLocation';

describe('parseTargetLocation', () => {
  it('splits city and country from "London, United Kingdom"', () => {
    expect(parseTargetLocation('London, United Kingdom')).toEqual({
      city: 'London',
      country: 'GB',
    });
  });

  it('returns only city when no country is present ("California")', () => {
    expect(parseTargetLocation('California')).toEqual({ city: 'California' });
  });

  it('rejoins remaining parts into city ("San Francisco, California, US")', () => {
    expect(parseTargetLocation('San Francisco, California, US')).toEqual({
      city: 'San Francisco, California',
      country: 'US',
    });
  });

  it('returns only country when the whole input is a country name ("Germany")', () => {
    expect(parseTargetLocation('Germany')).toEqual({ country: 'DE' });
  });

  it('returns undefined for null', () => {
    expect(parseTargetLocation(null)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(parseTargetLocation('')).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(parseTargetLocation(undefined)).toBeUndefined();
  });

  it('returns undefined for blank comma-only input', () => {
    expect(parseTargetLocation('  ,  ')).toBeUndefined();
  });

  it('resolves common aliases case-insensitively (uk, usa, uae)', () => {
    expect(parseTargetLocation('uk')).toEqual({ country: 'GB' });
    expect(parseTargetLocation('USA')).toEqual({ country: 'US' });
    expect(parseTargetLocation('uae')).toEqual({ country: 'AE' });
  });

  it('uses the last matching country when several parts match', () => {
    expect(parseTargetLocation('Germany, France')).toEqual({ country: 'FR' });
  });

  it('drops an unrecognised bare 2-letter token rather than guessing a city ("GB")', () => {
    expect(parseTargetLocation('GB')).toBeUndefined();
  });

  it('does not resolve US state abbreviations as countries ("Los Angeles, CA")', () => {
    expect(parseTargetLocation('Los Angeles, CA')).toEqual({ city: 'Los Angeles' });
  });

  it('does not resolve US state abbreviations as countries ("New York, NY")', () => {
    expect(parseTargetLocation('New York, NY')).toEqual({ city: 'New York' });
  });

  it('does not resolve US state abbreviations as countries ("Wilmington, DE")', () => {
    expect(parseTargetLocation('Wilmington, DE')).toEqual({ city: 'Wilmington' });
  });
});
