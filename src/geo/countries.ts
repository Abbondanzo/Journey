import countriesRaw from '../data/countries.json';

const byCode = countriesRaw as unknown as Record<string, [string, string]>;

export function countryName(code: string): string {
  return byCode[code]?.[0] ?? code;
}
export function continentOf(code: string): string | undefined {
  return byCode[code]?.[1];
}
export const allCountries = byCode;
