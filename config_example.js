const {
  INAT_DB_HOST,
  INAT_DB_USER,
  INAT_DB_PASS,
  INAT_ES_HOST,
  INAT_REDIS_HOST,
  INAT_WEB_HOST
} = process.env;
module.exports = {
  // Base URL for the current version of *this* app
  currentVersionURL: "http://localhost:4000/v1",
  // Host running the iNaturalist Rails app
  apiURL: INAT_WEB_HOST ? `http://${INAT_WEB_HOST}:3000` : "http://localhost:3000",
  jwtSecret: "secret",
  jwtApplicationSecret: "application_secret",
  tileSize: 512,
  debug: true,
  database: {
    user: INAT_DB_USER || "inaturalist",
    host: INAT_DB_HOST || "127.0.0.1",
    port: 5432,
    geometry_field: "geom",
    srid: 4326,
    password: INAT_DB_PASS || "inaturalist",
    ssl: false
  },
  staticImagePrefix: "http://localhost:3000/attachments/",
  websiteURL: "http://localhost:3000/",
  imageProcesing: {
    // Base URL for the web app returning computer vision results
    tensorappURL: "http://localhost:6006",
    // Path to a directory where uploads should be stored. /tmp/ is fine on most
    // *nix systems
    uploadsDir: "/tmp/",
    // Path to a file listing the taxonomy used in the computer vision model
    taxaFilePath: ""
  },
  redis: {
    host: INAT_REDIS_HOST || "127.0.0.1",
    port: 6379
  },
  elasticsearch: {
    host: INAT_ES_HOST ? `http://${INAT_ES_HOST}:9200` : "http://localhost:9200",
    geoPointField: "location"
  },
  // Whether the Rails app supports SSL requests. For local dev assume it does not
  apiHostSSL: false,
  writeHostSSL: false,
  logLevel: "info", // only "debug" does anything right now
  userImagePrefix: "/attachments/users/icons/"
};
