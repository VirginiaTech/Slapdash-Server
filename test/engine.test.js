const expect = require('chai').expect;
const deepcopy = require('deepcopy');

const geolib = require('../engine/geolib.js');
const engine = require('../engine/engine.js');

const location1JSON = require('./json/location1.json');
const location2JSON = require('./json/location2.json');
const location3JSON = require('./json/location3.json');
const location4JSON = require('./json/location4.json');
const location5JSON = require('./json/location5.json');
const location6JSON = require('./json/location6.json');

function compareCoordinates(a, b, eps) {
    return Math.abs(a.latitude - b.latitude) < eps && Math.abs(a.longitude - b.longitude) < eps;
}

describe('geolib.js test', function() {
    var epsilon = 0.001;
    var location1, location2, location3, location4, location5, location6;

    before(function() {
        location1 = deepcopy(location1JSON);    // Blacksburg, VA
        location2 = deepcopy(location2JSON);    // Seattle, WA
        location3 = deepcopy(location3JSON);    // San Francisco, CA
        location4 = deepcopy(location4JSON);    // Midpoint between Blacksburg and Seattle
        location5 = deepcopy(location5JSON);    // Midpoint between Blacksburg, Seattle, and San Francisco
        location6 = deepcopy(location6JSON);    // Point of minimum distance between Blacksburg, Seattle, and San Francisco
    });

    it('test midpoint computation for one location', function() {
        var midpoint = geolib.computeMidpoint([ location1 ]);
        expect(compareCoordinates(midpoint, location1, epsilon));
    });

    it('test point of minimum distance computation for one location', function() {
        var center = geolib.computeCenter([ location1 ]);
        expect(compareCoordinates(center, location1, epsilon));
    });

    it('test midpoint computation for two locations', function() {
        var midpoint = geolib.computeMidpoint([ location1, location2 ]);
        expect(compareCoordinates(midpoint, location4, epsilon));
    });

    it('test point of minimum distance computation for two locations', function() {
        var center = geolib.computeCenter([ location1, location2 ]);
        expect(compareCoordinates(center, location4, epsilon));
    });

    it('test midpoint computation for three locations', function() {
        var midpoint = geolib.computeMidpoint([ location1, location2, location3 ]);
        expect(compareCoordinates(midpoint, location5, epsilon));
    });

    it('test point of minimum distance computation for three locations', function() {
        var center = geolib.computeCenter([ location1, location2, location3 ]);
        expect(compareCoordinates(center, location6, epsilon));
    });
});

describe('decision-making engine test', function() {

    var location1, location2;
    before(function() {
        location1 = deepcopy(location1JSON);    // Blacksburg, VA
        location2 = deepcopy(location2JSON);    // Seattle, WA
    });

    it('test food decision', function(done) {
        this.timeout(2000);
        engine.decide([ location1 ], "food").then(function(data) {
            done();
        });
    });

    it('test drink decision', function(done) {
        this.timeout(2000);
        engine.decide([ location1 ], "drink").then(function(data) {
            done();
        });
    });

    it('test fun decision', function(done) {
        this.timeout(2000);
        engine.decide([ location1 ], "play").then(function(data) {
            done();
        });
    });

    it('test slapdash decision', function(done) {
        this.timeout(2000);
        engine.decide([ location1 ], "slapdash").then(function(data) {
            done();
        });
    });

    it('test decision with multiple users', function(done) {
        this.timeout(5000);
        engine.decide([ location1, location2 ], "slapdash").then(function(data) {
            done();
        });
    });

    it('test reroll', function(done) {
        this.timeout(5000);
        engine.decide([ location1 ], "food").then(function(data1) {
            engine.reroll([ location1 ], "food", [ data1.id ]).then(function(data2) {
                expect(data1.id !== data2.id);
                done();
            });
        });
    });
});
