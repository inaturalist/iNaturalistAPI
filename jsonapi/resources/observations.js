const jsonApi = require( "@jagql/framework" );

jsonApi.define( {
  namespace: "json:api",
  resource: "observations",
  description: "Represents observations.",
  handlers: new jsonApi.MemoryHandler( ),
  primaryKey: "autoincrement",
  attributes: {
    uuid: jsonApi.Joi.string( )
      .description( "The observation UUID" )
      .example( "e11fa858-6576-4bc9-aa51-06c75cc233b6" )
      .required( ),
    description: jsonApi.Joi.string( )
      .description( "The observation description" )
      .example( "I finally saw one!" ),
    quality_grade: jsonApi.Joi.string( )
      .description( "The observation quality grade" )
      .example( "research" )
      .required( ),
    license_code: jsonApi.Joi.string( )
      .description( "The observation license" )
      .example( "cc-by" )
      .required( ),
    taxon: jsonApi.Joi.one( "taxa" )
      .description( "The observed taxon" ),
    user: jsonApi.Joi.one( "users" )
      .description( "The observing user" ),
    identifications: jsonApi.Joi.many( "identifications" )
      .description( "Identifications on this observation" ),
    created_at: jsonApi.Joi.string( )
      .description( "The time the observation record was created" )
      .example( "2018-03-20T14:34:20-07:00" )
      .required( ),
    updated_at: jsonApi.Joi.string( )
      .description( "The time the observation was last updated" )
      .example( "2018-03-20T14:34:20-07:00" )
      .required( )
  },
  examples: [
    {
      id: "1",
      type: "observations",
      uuid: "e11fa858-6576-4bc9-aa51-06c75cc233b6",
      description: "description",
      quality_grade: "research",
      license_code: "cc-by",
      identifications: [{
        type: "identifications",
        id: "1"
      }],
      taxon: {
        type: "taxa",
        id: "1"
      },
      user: {
        type: "users",
        id: "1"
      },
      created_at: "2018-03-20T14:34:20-07:00",
      updated_at: "2018-03-20T14:34:20-07:00"
    },
    {
      id: "2",
      type: "observations",
      uuid: "011fa858-6576-4bc9-aa51-06c75cc233b6",
      description: "description",
      quality_grade: "casual",
      license_code: "cc-by",
      identifications: [{
        type: "identifications",
        id: "2"
      }, {
        type: "identifications",
        id: "3"
      }],
      taxon: {
        type: "taxa",
        id: "1"
      },
      user: {
        type: "users",
        id: "1"
      },
      created_at: "2018-03-20T14:34:20-07:00",
      updated_at: "2018-03-20T14:34:20-07:00"
    },
    {
      id: "3",
      type: "observations",
      uuid: "111fa858-6576-4bc9-aa51-06c75cc233b6",
      description: "description",
      quality_grade: "research",
      license_code: "cc-by",
      taxon: {
        type: "taxa",
        id: "7"
      },
      user: {
        type: "users",
        id: "2"
      },
      created_at: "2018-03-20T14:34:20-07:00",
      updated_at: "2018-03-20T14:34:20-07:00"
    },
    {
      id: "4",
      type: "observations",
      uuid: "211fa858-6576-4bc9-aa51-06c75cc233b6",
      description: "description",
      quality_grade: "casual",
      license_code: "cc-by",
      identifications: [{
        type: "identifications",
        id: "4"
      }],
      taxon: {
        type: "taxa",
        id: "7"
      },
      user: {
        type: "users",
        id: "2"
      },
      created_at: "2018-03-20T14:34:20-07:00",
      updated_at: "2018-03-20T14:34:20-07:00"
    }
  ]
} );
