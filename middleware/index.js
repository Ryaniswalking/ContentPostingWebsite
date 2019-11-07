var UserPost = require("../models/UserPost");
var Comment    = require("../models/comments");

//All the middlewares

var middlewareObj = {};

middlewareObj.checkPostOwnership = function(req, res, next){
    //is the user logged in
    if(req.isAuthenticated()){
        UserPost.findById(req.params.id, function(err, foundPost){
            if(err || !foundPost){
                //USE FLASH
                req.flash("error", "Campground not found.")
                res.redirect("back");
            }else{
                //does the user own the post
                if(foundPost.author.id.equals(req.user._id)){
                    next()
                }else{
                    //USE FLASH
                    req.flash("You don't have permission to do that.");
                    res.redirect("back");
                }
            }
        });
    }else{
        //USE FLASH
        req.flash("error", "You must be logged in to do that.");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next){
    //is the user logged in
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err || !foundComment){
                //USE FLASH
                req.flash("error", "Comment not found");
                res.redirect("back");
            }else {
                if(foundComment.author.id.equals(req.user._id)){
                    next();
                }else {
                    //USE FLASH
                    req.flash("You don't have permission to do that.")
                    res.redirect("back");
                }            
            }            
        });
    }else{
        //use flash
        req.flash("error", "You must be logged in to do that.");
        res.redirect("/login");
    }
}

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
       //flash messages "you need to login"
       req.flash("error", "You must be logged in to do that.");
       res.redirect("/login");
}


module.exports = middlewareObj;