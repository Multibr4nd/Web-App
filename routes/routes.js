const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const fs = require('fs');

// image upload
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function(req, file, cb ) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
});

var upload = multer({
    storage: storage,
}).single("image");

// Insert an user into database route
router.post("/add", upload, (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: req.file.filename,
    });
    user.save((err) => {
        if (err) {
            res.json({message: err.message, type: "danger"});
        } else {
            req.session.message = {
                type: "success",
                message: "User added Successfully!",
            };
            res.redirect("/");
        }
    });
});

// get all users route
router.get("/", (req, res) => {
    User.find().exec() // Удалите обратный вызов здесь
        .then(users => {
            res.render("index", {
                title: "Home Page",
                users: users // Замените 'users, users' на 'users: users'
            });
        })
        .catch(err => {
            res.json({ message: err.message });
        });
});

router.get("/add", (req, res) => {
    res.render("add_users", { title: "Add Users"});
});

// Edit an user route
router.get('/edit/:id', (req, res) => {
    let id = req.params.id;
    User.findById(id) // Удалите обратный вызов здесь
        .then(user => {
            if(!user) {
                res.redirect('/');
            } else {
                res.render("edit_users", {
                    title: "Edit User",
                    user: user,
                });
            }
        })
        .catch(err => {
            res.redirect('/');
        });
});

// Update user route
router.post("/update/:id", upload, (req, res) => {
    let id = req.params.id;
    let new_image = "";

    if(req.file) {
        new_image = req.file.filename;
        try{
            fs.unlinkSync("./uploads/" + req.body.old_image);
        } catch(err){
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    User.findByIdAndUpdate(id, {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: new_image,
    }, (err, result) => {
        if(err){
            res.json({message: err.message, type: 'danger'});
        } else{
            req.session.message = {
                type: "success",
                message: "User updated successfully!",
            };
            res.redirect('/');
        }
    });
});

// Delete user route
router.get('/delete/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const user = await User.findOneAndDelete({_id: id});
        if (user && user.image) {
            try {
                fs.unlinkSync('./uploads/' + user.image);
            } catch(err) {
                console.log(err);
            }
        }
        req.session.message = {
            type: "success",
            message: "User deleted successfully!"
        };
        res.redirect("/");
    } catch (err) {
        res.json({message: err.message});
    }
});



module.exports = router;