module.exports.computeCenter = computeCenter;
module.exports.computeMidpoint = computeMidpoint;

// This function computes the center of minimum distance.
function computeCenter(geocoordinates) {

    // Convert to radians.
    radcoordinates = geocoordinates.map(function(c) { return { lat: c.latitude * Math.PI / 180, lng: c.longitude * Math.PI / 180 } });

    // First compute the geographic midpoint and total distance from each point to the midpoint.
    var currentPoint = computeMidpoint(radcoordinates);
    var minDistance = radcoordinates.reduce(function(t, c) { return t + geodistance(currentPoint, c) }, 0);

    // Check if any of the given points has a better total distance.
    for (var i = 0; i < radcoordinates.length; i++) {
        var coordinate = radcoordinates[i];
        var totalDistance = radcoordinates.reduce(function(t, c) { return t + geodistance(coordinate, c) }, 0);

        if (totalDistance < minDistance) {
            currentPoint = coordinate;
            minDistance = totalDistance;
        }
    }

    // Search for a point with shorter total distance by considering 8 points around the current point.
    // Continue decreasing search radius until we converge at a point that minimizes the total distance.
    var testDistance = Math.PI / 2;
    while (testDistance >= 0.00000002) {

        var hypotenuse = Math.sqrt(testDistance * testDistance / 2);
        var testCoordinates = [
            { lat: currentPoint.lat + testDistance, lng: currentPoint.lng                }, // N
            { lat: currentPoint.lat + hypotenuse,   lng: currentPoint.lng + hypotenuse   }, // NE
            { lat: currentPoint.lat,                lng: currentPoint.lng + testDistance }, // E
            { lat: currentPoint.lat - hypotenuse,   lng: currentPoint.lng + hypotenuse   }, // SE
            { lat: currentPoint.lat - testDistance, lng: currentPoint.lng                }, // S
            { lat: currentPoint.lat - hypotenuse,   lng: currentPoint.lng - hypotenuse   }, // SW
            { lat: currentPoint.lat,                lng: currentPoint.lng - testDistance }, // W
            { lat: currentPoint.lat + hypotenuse,   lng: currentPoint.lng - hypotenuse   }  // NW
        ]

        var flag = false;
        for (var i = 0; i < testCoordinates.length; i++) {
            var coordinate = testCoordinates[i];
            var totalDistance = radcoordinates.reduce(function(t, c) { return t + geodistance(coordinate, c) }, 0);

            if (totalDistance < minDistance) {
                currentPoint = coordinate;
                minDistance = totalDistance;
                flag = true;
                break;
            }
        }

        if (!flag) testDistance /= 2;
    }

    // Convert back to degrees. [latitude, longitude]
    return [currentPoint.lat * 180 / Math.PI, currentPoint.lng * 180 / Math.PI];
}


// This function computes the geographic midpoint (center of gravity) of a set of points.
function computeMidpoint(radcoordinates) {

    // Convert latitude and longitude to cartesian coordinates.
    coordinates = radcoordinates.map(function(c) {
        return { x: Math.cos(c.lat) * Math.cos(c.lng), y: Math.cos(c.lat) * Math.sin(c.lng), z: Math.sin(c.lat) }
    })

    // Average of x, y, z coordinates.
    var avgx = coordinates.map(function(c) { return c.x }).reduce(function(t, c) { return t + c; }) / coordinates.length;
    var avgy = coordinates.map(function(c) { return c.y }).reduce(function(t, c) { return t + c; }) / coordinates.length;
    var avgz = coordinates.map(function(c) { return c.z }).reduce(function(t, c) { return t + c; }) / coordinates.length;

    // Compute midpoint.
    var midpoint = { lat: Math.atan2(avgz, Math.sqrt(avgx * avgx + avgy * avgy)), lng: Math.atan2(avgy, avgx) };
    return midpoint;
}


// This function computes distance based on the spherical law of cosines.
function geodistance(radcoordinate1, radcoordinate2) {
    var lat1 = radcoordinate1.lat; var lng1 = radcoordinate1.lng;
    var lat2 = radcoordinate2.lat; var lng2 = radcoordinate2.lng;
    return Math.acos(Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1));
}
