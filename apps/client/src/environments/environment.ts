// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import type { Environment } from "./environment-type";

export const environment: Environment = {
  production: false,
  api: "http://localhost:3333/",
  supabase: {
    url: "https://bhzetyxjimpabioxoodz.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoemV0eXhqaW1wYWJpb3hvb2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzM3OTQ4NTcsImV4cCI6MTk4OTM3MDg1N30.qXNM5FGjVb9scqNxBL3EHYl1HL-RI2NZNGXceZGTMLs"
  },
  socketIoConfig: {
    url: "http://localhost:3333",
    options: {}
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
