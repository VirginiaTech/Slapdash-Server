const expect = require('chai').expect;
const getPlaces = require('../thirdparty-api/Yelp.js').getPlaces;
const deepCopy = require('deepCopy');


const location1JSON = require('./json/location1.json');
const location2JSON = require('./json/location2.json');
const option1JSON = require('./json/option1.json');
const option2JSON = require('./json/option2.json');


describe('YelpAPI test', function(){
    var location1, location2, option1, option2;

    before(function(){

        location1 = deepCopy(location1JSON);
        location2 = deepCopy(location2JSON);
        option1 = deepCopy(option1JSON);
        option2 = deepCopy(option2JSON);
    });

    it('Search for food using address', function(done){
        this.timeout(10000);

        getPlaces(location1, 40000, option2)
            .then(function(data){
                expect((data == undefined || data == null)).to.equal(false);
                expect(data.businesses.length).to.equal(option2.limit);
                done();
            })
            .catch(function(err){
                if(err)
                    done("Search food in Blacksburg failed");
            });
    });

    it('Search for food using latitude and longitude', function(done){
        this.timeout(10000);

        getPlaces(location2, 40000, option1)
            .then(function(data){
                expect((data == undefined || data == null)).to.equal(false);
                done();
            })
            .catch(function(err){
                if(err)
                    done("Search food in Blacksburg failed");
            });
    });

});