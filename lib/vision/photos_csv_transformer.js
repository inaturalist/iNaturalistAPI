const readline = require( "readline" );
const fs = require( "fs" );
const _ = require( "lodash" );

const photosCSV = "./photos.csv";
const testImageSize = 8500;
const augmentedTestImageSize = 1500;
let testImages = [];
let augmentestTestImages = [];

const reader = readline.createInterface( {
  input: fs.createReadStream( photosCSV )
} );

let lineNumber = 0;
const columnHeaders = { };
reader.on( "line", line => {
  lineNumber += 1;
  if ( lineNumber === 1 ) {
    const columns = line.split( "," );
    _.each( columns, ( val, key ) => {
      columnHeaders[val] = key;
    } );
    return;
  }
  // randomly skip 9 out of 10 lines to save memory before
  // the final randomize and pick for the test subset
  if ( _.random( 0, 9 ) !== 0 ) { return; }
  const columns = line.split( "," );
  const photoID = columns[columnHeaders.photo_id];
  const set = columns[columnHeaders.set];
  const taxonID = columns[columnHeaders.taxon_id];
  const observationID = columns[columnHeaders.observation_id];
  const photoURL = columns[columnHeaders.url];
  let extension;
  // only use JPEGs we're hosting on S3
  const matches = photoURL.match( /inaturalist.*medium\.(jp[a-z]{1,2} )\?/i );
  if ( matches ) {
    extension = matches[1];
  }
  if ( !extension ) { return; }
  const row = {
    photoID,
    taxonID,
    observationID,
    extension
  };
  if ( set === "test" ) {
    testImages.push( row );
  } else if ( set === "augmented_test" ) {
    augmentestTestImages.push( row );
  }
} );

reader.on( "close", ( ) => {
  testImages = _.take( _.shuffle( testImages ), testImageSize );
  augmentestTestImages = _.take( _.shuffle( augmentestTestImages ), augmentedTestImageSize );
  fs.writeFile( "test_images.json", JSON.stringify( testImages, null, "  " ) );
  fs.writeFile( "augmented_test_images.json",
    JSON.stringify( augmentestTestImages, null, "  " ) );
} );
