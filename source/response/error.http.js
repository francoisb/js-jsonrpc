define([
    'require'
] , function (
    require
) {

    /**
     * JsonRpc http error response constructor.
     *
     * @param   {Object}        request             The origin request.
     * @param   {String}        status              The HTTP status.
     * @param   {String}        code                The HTTP error code.
     * @param   {String}        error               The HTTP error.
     *
     */
    function JsonRpcClientResponseErrorHttp(request, status, code, error) {
        this.request = request;
        this.status  = status;
        this.code    = code;
        this.error   = error;
    }
    // Apply constructor.
    JsonRpcClientResponseErrorHttp.prototype.constructor = JsonRpcClientResponseErrorHttp;

    /**
     * Instance properties.
     */
    Object.defineProperties(JsonRpcClientResponseErrorHttp.prototype, {
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
                message += 'An HTTP ' + this.code + ' error code received: ' + this.error;

                return message;
            }
        }
    });

    /**
     * Override native toString function.
     *
     * @returns {String}
     */
    JsonRpcClientResponseErrorHttp.prototype.toString = function() {
        return this.message;
    };


    return JsonRpcClientResponseErrorHttp;
});