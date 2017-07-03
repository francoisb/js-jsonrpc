define([
    'require'
] , function (
    require
) {

    /**
     * JsonRpc simple response constructor.
     *
     * @param   {Object}        request             The origin request.
     * @param   {Object}        result              The result.
     *
     */
    function JsonRpcClientResponseSimple(request, result) {
        this.request = request;
        this.result  = result;

    }
    // Apply constructor.
    JsonRpcClientResponseSimple.prototype.constructor = JsonRpcClientResponseSimple;

    /**
     * Instance properties.
     */
    Object.defineProperties(JsonRpcClientResponseSimple.prototype, {
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
     * JsonRpc simple error response constructor.
     *
     * @param   {Object}        request             The origin request.
     * @param   {Mixed}         raw                 The raw response from server.
     * @param   {Number}        code                The JsonRpc error code.
     * @param   {String}        status              The JsonRpc status.
     * @param   {String}        error               The JsonRpc error message.
     *
     */
    function JsonRpcClientResponseSimpleError(request, raw, code, status, error) {
        this.request = request;
        this.raw     = raw;
        this.code    = code;
        this.status  = status;
        this.error   = error;
    }
    // Apply constructor.
    JsonRpcClientResponseSimpleError.prototype.constructor = JsonRpcClientResponseSimpleError;

    /**
     * Instance properties.
     */
    Object.defineProperties(JsonRpcClientResponseSimpleError.prototype, {
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
                message += 'An error occured: ' + this.error;

                return message;
            }
        }
    });

    /**
     * Override native toString function.
     *
     * @returns {String}
     */
    JsonRpcClientResponseSimpleError.prototype.toString = function() {
        return this.message;
    };


    return {
        parse: function(request, raw) {
            var
                status,
                data = raw;

            if (request.isNotif === true && typeof data === 'string' && data.length === 0) {
                return new JsonRpcClientResponseSimple(request, null);
            }

            if (typeof data !== 'object') {
                try {
                    data = JSON.parse(data);
                } catch (error) {
                    return new JsonRpcClientResponseSimpleError(request, raw, -32700, 'Parse error', 'Invalid JSON was received.');
                }
            }

            if (data['jsonrpc'] !== '2.0') {
                return new JsonRpcClientResponseSimpleError(request, raw, -32600, 'Invalid response', 'The JSON received is not a valid response object.');
            }

            if (data['error']) {
                return new JsonRpcClientResponseSimpleError(request, raw, data['error']['code'], 'Error received', data['error']['message']);
            }

            if (data['id'] !== request.id) {
                return new JsonRpcClientResponseSimpleError(request, raw, -32600, 'Invalid response', 'Request id (#' + request.id +') doesn\'t match response id (#' + data['id'] +')');
            }

            return new JsonRpcClientResponseSimple(request, data['result'] || null);
        }
    };
});