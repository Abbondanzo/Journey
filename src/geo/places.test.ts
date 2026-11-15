import { airport, airportCodesIn, cityForAirport, placeForAirport, resolveLocation } from './places';
import { haversineKm } from './geo';

describe('airports', () => {
  it('looks up IATA codes, including closed airports', () => {
    expect(airport('LIS')?.country).toBe('PT');
    expect(airport('txl')?.municipality).toBe('Berlin');
    expect(airport('ZZZ')).toBeUndefined();
  });

  it.each([
    ['EWR', 'New York'],
    ['JFK', 'New York'],
    ['LGA', 'New York'],
    ['KIX', 'Osaka'],
    ['NRT', 'Tokyo'],
    ['HND', 'Tokyo'],
    ['LIS', 'Lisbon'],
    ['TXL', 'Berlin'],
    ['BER', 'Berlin'],
    ['CDG', 'Paris'],
    ['LHR', 'London'],
    ['MEX', 'Mexico City'],
    ['SFO', 'San Francisco'],
  ])('%s is in %s', (code, city) => {
    expect(cityForAirport(airport(code)!).name).toBe(city);
  });

  it('only finds real codes as standalone upper-case tokens', () => {
    expect(airportCodesIn('Flight JFK → LIS')).toEqual(['JFK', 'LIS']);
    expect(airportCodesIn('jfk to lis, JFKX, xLIS')).toEqual([]);
  });

  it('measures JFK–LIS at about 5,400 km', () => {
    const km = haversineKm(placeForAirport('JFK')!, placeForAirport('LIS')!);
    expect(km).toBeGreaterThan(5300);
    expect(km).toBeLessThan(5500);
  });
});

describe('resolveLocation', () => {
  it.each([
    ['Praça Luís de Camões 2, 1200-243 Lisboa, Portugal', 'Lisbon', 'PT'],
    ['Rua das Flores 103, Lisbon', 'Lisbon', 'PT'],
    ['Kyoto, Japan', 'Kyoto', 'JP'],
    ['3-7-1-2 Nishi Shinjuku, Shinjuku City, Tokyo 163-1055, Japan', 'Tokyo', 'JP'],
    ['20 W 29th St, New York, NY 10001, USA', 'New York', 'US'],
    ['Paris', 'Paris', 'FR'],
    ['Calle de Alcalá 66, 28009 Madrid, Spain', 'Madrid', 'ES'],
    ['Hackescher Markt 1, 10178 Berlin, Deutschland', 'Berlin', 'DE'],
    ['Mexico City, CDMX, Mexico', 'Mexico City', 'MX'],
  ])('%s → %s', (text, city, country) => {
    const p = resolveLocation(text);
    expect(p?.city).toBe(city);
    expect(p?.country).toBe(country);
  });

  it('does not guess the wrong country', () => {
    // Paris, Texas is too small for the city table; it must not become Paris, France.
    expect(resolveLocation('Paris, TX 75460, USA')?.country).not.toBe('FR');
  });

  it('returns undefined for things that are not places', () => {
    expect(resolveLocation('Zoom meeting')).toBeUndefined();
    expect(resolveLocation('https://meet.google.com/abc-defg-hij')).toBeUndefined();
    expect(resolveLocation(undefined)).toBeUndefined();
  });
});

import { searchCities } from './places';
describe('searchCities', () => {
  it('puts the exact name first', () => {
    expect(searchCities('Porto')[0].city).toBe('Porto');
    expect(searchCities('Lisb')[0].city).toBe('Lisbon');
    expect(searchCities('lisboa')[0].city).toBe('Lisbon');
    expect(searchCities('x')).toEqual([]);
  });
});
