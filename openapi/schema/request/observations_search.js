const Joi = require( "joi" );

module.exports = Joi.object( ).keys( {
  acc: Joi.boolean( )
    .description( "Filter by whether `positional_accuracy` is set or not" ),
  captive: Joi.boolean( )
    .description( "Filter by captive / cultivated status" ),
  endemic: Joi.boolean( )
    .description( "Filter by whether the observation is in a place with a check list entry indicating the establishment means is `endemic`" ),
  geo: Joi.boolean( )
    .description( "Filter by observations that are georeferenced" ),
  id_please: Joi.boolean( ).meta( { deprecated: true } ),
  identified: Joi.boolean( )
    .description( "Filter by observations that have community identifications" ),
  introduced: Joi.boolean( )
    .description( "Filter by observations of taxa that are introduced in their location" ),
  mappable: Joi.boolean( )
    .description( "Filter by observations that show on map tiles" ),
  native: Joi.boolean( )
    .description( "Filter by observations of taxa that are native to their location" ),
  out_of_range: Joi.boolean( )
    .description( "Filter by observations of taxa that outside their known ranges" ),
  pcid: Joi.boolean( ).meta( { deprecated: true } ),
  photos: Joi.boolean( )
    .description( "Filter by observations with photos" ),
  popular: Joi.boolean( )
    .description( "Filter by observations that have been favorited by at least one user" ),
  sounds: Joi.boolean( )
    .description( "Filter by observations with sounds" ),
  taxon_is_active: Joi.boolean( )
    .description( "Filter by observations of active taxa" ),
  threatened: Joi.boolean( )
    .description( "Filter by whether the observed taxon has a conservation status of \"threatened\" or worse" ),
  verifiable: Joi.boolean( )
    .description( "Filter by whether observations are 'verifiable' (i.e. have quality grades `research` or `needs_id`)" ),
  id: Joi.array( ).items( Joi.alternatives( ).try(
    Joi.string( ).guid( ),
    Joi.number( ).integer( ),
    Joi.string( )
  ) ).description( "Include observations with this ID" ),
  not_id: Joi.array( ).items( Joi.string( ).guid( ) )
    .description( "Exclude observations with this ID" ),
  license: Joi.array( ).items( Joi.string( ).valid(
    "cc-by",
    "cc-by-nc",
    "cc-by-nd",
    "cc-by-sa",
    "cc-by-nc-nd",
    "cc-by-nc-sa",
    "cc0"
  ) ).description( "Include observations with this license" ),
  photo_license: Joi.array( ).items( Joi.string( ).valid(
    "cc-by",
    "cc-by-nc",
    "cc-by-nd",
    "cc-by-sa",
    "cc-by-nc-nd",
    "cc-by-nc-sa",
    "cc0"
  ) ).description( "Include observations with least one photo with this license" ),
  licensed: Joi.boolean( )
    .description( "Include observations where the license attribute is not null, i.e. it is licensed" ),
  photo_licensed: Joi.boolean( )
    .description( "Include observations with at least one photo with a license attribute that is not null" ),
  place_id: Joi.array( ).items( Joi.alternatives( ).try(
    Joi.string( ).guid( ),
    Joi.number( ).integer( ),
    Joi.string( )
  ) ).description( "Include observations observed within the place with this ID" ),
  project_id: Joi.array( ).items( Joi.alternatives( ).try(
    Joi.number( ).integer( ),
    Joi.string( )
  ) ).description( "Include observations added to the project with this ID or slug" ),
  coords_viewable_for_proj: Joi.boolean( )
    .description(
      "Filter by observers who trust the project(s) specified in `project_id` OR trust the authenticated viewer"
    ),
  rank: Joi.array( ).items( Joi.string( ).valid(
    "stateofmatter",
    "kingdom",
    "phylum",
    "subphylum",
    "superclass",
    "class",
    "subclass",
    "infraclass",
    "subterclass",
    "superorder",
    "order",
    "suborder",
    "infraorder",
    "parvorder",
    "zoosection",
    "zoosubsection",
    "superfamily",
    "epifamily",
    "family",
    "subfamily",
    "supertribe",
    "tribe",
    "subtribe",
    "genus",
    "genushybrid",
    "subgenus",
    "section",
    "subsection",
    "complex",
    "species",
    "hybrid",
    "subspecies",
    "variety",
    "form",
    "infrahybrid"
  ) ).description( "Include observations of taxa with this rank" ),
  site_id: Joi.array( ).items( Joi.number( ).integer( ) )
    .description( "Include observations affiliated with the iNaturalist network website with this ID" ),
  sound_license: Joi.array( ).items( Joi.string( ).valid(
    "cc-by",
    "cc-by-nc",
    "cc-by-nd",
    "cc-by-sa",
    "cc-by-nc-nd",
    "cc-by-nc-sa",
    "cc0"
  ) ).description( "Include observations that have at least one sound with this license" ),
  taxon_id: Joi.array( ).items( Joi.number( ).integer( ) )
    .description( "Include observations of this taxon and its descendants" ),
  without_taxon_id: Joi.array( ).items( Joi.number( ).integer( ) )
    .description( "Exclude observations of this taxon and its descendants" ),
  taxon_name: Joi.string( )
    .description( "Include observations of taxa that have a scientific or common name matching this string" ),
  user_id: Joi.array( ).items( Joi.string( ) )
    .description( "Include observations observed by users that have this ID or login" ),
  user_login: Joi.array( ).items( Joi.string( ) )
    .description( "Include observations observed by users that have this login" ),
  hour: Joi.array( ).items( Joi.number( ).integer( ).min( 0 ).max( 23 ) )
    .description( "Include observations observed within this hour of the day" ),
  day: Joi.array( ).items( Joi.number( ).integer( ).min( 1 ).max( 31 ) )
    .description( "Include observations observed within this day of the month" ),
  month: Joi.array( ).items( Joi.number( ).integer( ).min( 1 ).max( 12 ) )
    .description( "Include observations observed within this month" ),
  year: Joi.array( ).items( Joi.number( ).integer( ) )
    .description( "Include observations observed within this year" ),
  created_day: Joi.array( ).items( Joi.number( ).integer( ).min( 1 ).max( 31 ) )
    .description( "Include observations created within this day of the month" ),
  created_month: Joi.array( ).items( Joi.number( ).integer( ).min( 1 ).max( 12 ) )
    .description( "Include observations created within this month" ),
  created_year: Joi.array( ).items( Joi.number( ).integer( ) )
    .description( "Include observations created within this year" ),
  term_id: Joi.array( ).items( Joi.number( ).integer( ) )
    .description( "Include observations with annotations using this controlled term ID" ),
  term_value_id: Joi.array( ).items( Joi.number( ).integer( ) )
    .description( "Include observations with annotations using this controlled value ID. "
      + "Must be combined with the `term_id` parameter" ),
  without_term_value_id: Joi.array( ).items( Joi.number( ).integer( ) )
    .description( "Exclude observations with annotations using this controlled value ID. "
      + "Must be combined with the `term_id` parameter" ),
  term_id_or_unknown: Joi.array( ).items( Joi.number( ).integer( ) )
    .description( "Include observations with annotations using this controlled term ID "
      + "and associated term value IDs, or be missing annotations using this "
      + "controlled term ID. "
      + "Must be combined with the `term_value_id` or `without_term_value_id` parameters" ),
  annotation_user_id: Joi.array( ).items( Joi.string( ) )
    .description( "Include observations with an annotation created by this user" ),
  acc_above: Joi.number( ).integer( )
    .description( "Include observations with a positional accuracy above this value (meters)" ),
  acc_below: Joi.number( ).integer( )
    .description( "Include observations with a positional accuracy below this value (meters)" ),
  acc_below_or_unknown: Joi.number( ).integer( )
    .description( "Include observations with a positional accuracy below this value (in meters) "
      + "or with an unknown positional accuracy" ),
  d1: Joi.string( )
    .description( "Include observations observed on or after this date/time" ),
  d2: Joi.string( )
    .description( "Include observations observed on or before this date/time" ),
  created_d1: Joi.string( )
    .description( "Include observations created on or after this date/time" ),
  created_d2: Joi.string( )
    .description( "Include observations created on or before this date/time" ),
  created_on: Joi.string( )
    .description( "Include observations created on this date" ),
  observed_on: Joi.string( )
    .description( "Include observations observed on this date" ),
  unobserved_by_user_id: Joi.string( )
    .description( "Exclude observations of taxa previously observed by this user" ),
  apply_project_rules_for: Joi.string( )
    .description( "Include observations that match the rules of the project with this ID or slug" ),
  observation_accuracy_experiment_id: Joi.array( ).items( Joi.number( ).integer( ) )
    .description( "Include observations included in this observation accuracy experiment" ),
  cs: Joi.string( )
    .description( "Include observations of taxa that have this conservation status code. If "
      + "the `place_id` parameter is also specified, this will only consider statuses "
      + "specific to that place" ),
  csa: Joi.string( )
    .description( "Include observations of taxa that have a conservation status from this "
      + "authority. If the `place_id` parameter is also specified, this will only consider "
      + "statuses specific to that place" ),
  csi: Joi.array( ).items( Joi.string( ).valid(
    "LC",
    "NT",
    "VU",
    "EN",
    "CR",
    "EW",
    "EX"
  ) ).description( "Include observations of taxa that have this IUCN conservation status. "
    + "If the `place_id` parameter is also specified, this will only consider statuses "
    + "specific to that place" ),
  geoprivacy: Joi.array( ).items( Joi.string( ).valid(
    "obscured",
    "obscured_private",
    "open",
    "private"
  ) ).description( "Include observations with this geoprivacy setting" ),
  taxon_geoprivacy: Joi.array( ).items( Joi.string( ).valid(
    "obscured",
    "obscured_private",
    "open",
    "private"
  ) ).description( "Include observations where this is the most conservative geoprivacy applied "
      + "by a conservation status associated with one of the taxa proposed in the current "
      + "identifications" ),
  obscuration: Joi.array( ).items( Joi.string( ).valid(
    "obscured",
    "private",
    "none"
  ) ).description( "Include observations where `geoprivacy` or `taxon_geoprivacy` match these values" ),
  hrank: Joi.array( ).items( Joi.string( ).valid(
    "stateofmatter",
    "kingdom",
    "phylum",
    "subphylum",
    "superclass",
    "class",
    "subclass",
    "infraclass",
    "subterclass",
    "superorder",
    "order",
    "suborder",
    "infraorder",
    "parvorder",
    "zoosection",
    "zoosubsection",
    "superfamily",
    "epifamily",
    "family",
    "subfamily",
    "supertribe",
    "tribe",
    "subtribe",
    "genus",
    "genushybrid",
    "subgenus",
    "section",
    "subsection",
    "complex",
    "species",
    "hybrid",
    "subspecies",
    "variety",
    "form",
    "infrahybrid"
  ) ).description( "Include observations of taxa with this rank or lower" ),
  lrank: Joi.array( ).items( Joi.string( ).valid(
    "stateofmatter",
    "kingdom",
    "phylum",
    "subphylum",
    "superclass",
    "class",
    "subclass",
    "infraclass",
    "subterclass",
    "superorder",
    "order",
    "suborder",
    "infraorder",
    "parvorder",
    "zoosection",
    "zoosubsection",
    "superfamily",
    "epifamily",
    "family",
    "subfamily",
    "supertribe",
    "tribe",
    "subtribe",
    "genus",
    "genushybrid",
    "subgenus",
    "section",
    "subsection",
    "complex",
    "species",
    "hybrid",
    "subspecies",
    "variety",
    "form",
    "infrahybrid"
  ) ).description( "Include observations of taxa with this rank or higher" ),
  iconic_taxa: Joi.array( ).items( Joi.string( ).valid(
    "Actinopterygii",
    "Animalia",
    "Amphibia",
    "Arachnida",
    "Aves",
    "Chromista",
    "Fungi",
    "Insecta",
    "Mammalia",
    "Mollusca",
    "Reptilia",
    "Plantae",
    "Protozoa",
    "unknown"
  ) ).description( "Include observations of taxa within this iconic taxon" ),
  id_above: Joi.number( ).integer( )
    .description( "Include observations with an ID above this value" ),
  id_below: Joi.number( ).integer( )
    .description( "Include observations with an ID below this value" ),
  identifications: Joi
    .string( )
    .valid(
      "most_agree",
      "most_disagree",
      "some_agree"
    )
    .description(
      "Include observations based on level of agreement among identifications:\n\n"
      + "* **most_agree:** includes observations where there are more active identifications of taxa that agree with the Observation Taxon than active identifications that disagree with the Observation Taxon\n"
      + "* **some_agree:** includes observations where there are some active identifications of taxa that agree with the Observation Taxon\n"
      + "* **most_disagree:** includes observations where there are more active identifications of taxa that disagree with the Observation Taxon than active identifications that agree with the Observation Taxon"
    ),
  disagreements: Joi.boolean( ).description( "Include observations where there is disagreement among active identifications" ),
  lat: Joi.number( ).min( -90 ).max( 90 )
    .description( "Include observations within a {`radius`} kilometer circle around the specified `lat`/`lng` parameters" ),
  lng: Joi.number( ).min( -180 ).max( 180 )
    .description( "Include observations within a {`radius`} kilometer circle around the specified `lat`/`lng` parameters" ),
  radius: Joi.number( )
    .description( "Include observations within a {`radius`} kilometer circle around the specified `lat`/`lng` parameters" ),
  nelat: Joi.number( ).min( -90 ).max( 90 )
    .description( "Include observations within a bounding box specified by the `nelat`, `nelng`, `swlat`, and `swlng` parameters" ),
  nelng: Joi.number( ).min( -180 ).max( 180 )
    .description( "Include observations within a bounding box specified by the `nelat`, `nelng`, `swlat`, and `swlng` parameters" ),
  swlat: Joi.number( ).min( -90 ).max( 90 )
    .description( "Include observations within a bounding box specified by the `nelat`, `nelng`, `swlat`, and `swlng` parameters" ),
  swlng: Joi.number( ).min( -180 ).max( 180 )
    .description( "Include observations within a bounding box specified by the `nelat`, `nelng`, `swlat`, and `swlng` parameters" ),
  list_id: Joi.number( ).integer( )
    .description( "Include observations of taxa in a list with this ID" ),
  not_in_project: Joi.array( ).items( Joi.string( ) )
    .description( "Exclude observations added to the project this ID or slug" ),
  not_matching_project_rules_for: Joi.string( )
    .description( "Exclude observations that match the rules of the project with this ID or slug" ),
  q: Joi.string( )
    .description( "Include observations with a description, tags, or place_guess matching this query. "
      + "Can be combined with `search_on`" ),
  search_on: Joi.string( ).valid(
    "names",
    "tags",
    "description",
    "place",
    "taxon_page_obs_photos"
  ).description( "Include observations where any of these properties match the value of the `q` parameter" ),
  quality_grade: Joi.array( ).items( Joi.string( ).valid(
    "casual",
    "needs_id",
    "research"
  ) ).description( "Include observations with this quality grade" ),
  without_field: Joi.string( )
    .description( "Exclude observations with this observation field" ),
  outlink_source: Joi.string( )
    .description( "Include observations with outlinks from this source" ),
  updated_since: Joi.string( )
    .description( "Include observations updated since this time" ),
  viewer_id: Joi.number( ).integer( )
    .description( "Must be combined with the `reviewed` parameter" ),
  reviewed: Joi.boolean( )
    .description( "Filter by observations reviewed by the user with ID matching the value of the `viewer_id` parameter" ),
  expected_nearby: Joi.boolean( )
    .description( "Filter by observations expected to occur nearby their location according to the "
      + "latest iNaturalist Geomodel" ),
  fails_dqa_accurate: Joi.boolean( )
    .description( "Filter by observations voted as not accurately depicting an organism or scene" ),
  fails_dqa_date: Joi.boolean( )
    .description( "Filter by observations voted as not having an accurate date" ),
  fails_dqa_evidence: Joi.boolean( )
    .description( "Filter by observations voted as not evidence of an organism" ),
  fails_dqa_location: Joi.boolean( )
    .description( "Filter by observations voted as not having an accurate location" ),
  fails_dqa_needs_id: Joi.boolean( )
    .description( "Filter by observations voted as the community ID cannot be improved" ),
  fails_dqa_recent: Joi.boolean( )
    .description( "Filter by observations voted as not recent evidence of an organism" ),
  fails_dqa_subject: Joi.boolean( )
    .description( "Filter by observations voted as not having evidence related to a single subject" ),
  fails_dqa_wild: Joi.boolean( )
    .description( "Filter by observations voted as not wild" ),
  user_after: Joi.string( )
    .description( "Include observations created by users created after a date. Accepts dates with or without times, "
      + "e.g. 2025-01-01, as well as relative day, month, or year, e.g. 10d, 2w, 1y" ),
  user_before: Joi.string( )
    .description( "Include observations created by users created before a date. Accepts dates with or without times, "
      + "e.g. 2025-01-01, as well as relative day, month, or year, e.g. 10d, 2w, 1y" ),
  locale: Joi.string( )
    .description( "Returned taxon common names will be from this locale" ),
  preferred_place_id: Joi.number( ).integer( )
    .description( "Returned taxon common names will prioritize common names from this place" ),
  ttl: Joi.number( ).integer( )
    .description( "Set the `Cache-Control` HTTP header with this value as `max-age`, in "
      + "seconds. This means subsequent identical requests may be cached on "
      + " iNaturalist servers, and commonly within web browsers" ),
  page: Joi.number( ).integer( )
    .min( 0 )
    .description( "Pagination `page` number" ),
  per_page: Joi.number( ).integer( )
    .description( "Number of results to return in a `page`" ),
  order: Joi.string( ).valid(
    "desc",
    "asc"
  ).default( "desc" ).description( "Sort order" ),
  order_by: Joi.string( ).valid(
    "created_at",
    "geo_score",
    "id",
    "observed_on",
    "random",
    "species_guess",
    "updated_at",
    "votes"
  ).default( "created_at" ).description( "Attribute to sort on" ),
  only_id: Joi.boolean( )
    .description( "Include observations with this ID" ),
  fields: Joi.any( )
    .description( "Attribute fields to return in the response" )
    .example( "species_guess,observed_on" )
} ).unknown( false );
