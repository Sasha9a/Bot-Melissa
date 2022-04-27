// This file can be replaced during build by using the `fileReplacements` array.
// When building for production, this file is replaced with `environment.prod.ts`.

export const environment = {
  production: false,
  url: window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + '/api'
};
