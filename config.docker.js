const fs = require( "fs" );

const {
  NODE_ENV,
  NODE_DEBUG,
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
  INAT_JWT_APPLICATION_SECRET,
  INAT_AWS_OPENDATA_BUCKET,
  INAT_AWS_OPENDATA_DOMAIN,
  INAT_AWS_OPENDATA_REGION,
  INAT_AWS_OPENDATA_ACL,
  INAT_TAXONOMY_PATH,
  INAT_SEEK_EXCEPTION_LIST_ID,
  INAT_NLS_URL
} = process.env;

module.exports = {
  environment: NODE_ENV || "development",
  currentVersionURL: INAT_API_URL || "http://localhost:4000/v1",
  apiURL: INAT_RAILS_URL || "http://localhost:3000",
  jwtSecret: INAT_JWT_SECRET || "secret",
  jwtApplicationSecret: INAT_JWT_APPLICATION_SECRET || "application_secret",
  tileSize: 512,
  debug: NODE_DEBUG || false,
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
  staticImagePrefix: INAT_STATIC_IMAGE_URL || "http://localhost:3000/attachments/",
  websiteURL: INAT_RAILS_URL ? `${INAT_RAILS_URL}/` : "http://localhost:3000/",
  imageProcesing: {
    tensorappURL: INAT_VISION_URL || "http://localhost:6006",
    uploadsDir: "/home/inaturalist/api/public/uploads",
    taxonomyPath: INAT_TAXONOMY_PATH || "",
    geomodel: true,
    combinedThreshold: 0.001,
    frequencyBackend: "redis",
    inatnlsURL: INAT_NLS_URL || "",
    delegateCommonAncestor: true
  },
  redis: {
    host: INAT_REDIS_HOST || "127.0.0.1",
    port: 6379
  },
  aws: {
    openDataBucket: INAT_AWS_OPENDATA_BUCKET || "INAT_AWS_OPENDATA_BUCKET",
    openDataDomain: INAT_AWS_OPENDATA_DOMAIN || "INAT_AWS_OPENDATA_DOMAIN",
    openDataRegion: INAT_AWS_OPENDATA_REGION || "INAT_AWS_OPENDATA_REGION",
    openDataACL: INAT_AWS_OPENDATA_ACL || ""
  },
  elasticsearch: {
    host: INAT_ES_HOST ? `http://${INAT_ES_HOST}:9200` : "http://localhost:9200"
  },
  cacheDir: "/home/inaturalist/api/cache",
  seekExceptionListID: INAT_SEEK_EXCEPTION_LIST_ID || 0
};
