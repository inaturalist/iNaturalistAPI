module.exports = {
  environment: "development",
  elasticsearch: {
    host: "localhost:9200",
    geoPointField: "location",
    searchIndex: "development_observations"
  },
  database: {
    user: "username",
    host: "127.0.0.1",
    port: 5432,
    geometry_field: "geom",
    srid: 4326,
    dbname: "inaturalist_development",
    password: "password",
    ssl: false
  },
  tileSize: 512,
  debug: true
};
