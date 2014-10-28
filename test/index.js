'use strict';

var koa = require('koa'),
    _ = require('underscore'),
    http = require('http'),
    request = require('supertest'),
    paginate = require('../index');


describe('koa-paginate', function () {

    var app = koa();

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

    app.use(paginate.middleware({
        defaultLimit: 20,
        maxLimit: 50
    }));

    app.use(function* () {
        this.paginate = true;
        var pagination = this.pagination;
        this.body = _.range(pagination.offset, pagination.offset + pagination.limit);
    });


    it('should wrap data and return 20 first items', function (done) {

        request(http.createServer(app.callback()))
            .get('/')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                res.body.data.should.be.instanceof(Array).and.have.lengthOf(20);
                res.body.nextHref.should.be.instanceof(String);

                done();
            });
    });

    it('should wrap data and return items from 20 to 29', function (done) {

        request(http.createServer(app.callback()))
            .get('/?limit=10&offset=20')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                res.body.data.should.be.instanceof(Array).and.have.lengthOf(10);
                res.body.data[0].should.equal(20);
                res.body.data[9].should.equal(29);
                res.body.nextHref.should.be.instanceof(String);

                done();
            });
    });

    it('should nextHref querystring be status=ok&limit=10&offset=20', function (done) {

        request(http.createServer(app.callback()))
            .get('/?status=ok&limit=10&offset=10')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                res.body.nextHref.split('?')[1].should.be.equal('status=ok&limit=10&offset=20');

                done();
            });
    });

    it('should nextHref querystring be status=ok&nextNode=10', function (done) {

        var app = koa();
        app.use(paginate.middleware());

        app.use(function* () {
            this.paginate = true;
            this.pagination.nextPageParams = {
                nextNode: 10
            };
            this.body = _.range(10);
        });

        request(http.createServer(app.callback()))
            .get('/?status=ok')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                res.body.nextHref.split('?')[1].should.be.equal('status=ok&nextNode=10');

                done();
            });
    });

    it('should return 400 Bad Request', function (done) {
        request(http.createServer(app.callback()))
            .get('/?limit=60&offset=20')
            .expect(400)
            .end(done);
    });
});
