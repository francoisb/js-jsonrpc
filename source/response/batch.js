define([
    'require',
    'core/jsonrpc/response/simple'
] , function (
    require,
    JsonRPCClientResponseSimple
) {

    /**
     * JsonRpc batch response constructor.
     *
     * @param   {Object}        request             The origin request.
     * @param   {Array}         results             The results.
     *
     */
    function JsonRpcClientResponseBatch(request, results) {
        this.request = request;
        this.results = results;
    }
    // Apply constructor.
    JsonRpcClientResponseBatch.prototype.constructor = JsonRpcClientResponseBatch;

    /**
     * Instance properties.
     */
    Object.defineProperties(JsonRpcClientResponseBatch.prototype, {
        isError: {
            /**
             * Whether it's an error or not.
             *
             * @returns {Boolean}
             */
            get: function() {
                return false;
            }
        }
    });


    /**
     * JsonRpc batch error response constructor.
     *
     * @param   {Object}        request             The origin request.
     * @param   {Mixed}         raw                 The raw response from server.
     * @param   {Number}        code                The JsonRpc error code.
     * @param   {String}        status              The JsonRpc status.
     * @param   {String}        error               The JsonRpc error message.
     *
     */
    function JsonRpcClientResponseBatchError(request, raw, code, status, error) {
        this.request = request;
        this.raw     = raw;
        this.code    = code;
        this.status  = status;
        this.error   = error;
    }
    // Apply constructor.
    JsonRpcClientResponseBatchError.prototype.constructor = JsonRpcClientResponseBatchError;

    /**
     * Instance properties.
     */
    Object.defineProperties(JsonRpcClientResponseBatchError.prototype, {
        isError: {
            /**
             * Whether it's an error or not.
             *
             * @returns {Boolean}
             */
            get: function() {
                return true;
            }
        },
        message: {
            /**
             * Get formated message.
             *
             * @returns {String}
             */
            get: function() {
                var message = '';

                message  = 'JsonRPC request #' + this.request.id + ' failed (' + this.status + ').';
                message += "\n";
                message += 'An error "' + this.code + '" occured: ' + this.error;

                return message;
            }
        }
    });

    /**
     * Override native toString function.
     *
     * @returns {String}
     */
    JsonRpcClientResponseBatchError.prototype.toString = function() {
        return this.message;
    };


    return {
        parse: function(request, raw) {
            var
                i, status, response,
                responses = [],
                requests  = [],
                data      = raw;

            if (typeof data !== 'object') {
                try {
                    data = JSON.parse(data);
                } catch (error) {
                    return new JsonRpcClientResponseBatchError(request, raw, -32700, 'Parse error', 'Invalid JSON was received.');
                }
            }

            if (data.constructor !== Array) {
                if (data['error']) {
                    return new JsonRpcClientResponseBatchError(request, raw, data['error']['code'], 'Error', data['error']['message']);
                }
                return new JsonRpcClientResponseBatchError(request, raw, -32600, 'Invalid response', 'The JSON received is not a valid response object.');
            }

            for (i=0; i< this.request.length; i++) {
                if (this.request[i].isReq === true) {
                    requests.push(this.request[i]);
                }
            }

            if (requests.length !== data.length) {
                return new JsonRpcClientResponseBatchError(request, raw, -32600, 'Invalid response', 'Request(s) count (' + requests.length +') is not equal to response(s) count (' + data.length +').');
            }

            for (i=0; i< this.request.length; i++) {
                response = JsonRPCClientResponseSimple.parse(request.requests[i], data[i]);
                responses.push(response);
            }

            return new JsonRpcClientResponseBatch(request, responses);
        }
    };
});