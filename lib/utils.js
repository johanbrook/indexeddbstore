(function(root) {

  // Array#slice shortcut
  var slice = Array.prototype.slice;

  var Q = require("q"),
      URL = this.URL || this.webkitURL;

  // Private

  /**
  *  Generate pseudo-random string
  */
  function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  }

  // Public

  var Utils = {

    /**
     * General object extend method.
     *
     * @param  {Object} obj The object to extend
     * @return {Object...}  Objects with extending properties
     */
    extend: function(obj) {
      slice.call(arguments, 1).forEach(function(source) {
        if (source) {
          for (var prop in source) {
            obj[prop] = source[prop];
          }
        }
      });

      return obj;
    },

    /**
     * Generate a pseudo-random GUID.
     *
     * Ex: 343165fe-25cb-bb5b-4504-76c1995f971b
     *
     * @return {String} A GUID
     */
    guid: function() {
      return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    },

    /**
     * Takes a database connection with callbacks and returns
     * the corresponding promise.
     *
     * @param  {Request} connection The connection or request
                                      (**must** have `onerror` and `onsuccess` callbacks).
     * @param {Object} options      An object with success and error callbacks. Takes
     *                                two parameters: evt and the deferred object
     * @return {Promise}            The promise
     */
    toPromise: function(connection, options) {
      var defer = Q.defer();

      if(connection.onerror === undefined || connection.onsuccess === undefined) {
        throw new Error('Object must implement onerror and onsuccess methods');
      }

      connection.onerror = function(evt) {
        if(options && options.error) {
          options.error(evt, defer);
        }
        else {
          defer.reject(evt.target.error);
        }
      }

      connection.onsuccess = function(evt) {
        if(options && options.success) {
          options.success(evt, defer);
        }
        else {
          defer.resolve(evt.target.result);
        }
      }

      return defer.promise;
    }
  };

  module.exports = Utils;

})(window);
