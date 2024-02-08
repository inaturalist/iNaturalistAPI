const fs = require( "fs" );

const {
  INAT_DB_HOST,
  INAT_DB_USER,
  INAT_DB_PASS,
  INAT_ES_HOST,
  INAT_REDIS_HOST,
  INAT_API_URL,
  INAT_RAILS_URL,
  INAT_VISION_URL,
  INAT_DB_SSL_KEY_PATH,
  INAT_DB_SSL_CRT_PATH,
  INAT_STATIC_IMAGE_URL,
  INAT_JWT_SECRET,
  INAT_JWT_APPLICATION_SECRET
} = process.env;
module.exports = {
  // Host running the iNaturalist Rails app
  apiURL: INAT_RAILS_URL ? `${INAT_RAILS_URL}` : "http://localhost:3000",
  // Base URL for the current version of *this* app
  currentVersionURL: INAT_API_URL ? `${INAT_API_URL}` : "http://localhost:4000/v1",
  // Whether the Rails app supports SSL requests. For local dev assume it does not
  apiHostSSL: false,
  writeHostSSL: false,
  elasticsearch: {
    host: INAT_ES_HOST ? `http://${INAT_ES_HOST}:9200` : "http://localhost:9200",
    geoPointField: "location"
  },
  database: {
    user: INAT_DB_USER || "inaturalist",
    host: INAT_DB_HOST || "127.0.0.1",
    port: 5432,
    geometry_field: "geom",
    srid: 4326,
    password: INAT_DB_PASS || "inaturalist",
    ssl: ( INAT_DB_SSL_KEY_PATH && INAT_DB_SSL_CRT_PATH ) ? {
      rejectUnauthorized: false,
      key: fs.readFileSync( INAT_DB_SSL_KEY_PATH ),
      cert: fs.readFileSync( INAT_DB_SSL_CRT_PATH )
    } : false
  },
  tileSize: 512,
  debug: true,
  logLevel: "info", // only "debug" does anything right now
  websiteURL: INAT_RAILS_URL ? `${INAT_RAILS_URL}` : "http://localhost:3000/",
  staticImagePrefix: INAT_STATIC_IMAGE_URL ? `${INAT_STATIC_IMAGE_URL}` : "http://localhost:3000/attachments/",
  userImagePrefix: "/attachments/users/icons/",
  jwtSecret: INAT_JWT_SECRET ? `${INAT_JWT_SECRET}` : "secret",
  jwtApplicationSecret: INAT_JWT_APPLICATION_SECRET ? `${INAT_JWT_APPLICATION_SECRET}` : "application_secret",
  imageProcesing: {
    // Path to a file listing the taxonomy used in the computer vision model
    taxaFilePath: "",
    // Path to a directory where uploads should be stored. /tmp/ is fine on most
    // *nix systems
    uploadsDir: "/tmp/",
    // Base URL for the web app returning computer vision results
    tensorappURL: INAT_VISION_URL ? `${INAT_VISION_URL}` : "http://localhost:6006"
  },
  redis: {
    host: INAT_REDIS_HOST || "127.0.0.1",
    port: 6379
  }
  // Simulate maintance by returning 503 for all requests
  // maintenanceUntil: "Sat, 23 Sep 2023 7:00:00 GMT"
};
