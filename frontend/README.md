# Journey

## Setup

Install your packages. Yarn tends to run much faster and the `.lock` file is generated using yarn.

```bash
# Installs node dependencies
yarn
```

## Configuration

Copy the `.env.example` file into a separate file called `.env`. You should replace these keys with your own to avoid illegal database operations. You must keep both files otherwise Webpack is designed to throw an error when the `.env` file contents are inconsistent.

For a Firebase API key, visit the [Firebase documentation pages](https://firebase.google.com/docs/) with help getting started.

For a Google Maps API key, visit the [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/tutorial).

## Start

```bash
# Starts hot reloading server
yarn start
```

```bash
# Builds production-ready deployment
yarn run build
```

## License

MIT
