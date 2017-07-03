define([
    'require',
    'core/jsonrpc/request/simple', 'core/jsonrpc/request/batch'
] , function (
    require,
    JsonRPCClientRequestSimple, JsonRPCClientRequestBatch
) {

    /**
     * JsonRpc 2.0 client constructor.
     * Aim to to simplify library's usage with this request factory.
     *
     */
    function JsonRpcClient(sender) {
        this.sender = sender;
    }
    // Apply constructor.
    JsonRpcClient.prototype.constructor = JsonRpcClient;


    /**
     * Shortcut to send a request.
     *
     * @public
     * @param   {String}        method              The method to call.
     * @param   {Object|Array}  methodParameters    (optional) The parameters to apply.
     * @returns {Promise}
     */
    JsonRpcClient.prototype.ask = function(method, methodParameters) {
        var _request = this.request(method, methodParameters);

        return _request.send();
    }

    /**
     * Shortcut to send a notification.
     *
     * @public
     * @param   {String}        method              The method to call.
     * @param   {Object|Array}  methodParameters    (optional) The parameters to apply.
     * @returns {Promise}
     */
    JsonRpcClient.prototype.notify = function(method, methodParameters) {
        var _request = this.notification(method, methodParameters);

        return _request.send();
    }

    /**
     * Create a new request.
     *
     * @public
     * @param   {String}        method              (optional) The method to call.
     * @param   {Object|Array}  methodParameters    (optional) The parameters to apply.
     * @returns {JsonRPCClientRequestSimple}
     */
    JsonRpcClient.prototype.request = function(method, methodParameters) {
        var
            _request = new JsonRPCClientRequestSimple(method, methodParameters);
            _sender  = this.sender,
            _send    = _request.send;

        _request.type = 'request';
        _request.send = function() {
            return _send.call(_request, _sender);
        }

        return _request;
    }

    /**
     * Create a new notification.
     *
     * @public
     * @param   {String}        method              The method to call.
     * @param   {Object|Array}  methodParameters    (optional) The parameters to apply.
     * @returns {JsonRPCClientRequestSimple}
     */
    JsonRpcClient.prototype.notification = function(method, methodParameters) {
        var _request = this.request(method, methodParameters);

        _request.type = 'notification';

        return _request;
    }

    

    /**
     * Create a new batch request.
     *
     * @public
     * @returns {JsonRPCClientRequestBatch}
     */
    JsonRpcClient.prototype.batch = function() {
        var
            _batch  = new JsonRPCClientRequestBatch(),
            _sender = this.sender,
            _send   = _batch.send;

        _batch.send = function() {
            return _send.call(_batch, _sender);
        }

        return _batch;
    }


    return JsonRpcClient;
});