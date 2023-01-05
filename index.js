const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("./utils/cloudinary");
const { v4 } = require('uuid');
require('dotenv').config();


const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;
const mongoURL = process.env.MONGO_URL;

app.use(cors())

app.use(bodyParser.json({ limit: '5mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true, parameterLimit: 100000 }));

app.use(express.json());

mongoose
    .connect(mongoURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then((req, res) => {
        console.log("connected to database")
    })
    .catch(e => console.log(e));

// Models
const UserData = require('./models/user.model')

app.post('/api/register', async (req, res) => {

    const { lName, fName, email, password, phone } = req.body;
    const encryptedPassword = await bcrypt.hash(password, 10);

    try {
        const userExists = await UserData.findOne({ email });
        if (userExists) {
            res.send({ error: "User Exists" })
        } else {
            const newUser = {
                firstName: fName,
                lastName: lName,
                email,
                password: encryptedPassword,
                phone,
                status: "admin",
                isOnline: true,
                regTime: new Date(),
                lastLogin: new Date(),
                avatar: "",
                likedReviews: [],
                reviews: [],
            };
            await UserData.create(newUser);
            res.send({ status: "OK", newUser });
        }
    } catch (error) {
        res.send({ status: 'error', message: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password, loginWithSocialAccount } = req.body;
    const currentUser = await UserData.findOne({ email });

    if (!currentUser) return res.status(404).send({ message: "User Not Found" });
    const decryptedPassword = await bcrypt.compare(password, currentUser.password);
    
    if (decryptedPassword || loginWithSocialAccount ) {
        const token = jwt.sign({ email: currentUser.email }, JWT_SECRET);
        if (res.status(201))
            return res.send({ status: "OK", data: token, user: currentUser })
        else
            return res.send({ error: "error" });
    }
    res.send({ status: "error", message: "Invalid password" })

})

app.get(("/api/usersData"), async (req, res) => {
    await UserData.find({}).then((users) => {
        res.send(users);
    });
});
app.post('/api/findUser', async (req, res) => {
    const { token } = req.body;
    try {
        const user = jwt.verify(token, JWT_SECRET);
        await UserData.findOne({ email: user.email })
            .then(data => { res.send({ status: "OK", data: data }) })
            .catch(err => {
                res.send({ status: "error", data: err })
            })
    } catch (error) {

    }
});

app.post('/api/addReview', async (req, res) => {
    const { id, title, img, text, tags } = req.body;

    try {
        const imageUpload = await cloudinary.uploader.upload(img, {
            folder: "Review Images",
            use_filename: true,
        });

        const newReview = {
            id: v4(),
            title,
            img: {
                public_id: imageUpload.public_id,
                url: imageUpload.secure_url,
            }, 
            text, 
            tags
        };
        
        await UserData.update({ _id: id }, {
            $push: { reviews: newReview }
        }).then(data => res.send({status: "OK", message: "Successfully added!" }))

    } catch (error) {
        res.send({ status: "error", message: error.message})
    }
})

app.listen(PORT, () => console.log("server started"))