koa-paginate
============

A koa pagination middleware

Install
============
    npm install koa-paginate

Example
============
    var app = require("koa")(),
        router = require("koa-router")(app),
        paginate = require("paginate");
    
    // error handler
    app.use(function* (next) {
        try {
            yield next;
        } catch (err) {
            // in case a MaxLimitError is thrown
            if (err instanceof paginate.MaxLimitError) {
                this.response.status = 400;
                this.response.body = "Wow, " + err.limit + " it's too much. We accept a maximum of " + err.maxLimit;
            }
            // throw the error to the parent middleware
            else {
                throw err;
            }
        }
    });
    
    // add middleware
    app.use(paginate.middleware({
        // in case the limit is null
        defaultLimit: 20,
        // throws an error when exceeded
        maxLimit: 200
    }));
    
    app.use(router);
    
    app.get("/", function* () {
    
        // this wraps the data and add the nextHref property
        this.paginate = true;

		// get the limit and offset (comes from the querystring)
        var limit = this.pagination.limit;
        var offset = this.pagination.offset;
    
	    //fake data
        var items = [];
        for (var i = 0; i < 2000; i++) {
            if (i >= offset && i < offset + limit) {
                items.push(i);
            }
        }
    
        this.body = items;
    });
    
    
    app.listen(3000);

which produces

    {
	    data: [
		    285,
		    286,
		    287,
		    288,
		    289
	    ],
	    nextHref: "http://localhost:3000/?limit=5&offset=285"
    }
