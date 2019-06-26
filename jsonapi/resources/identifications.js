const jsonApi = require( "@jagql/framework" );

jsonApi.define( {
  namespace: "json:api",
  resource: "identifications",
  description: "Represents identifications.",
  handlers: new jsonApi.MemoryHandler( ),
  primaryKey: "autoincrement",
  attributes: {
    uuid: jsonApi.Joi.string( )
      .description( "The observation UUID" )
      .example( "e11fa858-6576-4bc9-aa51-06c75cc233b6" )
      .required( ),
    body: jsonApi.Joi.string( )
      .description( "The text included with the identification" )
      .example( "I finally saw one!" ),
    observation: jsonApi.Joi.one( "observations" )
      .description( "The identified observation" ),
    taxon: jsonApi.Joi.one( "taxa" )
      .description( "The identification taxon" ),
    user: jsonApi.Joi.one( "users" )
      .description( "The identifying user" ),
    created_at: jsonApi.Joi.string( )
      .description( "The time the identification was created" )
      .example( "2018-03-20T14:34:20-07:00" )
      .required( )
  },
  examples: [
    {
      id: "1",
      type: "identifications",
      uuid: "011fa858-6576-4bc9-aa51-06c75cc233b6",
      body: "here's my ID",
      observation: {
        type: "observations",
        id: "1"
      },
      taxon: {
        type: "taxa",
        id: "1"
      },
      user: {
        type: "users",
        id: "1"
      },
      created_at: "2018-03-20T14:34:20-07:00"
    },
    {
      id: "2",
      type: "observations",
      uuid: "021fa858-6576-4bc9-aa51-06c75cc233b6",
      body: "here's my ID",
      observation: {
        type: "observations",
        id: "2"
      },
      taxon: {
        type: "taxa",
        id: "1"
      },
      user: {
        type: "users",
        id: "1"
      },
      created_at: "2018-03-20T14:34:20-07:00"
    },
    {
      id: "3",
      type: "observations",
      uuid: "121fa858-6576-4bc9-aa51-06c75cc233b6",
      body: "here's my ID",
      observation: {
        type: "observations",
        id: "2"
      },
      taxon: {
        type: "taxa",
        id: "7"
      },
      user: {
        type: "users",
        id: "2"
      },
      created_at: "2018-03-20T14:34:20-07:00"
    },
    {
      id: "4",
      type: "observations",
      uuid: "221fa858-6576-4bc9-aa51-06c75cc233b6",
      description: "description",
      quality_grade: "casual",
      license_code: "cc-by",
      observation: {
        type: "observations",
        id: "4"
      },
      taxon: {
        type: "taxa",
        id: "7"
      },
      user: {
        type: "users",
        id: "2"
      },
      created_at: "2018-03-20T14:34:20-07:00"
    }
  ]
} );
