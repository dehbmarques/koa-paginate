var querystring = require('querystring'),
    extend = require('extend');

module.exports = {
    middleware: middleware,
    MaxLimitError: MaxLimitError
};

function MaxLimitError (maxLimit, limit) {
    Error.call(this);
    Error.captureStackTrace(this, MaxLimitError);
    this.maxLimit = maxLimit;
    this.limit = limit;
}

function middleware (_opts) {

    var opts = extend(false, {
        defaultLimit: 20,
        maxLimit: 200
    }, _opts);

    return function* (next) {
        var query = this.request.query;
        var limit = parseInt(query.limit);
        var offset = parseInt(query.offset);
        limit = isNaN(limit) ? opts.defaultLimit : limit;
        offset = isNaN(offset) ? 0 : offset + limit;

        if (limit > opts.maxLimit) {
            throw new MaxLimitError(opts.maxLimit, limit);
        }

        this.pagination = {
            limit: limit,
            offset: offset,
            paginate: false
        };

        Object.defineProperty(this, 'paginate', {
            get: function() { return this.pagination.paginate; },
            set: function(p) { this.pagination.paginate = p; }
        });

        yield next;

        if (this.pagination.paginate) {

            query.limit = this.pagination.limit;
            query.offset = this.pagination.offset;

            var next_href = this.request.protocol + '://' + this.request.host + this.request.path + '?' + querystring.stringify(query);

            this.body = {
                items: this.body,
                next_href: next_href
            };
        }
    };
}