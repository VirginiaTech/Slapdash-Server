var adjectives = [
    "awesome", "blazing", "breathtaking", "brilliant", "captivating", "dazzling", "delightful",
    "electrifying", "enchanting", "exceptional", "exquisite", "extravagant", "exciting",
    "fabulous", "grandiose", "groovy", "glorious", "illustrious", "incredible", "magnificent",
    "marvelous", "memorable", "mind-blowing", "outstanding", "out of this world", "ravishing",
    "remarkable", "resplendent", "riveting", "scrumptious", "sensational", "smashing",
    "spectacular", "splendid", "sublime", "superb", "terrific", "thrilling", "wonderful"
];

var nouns = [
    "assembly", "adventure", "celebration", "congregation", "encounter", "excursion",
    "extravaganza", "festivity", "fiesta", "flight of fancy", "gala", "gathering", "get together",
    "hullabaloo", "jamboree", "jubilee", "merrymaking", "occasion", "ordeal", "party",
    "pomp and circumstance", "rally", "revelry", "shindig", "venture"
];

function randomValue(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// This function returns a random name for an event.
function randomName(eventCreator) {
    adj = randomValue(adjectives);
    noun = randomValue(nouns);
    return eventCreator + "\'s " + adj + " " + noun;
}

module.exports.randomName = randomName;
