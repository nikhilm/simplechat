/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

function debug(s) {
  console.log("-*- model.js: " + s + "\n");
}

const MAX_MESSAGES=50;

var IMDB = window.IMDB = function() {
  debug("IMDB()");
}

IMDB.prototype = {
  init: function() {
    var deferred = new jQuery.Deferred();
    var request = indexedDB.open('IMDB', 1);
    var self = this;
    request.onsuccess = function() {
      self._db = request.result;
      deferred.resolve();
    }
    request.onerror = function() {
      debug("Not allowed!");
      deferred.reject(request.errorCode);
    }
    request.onupgradeneeded = this._createDBStructure.bind(this);
    return deferred.promise();
  },

  _createDBStructure: function(event) {
    var db = event.target.result;

    var objectStore = db.createObjectStore('messages', { keyPath: 'id' });
  },

  /* Messages should be [{'id': ..., 'nick': ..., 'text': ...}] */
  add: function(messages) {
    debug("add()");

    var deferred = new jQuery.Deferred();
    var txn = this._db.transaction('messages', 'readwrite');
    txn.oncomplete = deferred.resolve.bind(deferred);
    txn.onerror = deferred.reject.bind(deferred);

    var store = txn.objectStore('messages');

    var lastVersion = 0;
    messages.forEach(function(message) {
      store.add(message);
      lastVersion = message.id;
    });

    var delCursor = store.openCursor(IDBKeyRange.upperBound(lastVersion - MAX_MESSAGES), "prev");
    delCursor.onsuccess = function(e) {
      item = e.target.result;
      if (item) {
        item.delete();
        item.continue();
      }
    }
    return deferred.promise();
  },

  // from is exclusive
  messages: function(fromId) {
    debug("messages() " + fromId);

    var deferred = new jQuery.Deferred();
    var store = this._db.transaction('messages').objectStore('messages');

    var results = [];
    store.openCursor(IDBKeyRange.lowerBound(fromId, true /* open */)).onsuccess = function(event) {
      var cursor = event.target.result;
      debug(cursor);
      if (cursor) {
        results.push(cursor.value);
        debug(cursor.value.id);
        cursor.continue();
        return;
      }
      debug("done");
      deferred.resolve(results);
    }
    return deferred.promise();
  },

  latest: function() {
    debug("latest()");
    var deferred = new jQuery.Deferred();
    var store = this._db.transaction('messages').objectStore('messages');
    var req = store.openCursor(null, "prev");
    req.onsuccess = function(event) {
      var cursor = event.target.result;
      if (!cursor) {
        deferred.resolve(0);
        return;
      }
      debug("Max " + cursor.key);
      deferred.resolve(cursor.key);
    }
    req.onerror = function() {
        debug("ERR");
      deferred.reject();
    }
    return deferred.promise();
  }
};
