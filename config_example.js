let environment = "development";
if ( global && global.config && global.config.environment ) {
  environment = global.config.environment; // eslint-disable-line prefer-destructuring
}
if ( process && process.env && process.env.NODE_ENV ) {
  environment = process.env.NODE_ENV;
}
const {
  INAT_DB_HOST,
  INAT_DB_USER,
  INAT_DB_PASS,
  INAT_ES_HOST,
  INAT_REDIS_HOST,
  INAT_WEB_HOST
} = process.env;
module.exports = {
  environment,
  // Host running the iNaturalist Rails app
  apiURL: INAT_WEB_HOST ? `http://${INAT_WEB_HOST}:3000` : "http://localhost:3000",
  // Base URL for the current version of *this* app
  currentVersionURL: "http://localhost:4000/v1",
  // Whether the Rails app supports SSL requests. For local dev assume it does not
  apiHostSSL: false,
  writeHostSSL: false,
  elasticsearch: {
    host: INAT_ES_HOST ? `${INAT_ES_HOST}:9200` : "localhost:9200",
    geoPointField: "location",
    searchIndex: `${environment}_observations`,
    placeIndex: `${environment}_places`
  },
  database: {
    user: INAT_DB_USER || "username",
    host: INAT_DB_HOST || "127.0.0.1",
    port: 5432,
    geometry_field: "geom",
    srid: 4326,
    // Use a different db name in a test environment so our test data is
    // isolated from the web app's test database
    dbname: environment === "test"
      ? "inaturalistapi_test"
      : `inaturalist_${environment}`,
    password: INAT_DB_PASS || "password",
    ssl: false
  },
  tileSize: 512,
  debug: true,
  staticImagePrefix: "http://localhost:3000/attachments/",
  userImagePrefix: "/attachments/users/icons/",
  jwtSecret: "secret",
  jwtApplicationSecret: "application_secret",
  imageProcesing: {
    // Path to a file listing the taxonomy used in the computer vision model
    taxaFilePath: "",
    // Path to a directory where uploads should be stored. /tmp/ is fine on most
    // *nix systems
    uploadsDir: "/tmp/",
    // Base URL for the web app returning computer vision results
    tensorappURL: ""
  },
  redis: {
    host: INAT_REDIS_HOST || "127.0.0.1",
    port: 6379
  }
};
