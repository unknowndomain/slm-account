var express = require('express'),
    _ = require("underscore");

module.exports = {
    "title": "Account",
    "name": "account",
    "app": function(config, db, site) {
        var app = express();
        
        _.extend(app.locals, site.locals);
        
        app.set('views', __dirname + "/views");
        app.use(express.csrf());
        app.use(function (req, res, next) {
            res.locals.token = req.csrfToken();
            next();
        });
        
        app.locals.data = {
            page_title: "Account"
        }

        app.get('/', function(req, res){
            if (req.session.email) {
                res.render("account");
            }
            else {
                res.locals.flash("danger", "Not logged in.", "Please log in to access the account page.");
                res.redirect("/"); // could probably be handled better or elsewhere
            }
        });
        
        app.post("/", function (req, res) {
            var user = res.locals.user;
            if (user) {
                if (user.card_id != req.body.card_id) {
                    user.card_id = req.body.card_id;
                    user.save(function (err, user) {
                        // must handle validation errors
                        if (!err) {
                            res.locals.flash("success", "Updated.", "Card ID updated successfully.");
                            res.render("account", {user: user});
                        }
                        else {
                            console.log("Could not save entry because: " + err);
                            console.log("Data: " + user);
                            res.send(500, "Database error. This has been logged but please report the issue with the code SLME003.");
                        }
                    });
                }
                else if (req.body.wiki) {
                    // create wiki account
                }
            }
            else {
                res.locals.flash("danger", "Not logged in.", "Please log in to access the account page.");
                res.redirect("/"); // could probably be handled better or elsewhere
            }
        });
        return app;
    }
}

