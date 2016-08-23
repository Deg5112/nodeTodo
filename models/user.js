//MODELS!!
var mongoose = require('mongoose');// require mongoose
var bcrypt = require('bcryptjs');  //required bcrypt right herrrrr
var ObjectId = require('mongodb').ObjectID;
//User Schema

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
//if you say module.exports = --->   and assign the model to a variable.. you can use user in other pages

//                                       modelname , tableSchema
var User = module.exports = mongoose.model('User', UserSchema);

//if you just make a new user, and then to .save()  .. that'll create a new record of a user collection

//below is like saying.. User.createUser = function(){}
// this method passes in a user object, encyrpts the password, then stores the user in db, the callback passed in,
//gets called after we save
module.exports.createUser = function(newUser, callback){
    // console.log('model new user before save', newUser);
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.local.password, salt, function(err, hash) {
            // Store hash in your password DB.
            newUser.local.password = hash;  //set new user = hash
            newUser.save(callback);  //save 
        });
    });
};

module.exports.verifyUser = function(encryptedEmail, callback){

    User.update({
            local:{$exists: true},
            "local.encryptedEmail":encryptedEmail
        },
        {
            $set:{
                "local.active": true
            }
        }, callback);
};

module.exports.updateResetHash = function(email,resetHash, callback){
    console.log('model takes', email, resetHash);
    User.update({
            local:{$exists: true},
            "local.email":email
        },
        {
            $set:{
                "local.resetHash": resetHash
            }
        }, callback);
};

module.exports.updatePassword = function(password, id, callback){
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            // Store hash in your password DB.
            User.update({
                    local:{$exists: true},
                    _id: ObjectId(id)
                },
                {
                    $set:{
                        "local.password": hash, 
                        'local.resetHash': null
                    }
                }, callback);
        });
    });
};


module.exports.findUserByResetHash = function(hash, callback){
    console.log('username', hash);
    var query = {
        local:{ $exists: true },
        "local.resetHash": hash
    };
    User.find(query, callback);
};

module.exports.getUserByUsername = function(username, callback){
    console.log('username', username);
    var query = {
        local:{ $exists: true },
        "local.username": username
    };
    User.find(query, callback);
};



module.exports.checkDuplicatedRegistration = function(username, email, callback){

    var query = {
        local:{ $exists: true },
        $or:[{"local.username": username},{'email': email}]
    };

    User.find(query, callback);
};

module.exports.getUserById = function(id, callback){
    User.findById(id, callback); //this looks for the id of record.. facebook/local has nothing to do with this
};

module.exports.comparePassword = function(password, hash, callback){
    console.log('got here');
    console.log('password', password);
    console.log('hash',hash);
    bcrypt.compare(password, hash, function(err, isMatch) {
        if(err) throw err;
        callback(null, isMatch);
    });
};

