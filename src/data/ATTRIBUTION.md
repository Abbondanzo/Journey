# Data sources

- `airports.json`: derived from [OurAirports](https://ourairports.com/data/) (public domain). Airports with an IATA code and scheduled service, plus a few closed airports (TXL, SXF) that still appear in old calendars.
- `countries.json`: derived from OurAirports `countries.csv` (public domain).
- `cities.json`: cities with a population of 40,000 or more (plus capitals), derived from the [all-the-cities](https://github.com/zeke/all-the-cities) package (MIT), which is built from [GeoNames](https://www.geonames.org/) data licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Rows are `[name, altName, country, lat, lon, population]` for cities and `[iata, name, municipality, country, lat, lon, rank]` for airports (rank 3 large, 2 medium, 1 small, 0 closed).
