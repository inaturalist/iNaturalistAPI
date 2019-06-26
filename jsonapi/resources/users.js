const jsonApi = require( "@jagql/framework" );

jsonApi.define( {
  namespace: "json:api",
  resource: "users",
  description: "Represents users.",
  handlers: new jsonApi.MemoryHandler( ),
  primaryKey: "autoincrement",
  attributes: {
    login: jsonApi.Joi.string( ).alphanum( ).required( )
      .description( "The user's iNaturalist login" )
      .example( "jsmith" ),
    name: jsonApi.Joi.string( )
      .description( "The user's name" )
      .example( "John Smith" )
  },
  examples: [
    {
      id: "1",
      type: "users",
      login: "lellis",
      name: "Levi Ellis"
    },
    {
      id: "2",
      type: "users",
      login: "rsutton",
      name: "Rita Sutton"
    },
    {
      id: "3",
      type: "users",
      login: "mjimenez",
      name: "Marvin Jimenez"
    },
    {
      id: "4",
      type: "users",
      login: "jbates",
      name: "Jamie Bates"
    }
  ]
} );
