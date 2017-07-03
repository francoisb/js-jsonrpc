define([
    'require', 'jquery'
] , function (
    require, jQuery
) {

    var
        __counter = 0,
        __jqxhrs  = {};

    function remove(id) {
        __jqxhrs[id] = null;
        delete __jqxhrs[id];
    }

    /**
     * JsonRpc 2.0 jquery sender constructor.
     *
     */
    function JsonRpcSenderJquery(url, logger) {
        this.url    = url;
        this.method = 'POST';
        this.logger = logger;
    }
    // Apply constructor.
    JsonRpcSenderJquery.prototype.constructor = JsonRpcSenderJquery;

    /**
     * run application.
     *
     * @public
     * @returns {Self}
     */
    JsonRpcSenderJquery.prototype.abort = function(id) {
        if (__jqxhrs && __jqxhrs[id]) {
            __jqxhrs[id].abort();
        }

        return this;
    };

    /**
     * run application.
     *
     * @public
     * @returns {Object}
     */
    JsonRpcSenderJquery.prototype.send = function(data) {
        var
            _id, _promise,
            _url    = this.url,
            _method = this.method;

        __counter++;
        _id = __counter;

        if (_url.indexOf('?') > -1) {
            _url +='&';
        } else {
            _url +='?';
        }
        _url += 'counter=' + _id;

        _promise = new Promise(function(_resolve, _reject) {
            __jqxhrs[_id] = jQuery.ajax(_url, {
                'cache':        false,
                'data':         JSON.stringify(data),
                'dataType':     'json',
                'type':         _method,
                'beforeSend':   function(jqXHR) {
                                    jqXHR.overrideMimeType('application/json; charset=UTF-8');
                                    jqXHR.setRequestHeader('content-type', 'application/json');
                                    jqXHR.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                                },
                'error':        function(jqXHR, textStatus, errorThrown) {
                                    remove(_id);
                                    _reject({status: textStatus, code: jqXHR.status, error: errorThrown});
                                },
                'success':      function(response, textStatus) {
                                    remove(_id);
                                    _resolve({status: textStatus, raw: response});
                                }
            });
        });

        return { 'id': _id, 'promise': _promise };
    };


    return JsonRpcSenderJquery;
});