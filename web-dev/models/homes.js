const mongoose = require('mongoose');


const homeSchema = mongoose.Schema({
  houseName: {type: String, required: true},
  price: {type: String, required: true},
  location: {type: String, required: true},
  rating: {type: String, required: true},
  photo: String,
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // 🔑 Add this field to track live availability
  status: {
    type: String,
    enum: ['Available', 'Booked'],
    default: 'Available'
  }
});

// homeSchema.pre('findOneAndDelete', async function(next) {
//   const homeId = this.getQuery()._id;
//   await favourite.deleteMany({homeId: homeId});
// })

module.exports = mongoose.model('Home', homeSchema);