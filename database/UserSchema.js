const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const debug = require('debug')('database:user');

// ============================= $ Schema $ ====================================
var UserSchema = new Schema({
	name: {
		firstname: {
			type: String,
			// TODO : Make this required
			// required: true
		},
		lastname: {
			type: String,
			// TODO : Make this required uncommented
			// required: true
		}
	},
	email: {
		type: String,
		// TODO : Make this required uncommented
		// required: true
	},
	fbtokenid: {
		type: String,
		required: true,
		index: true,
		unique: true
	},
	androidregid: {
		type: String,
		// TODO : uncomment after receiving android regID
		required: true,
		index: true,
		unique: true
	},
	recentlocation : {
		lat: Number,
		lon: Number
	},
	eventsjoined: [{ type: Schema.Types.ObjectId, ref: 'Event'}],
	// TODO uncomment the followings
	// likes: [{like: Number}],
	// dislikes: [{dislike: Number}]
}, {
	toJSON: {
		versionKey: false
	}
});

/* Creating a virtual field for user */
UserSchema.virtual('name.full').get(function(){
	return this.name.firstname + ' ' + this.name.lastname;
});

var User = mongoose.model('User', UserSchema);

User.on('index', function(err){
	if(err){
		debug('Error creating index:' + err);
	}
});

module.exports.User = User;
