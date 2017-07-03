define([
    'require', 
    'core/jsonrpc/response/error.http', 'core/jsonrpc/response/simple'
] , function (
    require, 
    JsonRPCClientResponseErrorHttp, JsonRPCClientResponseSimple
) {

    var
        __index             = 0,
        __availableTypes    = ['request', 'notification'],
        __defaultType       = __availableTypes[0],
        __availableStatuses = ['preparing', 'sending', 'failed', 'succeeded'],
        __defaultStatus     = __availableStatuses[0];


    function JsonRpcRequestWorkflowError(message) {
        this.name    = 'WorkflowError';
        this.message = message;
    }
    JsonRpcRequestWorkflowError.prototype             = Error.prototype;
    JsonRpcRequestWorkflowError.prototype.constructor = JsonRpcRequestWorkflowError;

    function JsonRpcRequestInvalidTypeError(message) {
        this.name    = 'InvalidType';
        this.message = message;
    }
    JsonRpcRequestInvalidTypeError.prototype             = Error.prototype;
    JsonRpcRequestInvalidTypeError.prototype.constructor = JsonRpcRequestInvalidTypeError;


    /**
     * JsonRpc 2.0 client request constructor.
     *
     * @param   {String}        method              The method to call.
     * @param   {Object|Array}  methodParameters    (optional) The parameters to apply.
     *
     */
    function JsonRpcClientRequestSimple(method, methodParameters) {
        __index++;

        this._requestId       = null;

        this.id               = __index + '';
        this.attempt          = 0;
        this.method           = method;
        this.methodParameters = methodParameters || null;
    }
    // Apply constructor.
    JsonRpcClientRequestSimple.prototype.constructor = JsonRpcClientRequestSimple;

    /**
     * Instance properties.
     */
    Object.defineProperties(JsonRpcClientRequestSimple.prototype, {
        type: {
            /**
             * Get the request type.
             *
             * @returns {String}
             */
            get: function() {
                return this._type || __defaultType;
            },
            /**
             * Set the request type.
             *
             * @param   {String}        value               The request type.
             * @returns {Self}
             */
            set: function(value) {
                if (this.status !== __defaultStatus) {
                    throw new JsonRpcRequestWorkflowError('Unable to change request type when already sent.');
                }

                valid = false;
                for (var i=0; i<__availableTypes.length; i++) {
                    if (value === __availableTypes[i]) {
                        valid = true;
                        break;
                    }
                }

                if (!valid) {
                    value = __defaultType;
                }

                this._type = value;
                return self;
            }
        },
        isNotif: {
            /**
             * Whether the request is a notification or not.
             *
             * @returns {Boolean}
             */
            get: function() {
                return this.type === 'notification';
            }
        },
        isReq: {
            /**
             * Whether the request is a notification or not.
             *
             * @returns {Boolean}
             */
            get: function() {
                return this.type === 'request';
            }
        },
        status: {
            /**
             * Get the request status.
             *
             * @returns {String}
             */
            get: function() {
                if (this._requestId !== null) {
                    return 'sending';
                }
                return this._status || __defaultStatus;
            },
            /**
             * Set the request status.
             *
             * @param   {String}        value               The request status.
             * @returns {Self}
             */
            set: function(value) {
                if (value === 'sending') {
                    if (this.status === 'sending') {
                        throw new JsonRpcRequestWorkflowError('Already in "sending" status.');
                    }
                    if (this.status !== 'preparing' && this.status !== 'failed') {
                        throw new JsonRpcRequestWorkflowError('Can\'t switch status from "this.status" to "sending".');
                    }
                }

                valid = false;
                for (var i=0; i<__availableStatuses.length; i++) {
                    if (value === __availableStatuses[i]) {
                        valid = true;
                        break;
                    }
                }

                if (!valid) {
                    value = __defaultStatus;
                }

                this._status = value;
                return self;
            }
        },
        method: {
            /**
             * Get the request method.
             *
             * @returns {String}
             */
            get: function() {
                return this._method;
            },
            /**
             * Set the method.
             *
             * @param   {String}        value               The method.
             * @returns {Self}
             */
            set: function(value) {
                if (this.status !== __defaultStatus) {
                    throw new Error('Unable to change method when already sent.');
                }

                this._method = value;
                return self;
            }
        },
        methodParameters: {
            /**
             * Get the method's parameter.
             *
             * @returns {Array|Object|null}
             */
            get: function() {
                return this._methodParameters || null;
            },
            /**
             * Set the method's parameter.
             *
             * @param   {Array|Object|null}     value       The method's parameters.
             * @returns {Self}
             */
            set: function(value) {
                if (this.status !== __defaultStatus) {
                    throw new JsonRpcRequestWorkflowError('Unable to change method\'s parameters when already sent.');
                }

                if (value !== null) {
                    if (typeof value !== 'object' && value.constructor !== Array && value.constructor !== Object) {
                        throw new JsonRpcRequestInvalidTypeError('Invalid value for method\'s parameters.');
                    }
                }

                this._methodParameters = value;
                return self;
            }
        }
    });

    /**
     * Send the request.
     *
     * @public
     * @returns {JsonRpcClientResponseSimple}
     *
     * @example
        JsonRpcClientRequestObject.send()
            .then(
                function(response) {
                    console.log('DONE');
                },
                function(response) {
                    console.log('FAIL');
                }
            );
     */
    JsonRpcClientRequestSimple.prototype.send = function(sender) {
        this.status = 'sending';
        this.attempt++;

        var
            self    = this,
            promise = new Promise(function(resolve, reject) {
                var sendedInfos = sender.send(self.format());
                self._requestId = sendedInfos.id;

                sendedInfos.promise.then(function(response) {
                    self.status = 'succeeded';

                    var response = JsonRPCClientResponseSimple.parse(self, response.raw);

                    if (response.isError === false) {
                        resolve.call(undefined, response);
                    } else {
                        reject.call(undefined, response);
                    }
                });

                sendedInfos.promise.catch(function(response) {
                    self.status = 'failed';

                    var response = new JsonRPCClientResponseErrorHttp(self, response.status, response.code, response.error);

                    reject.call(undefined, response);
                });
            });

        return promise;
    }

    /**
     * Format the request.
     *
     * @public
     * @returns {Object}
     */
    JsonRpcClientRequestSimple.prototype.format = function() {
        var request = {
            'jsonrpc': '2.0',
            'method':  this.method
        };

        if (this.methodParameters !== null) {
            request['params'] = this.methodParameters
        }

        if (this.isReq === true) {
            request['id'] = this.id;
        }

        return request;
    }


    return JsonRpcClientRequestSimple;
});