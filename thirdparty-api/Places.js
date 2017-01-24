var GooglePlacesPromises = require('googleplaces-promises');

var placesPromises = new GooglePlacesPromises("AIzaSyCca_OgvwyuXH_Dm8mlLqtXGqO5tacveNk");

/* getPlaces: searches the business using Yelp
   Inputs: location is an object used to describe location for searching.

   location = {
       address: 'address, neighborhood, city, state or zip, optional country',
       latitude: double,
       longtitude: double,
       ne_latitude: double,
       ne_logtitude: double,
   }
   Two ways to pass your location:
   1. Provide latitude and longtitude or address, and leave the other
      properties undefined. If you provide both, latitude and logtitude will
      be used to disambiguate the address text.
   2. Provide latitude, longtitude, ne_latitude, and ne_logtitude. The location
      searched will be defined as a rectangle box bounded by the latitudes and
      longtitudes. The radius arguement will be ingored in this case.

   radius: Search radius in meters. Max value is 40000 meters.

   option = {
       term: string,
       limit: integer,
       offset: integer,
       sort: integer,
       category_filter: string,
       deals_filter: bool,
   }
   term: Search term (e.g. "food", "restaurants"). If term isn’t included then
         search everything. The term keyword also accepts business names such
         as "Starbucks".
   limit: Number of business results to return
   offset: Offset the list of returned business results by this amount
   sort: 0=Best matched (default), 1=Distance, 2=Highest Rated.
   category_filter: Category to filter search results with. The category filter
       can be a list of comma delimited categories. For example, 'bars,french'
       will filter by Bars and French.
       See https://www.yelp.com/developers/documentation/v2/all_category_list
       for category identifyier.
   deals_filter: Whether to exclusively search for businesses with deals
*/

function getPlaces(location, radius, type){
    var searchParams = {
        location: location,
        radius: radius,
        types: type
    };

    return placesPromises.radarSearch(searchParams);
}

module.exports.getPlaces = getPlaces;
