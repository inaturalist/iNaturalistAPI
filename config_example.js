module.exports = {
  elasticsearch: {
    host: "localhost:9200",
    searchIndex: "observations",
    placeIndex: "places",
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
  environment: "production",
  tileSize: 512,
  debug: true
};
