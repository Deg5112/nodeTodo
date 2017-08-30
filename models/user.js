var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var ObjectId = require('mongodb').ObjectID;

var UserSchema = mongoose.Schema({   //define data collection schema
  local: {
    username: {
      type: String,
      index:true
    },
    password: {
      type: String
    },
    email: {
      type: String
    },
    encryptedEmail: {
      type: String
    },
    name: {
      type: String
    },
    resetHash: {
      type: String
    },
    active:{
      type: Boolean
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  facebook: {
    id: String,
    token: String,
    email: String,
    name: String
  }
});

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function(newUser, callback){
	bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(newUser.local.password, salt, function(err, hash) {
      // Store hash in your password DB.
      newUser.local.password = hash;  //set new user = hash
      newUser.save(callback);  //save
    });
	});
};

module.exports.verifyUser = function(encryptedEmail, callback){
	User.update(
		{
		  local:{$exists: true},
		  "local.encryptedEmail":encryptedEmail
		},
		{
		  $set:{
	      "local.active": true
		  }
		},
		callback
	);
};

module.exports.updateResetHash = function(email,resetHash, callback){
	User.update(
		{
	    local:{$exists: true},
	    "local.email":email
		},
		{
	    $set:{
	      "local.resetHash": resetHash
	    }
		},
		callback
	);
};

module.exports.updatePassword = function(password, id, callback){
	bcrypt.genSalt(10, function(err, salt) {
	  bcrypt.hash(password, salt, function(err, hash) {
			User.update({
			  local: {$exists: true},
			  _id: ObjectId(id)
			},
			{
			  $set:{
			      "local.password": hash,
			      'local.resetHash': null
			  }
			}, callback
			);
	  });
	});
};


module.exports.findUserByResetHash = function(hash, callback){
  User.find({
		  local: {$exists: true},
		  "local.resetHash": hash
		},
    callback
  );
};

module.exports.getUserByUsername = function(username, callback){
  User.find(
    {
      local: {$exists: true },
      "local.username": username
    },
    callback
  );
};

module.exports.getUserByEmail = function(email, callback){
  User.find(
    {
      local: {$exists: true},
      "local.email": email
    },
    callback
  );
};


module.exports.checkDuplicatedRegistration = function(username, email, callback){
  User.find(
  	{
	    local: {$exists: true},
	    $or:[{"local.username": username}, {'email': email}]
	  },
	  callback
  );
};

module.exports.getUserById = function(id, callback){
  User.findById(id, callback);
};

module.exports.comparePassword = function(password, hash, callback){
  bcrypt.compare(password, hash, function(err, isMatch) {
    if(err) throw err;
    callback(null, isMatch);
  });
};

