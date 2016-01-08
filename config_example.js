module.exports = {
  environment: "development",
  elasticsearch: {
    host: "localhost:9200",
    geoPointField: "location"
  },
  database: {
    user: "username",
    host: "127.0.0.1",
    port: 5432,
    geometry_field: "geom",
    srid: 4326,
    dbname: "inaturalist_production",
    password: "password",
    ssl: false
  },
  tileSize: 512,
  debug: true
};
