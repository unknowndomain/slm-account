var express = require( 'express' ),
    _ = require( 'underscore' ),
    request = require( 'request' );

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
                res.locals.flash("danger", "Not logged in.", "You are not logged in.");
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
                } else if (req.body.wiki) {
                    // create wiki account
                } else if (req.body.slack) {
                    var name = user.name.split(' ');
                    request.post( {
                        url: config.slack.url + 'users.admin.invite?t=' + new Date().getTime(),
                        json: true,
                        form: {
                            first_name: name[0],
                            last_name: name[1],
                            email: user.email,
                            token: config.slack.token,
                            set_active: true,
                            _attempts: 1
                        }
                    }, function( err, response, body ) {
                        if ( body.ok ) {
                            res.locals.flash("success", "Created.", "Slack invite has been sent to your email address.");
                            res.render("account", {user: user});
                        } else {
                            if ( body.error == 'already_in_team' ) {
                                res.locals.flash("danger", "Duplicate.", "You already have a team Slack account at this email address.");
                            }
                            else if ( body.error == 'sent_recently' ) {
                                res.locals.flash("warning", "Invite sent.", "We've already sent you an invite to Slack, please check your email.");
                            }
                            else {
                                res.locals.flash("danger", "Failed.", "Something's gone wrong or other #" + body.error + ".");
                            } 
                            res.render("account", {user: user});
                        }
                    } );
                }
            }
            else {
                res.locals.flash("danger", "Not logged in.", "You are not logged in.");
                res.redirect("/"); // could probably be handled better or elsewhere
            }
        } );
        return app;
    }
}
