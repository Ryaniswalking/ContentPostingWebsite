var express    = require("express"),
    app        = express(),
    bodyParser = require("body-parser"),
    mongoose   = require("mongoose"),
    UserPost       = require("./models/UserPost"),
    Comment    = require("./models/comments"),
    flash      = require("connect-flash"),
    passport   = require("passport"),
    LocalStrategy = require("passport-local"),
    User        = require("./models/user"),
    middleware  = require("./middleware")
    methodOverride = require("method-override"),
    seedDB     = require("./seed");




mongoose.connect("mongodb://localhost/dous_the_goose", { 
        useNewUrlParser: true,
        useUnifiedTopology: true 
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(flash());
//seedDB();

app.use(require("express-session")({
    secret: "Walker is the best at golf",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user,
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});


app.get("/", function(req, res){
    res.render("landing.ejs");
})

//============================
//ALL THE ROUTES FOR THE POSTS
//============================

//INDEX ROUTE - will show all the posts in the database
//eventually will be placed in own routes folder
app.get("/dousthegoose", function(req, res){
    //take all the posts from the database and send it index page
    UserPost.find({}, function(err, allPosts){
        if(err){
            console.log(err);
        }else{
            res.render("mainpage/index",{post: allPosts});
        }
    })
    
    
});

//CREATE ROUTE - add new campgrounds to the DB
app.post("/dousthegoose", middleware.isLoggedIn, function(req, res){
    //get data from the form and add to posts
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newPost = {name: name, image: image, description: desc, author: author}
    //creat new post and save to db
    UserPost.create(newPost, function(err, newlyCreatedPost){
        if(err){
            console.log(err);
        }else{
            //redirect back to the post display page
            res.redirect("/dousthegoose");
        }
    })
});

//NEW ROUTE - Brings up a form to enter in a new post
app.get("/dousthegoose/new", middleware.isLoggedIn, function(req, res){
    res.render("mainpage/new");
});

//SHOW ROUTE - Shows more info about 1 post
app.get("/dousthegoose/:id", function(req, res){
    UserPost.findById(req.params.id).populate("comments").exec(function(err, foundPost) {
        console.log(foundPost);
        if(err || !foundPost){
            req.flash("error", "Campground not found");
            res.redirect("/dousthegoose");
        }else{  
            res.render("mainpage/show", {post: foundPost});
        }
    });
});

//EDIT POST ROUTE
app.get("/dousthegoose/:id/edit", middleware.checkPostOwnership, function(req, res){
    UserPost.findById(req.params.id, function(err, foundPost){
        res.render("mainpage/edit", {post: foundPost});
    });  
});

//UPDATE POST ROUTE
app.put("/dousthegoose/:id", middleware.checkPostOwnership, function(req, res){
    UserPost.findByIdAndUpdate(req.params.id, req.body.post, function(err, updatePost){
        if(err){
            res.redirect("/dousthegoose")
        }else{
            res.redirect("/dousthegoose/" + req.params.id);
        }
    });
});

//DESTROY POST ROUTE
app.delete("/dousthegoose/:id", middleware.checkPostOwnership, function(req, res){
    UserPost.findByIdAndDelete(req.params.id, function(err){
        if(err){
            res.redirect("/dousthegoose");
        }else{
            res.redirect("/dousthegoose");
        }
    })
});


//===========================
//   COMMENTS ROUTES
//===========================


//NEW - Create a new comment for a post
app.get("/dousthegoose/:id/comments/new", middleware.isLoggedIn, function(req, res){
    UserPost.findById(req.params.id, function(err, post){
        if(err){
            console.log(err);
        }else{
            res.render("comments/new", {post: post});
        }
    });
});

//POST - post the comment on the post
app.post("/dousthegoose/:id/comments", middleware.isLoggedIn, function(req, res){
    UserPost.findById(req.params.id, function(err, post){
        if(err){
            console.log(err);
            res.redirect("/dousthegoose");
        }else{
             //Create new comment
             Comment.create(req.body.comment, function(err, comment){
                 if(err){
                     //PUT FLASH HERE
                     eq.flash("error", "Something went wrong.");
                     console.log(err);
                 }else{
                     //add username and Id to comment
                     comment.author.id = req.user._id;
                     comment.author.username = req.user.username;
                     //save the comment
                     comment.save();
                     //connect the comment to post
                     post.comments.push(comment);
                     post.save();
                     //USE FLASH HERE
                     req.flash("success", "Successfully created comment.");
                     //redirect back to mainpage
                     res.redirect("/dousthegoose/" + post._id);
                 }
             });
        }
    });
});

//EDIT - Edit the comment of the post
app.get("/dousthegoose/:id/comments/:comment_id/edit", middleware.checkCommentOwnership,  function(req, res){
    UserPost.findById(req.params.id, function(err, foundPost){
        if(err || !foundPost){
            //USE FLASH HERE
            req.flash("error", "Post not found.");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                res.redirect("back");
            }else{
                res.render("comments/edit", {post_id: req.params.id, comment: foundComment});
            }
        });
    });
});

//PUT - edit the comment
app.put("/dousthegoose/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err){
        if(err){
            res.redirect("back");
        }else{
            //USE FLASH HERE
            req.flash("success", "Comment Updated");
            res.redirect("/dousthegoose/" + req.params.id);
        }
    });
});

//DESTROY - delete the comment from the post
app.delete("/dousthegoose/:id/comments/:comment_id", middleware.checkCommentOwnership,  function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("back");
        }else{
            //USE FLASH HERE
            req.flash("success", "Comment deleted");
            res.redirect("/dousthegoose/" + req.params.id);
        }
    });
});



//=====================
//   OTHER ROUTES
//=====================


//REGISTER ROUTE - Register your account
app.get("/register", function(req, res){
    res.render("register");
});

//REGISTER POST ROUTE - handles the sign up logic
app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            //USE FLASH HERE
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function(){
            //USE FLASH HERE
            req.flash("success", "Welcome to DTG " + user.username);
            res.redirect("/dousthegoose");
        });
    });
});

//LOGIN ROUTE - Log into your account
app.get("/login", function(req, res){
    res.render("login");
});

//LOGIN POST ROUTE - handles login logic
app.post("/login", passport.authenticate("local",
    {
        successRedirect: "/dousthegoose",
        failureRedirect: "/login",
        failureFlash: true
    }), function(req, res){
});


//LOGOUT ROUTE - Logs out the user
app.get("/logout", function(req, res){
    req.logout();
    //USE FLASH HERE
    req.flash("success", "Logged you out!");
    res.redirect("/dousthegoose");
});





app.listen(3000,function(){
    console.log("Server has started...")
});