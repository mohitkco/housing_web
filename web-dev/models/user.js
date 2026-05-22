const mongoose = require('mongoose');


const userSchema = mongoose.Schema({
 firstName: {type: String , required: [true, 'First name is required']},
 lastName:  {type: String ,},
 email: {type: String , required: [true, 'email is required'], unique:true},
 password: {type: String , required: [true, 'password is required']},
 userType: { type: String , enum: ['guest', 'host'], default: 'guest'},
 favourites: { type: [mongoose.Schema.Types.ObjectId] , ref: 'Home',default:[]},
 bookings: { type: [mongoose.Schema.Types.ObjectId] , ref: 'Home',default:[]}
});


module.exports = mongoose.model('User', userSchema);