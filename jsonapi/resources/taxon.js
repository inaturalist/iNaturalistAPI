const jsonApi = require( "@jagql/framework" );

jsonApi.define( {
  namespace: "json:api",
  resource: "taxa",
  description: "Represents taxa.",
  handlers: new jsonApi.MemoryHandler( ),
  primaryKey: "autoincrement",
  attributes: {
    name: jsonApi.Joi.string( )
      .description( "Scientitic name of the taxon" )
      .example( "Pomatomus saltatrix" ),
    rank: jsonApi.Joi.string( )
      .description( "Taxonomic rank of the taxon" )
      .example( "species" ),
    rank_level: jsonApi.Joi.number( )
      .description( "Number representing rank of the taxon" )
      .example( 10 )
  },
  examples: [
    {
      id: "1",
      type: "taxa",
      name: "Animalia",
      rank: "kingdom",
      rank_level: 70
    },
    {
      id: "2",
      type: "taxa",
      name: "Chordata",
      rank: "phylum",
      rank_level: 60
    },
    {
      id: "3",
      type: "taxa",
      name: "Aves",
      rank: "class",
      rank_level: 50
    },
    {
      id: "4",
      type: "taxa",
      name: "Gruiformes",
      rank: "order",
      rank_level: 40
    },
    {
      id: "5",
      type: "taxa",
      name: "Aramidae",
      rank: "family",
      rank_level: 30
    },
    {
      id: "6",
      type: "taxa",
      name: "Aramus",
      rank: "genus",
      rank_level: 20
    },
    {
      id: "7",
      type: "taxa",
      name: "Aramus guarauna",
      rank: "species",
      rank_level: 10
    }
  ]
} );
