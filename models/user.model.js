const mongoose = require("mongoose");

const UserModel = new mongoose.Schema({
        firstName: String,
        lastName: String,
        email: {type: String, unique: true},
        password: String,
        phone: String,
        status: String,
        isOnline: Boolean,
        regTime: String,
        lastLogin: String,
        avatar: String,
        likedReviews: Array,
        reviews: [
            {
                id: String,
                createdAt: {
                    type: Date,
                    default: new Date()
                },
                title: String,

                text: String,
                img: {
                    public_id: {type: String, required: true},
                    url: {type: String, required: true}
                },
                likedUsersId: [String],
                groupSet: [String],
                tags: [String],
                ratedUsers: [{userId: String, rate: Number }], 
            }
        ]
    }, 
    {
        collection: 'UserData'
    }
)

module.exports = mongoose.model('UserData', UserModel);