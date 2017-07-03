define([
    'require', 
    'core/jsonrpc/request/simple',
    'core/jsonrpc/response/error.http', 'core/jsonrpc/response/batch'
] , function (
    require, 
    JsonRpcClientRequestSimple, 
    JsonRPCClientResponseErrorHttp, JsonRPCClientResponseBatch
) {

    var
        __availableStatuses = ['preparing', 'sending', 'failed', 'succeeded'],
        __defaultStatus     = __availableStatuses[0];


    function JsonRpcBatchWorkflowError(message) {
        this.name    = 'WorkflowError';
        this.message = message;
    }
    JsonRpcBatchWorkflowError.prototype             = Error.prototype;
    JsonRpcBatchWorkflowError.prototype.constructor = JsonRpcBatchWorkflowError;

    function JsonRpcBatchEmptyError(message) {
        this.name    = 'EmptyError';
        this.message = message;
    }
    JsonRpcBatchEmptyError.prototype             = Error.prototype;
    JsonRpcBatchEmptyError.prototype.constructor = JsonRpcBatchEmptyError;

    function JsonRpcBatchInvalidTypeError(message) {
        this.name    = 'InvalidType';
        this.message = message;
    }
    JsonRpcBatchInvalidTypeError.prototype             = Error.prototype;
    JsonRpcBatchInvalidTypeError.prototype.constructor = JsonRpcBatchInvalidTypeError;


    /**
     * JsonRpc 2.0 client request constructor.
     *
     */
    function JsonRpcClientRequestBatch() {
        this._requestId = null;
        this._requests  = [];

        this.attempt    = 0;
    }
    // Apply constructor.
    JsonRpcClientRequestBatch.prototype.constructor = JsonRpcClientRequestBatch;

    /**
     * Instance properties.
     */
    Object.defineProperties(JsonRpcClientRequestBatch.prototype, {
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
                        throw new JsonRpcBatchWorkflowError('Already in "sending" status.');
                    }
                    if (this.status !== 'preparing' && this.status !== 'failed') {
                        throw new JsonRpcBatchWorkflowError('Can\'t switch status from "this.status" to "sending".');
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
        }
    });

    /**
     * Send the request.
     *
     * @public
     * @returns {JsonRpcClientResponseBatch}
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
    JsonRpcClientRequestBatch.prototype.send = function(sender) {
        if (!this._requests || this._requests.constructor !== Array || this._requests.length < 1) {
            throw new JsonRpcBatchEmptyError('What\'s the point to send an empty batch?');
        }

        this.status = 'sending';
        this.attempt++;

        var
            self    = this,
            promise = new Promise(function(resolve, reject) {
                var sendedInfos = sender.send(self.format());
                self._requestId = sendedInfos.id;

                sendedInfos.promise.then(function(response) {
                    self.status = 'succeeded';

                    var response = JsonRPCClientResponseBatch.parse(self, response.raw);

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
     * @returns {Array}
     */
    JsonRpcClientRequestBatch.prototype.format = function() {
        var request = [];

        for (var i=0; i<this._requests.length; i++) {
            if (this._requests[i].constructor !== JsonRpcClientRequestSimple) {
                throw new JsonRpcBatchInvalidTypeError('Request n°' + i + ' isnt\'t a JsonRpcClientRequestSimple object.');
            }

            request.push(this._requests[i].format());
        }

        return request;
    }

    /**
     * Add a request to the batch.
     *
     * @public
     * @param   {JsonRpcClientRequestSimple}    method      The method to call.
     * @returns {Self}
     */
    JsonRpcClientRequestBatch.prototype.add = function(request) {
        if (!request || request.constructor !== JsonRpcClientRequestSimple) {
            throw new JsonRpcBatchInvalidTypeError('Request isnt\'t a JsonRpcClientRequestSimple object.');
        }

        this._requests.push(request);

        return this;
    }

    /**
     * Add a request to the batch.
     *
     * @public
     * @param   {String}        method              The method to call.
     * @param   {Object|Array}  methodParameters    (optional) The parameters to apply.
     * @returns {Self}
     */
    JsonRpcClientRequestBatch.prototype.addRequest = function(method, methodParameters) {
        var _request = new JsonRpcClientRequestSimple(method, methodParameters);

        _request.type = 'request';
        this.add(_request);

        return this;
    }

    /**
     * Add a notification to the batch.
     *
     * @public
     * @param   {String}        method              The method to call.
     * @param   {Object|Array}  methodParameters    (optional) The parameters to apply.
     * @returns {Self}
     */
    JsonRpcClientRequestBatch.prototype.addNotification = function(method, methodParameters) {
        var _request = new JsonRpcClientRequestSimple(method, methodParameters);

        _request.type = 'notification';
        this.add(_request);

        return this;
    }


    return JsonRpcClientRequestBatch;
});