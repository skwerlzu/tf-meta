(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof exports !== "undefined") {
    factory();
  } else {
    var mod = {
      exports: {}
    };
    factory();
    global.source = mod.exports;
  }
})(this, function () {
  "use strict";

  //import { Meteor } from 'meteor/meteor'

  /*
   * source.js
   *
   * By TrakFind llc, http://trakfind.com
   *
   * License : https://github.com/skwerlzu/TF_META/blob/master/LICENSE.md (MIT)
   * source  : https://github.com/skwerlzu/TF_META
   */
  // The one and only way of getting global scope in all environments
  // https://stackoverflow.com/q/3277182/1008999
  var _global = typeof window === 'object' && window.window === window ? window : typeof self === 'object' && self.self === self ? self : typeof global === 'object' && global.global === global ? global : void 0;

  var tf = {}; //console.log('TF_META')
  //console.log('isCordova: ' + Meteor.isCordova)

  tf.test = (url) => {
    console.log('trakfind-meta', 'trakfind-meta test method fired');
	  return new Promise((resolve, reject) => {
	  Meteor.call('meta.test', url, (err,res) => {
          if (err) {
            reject(err)
          } else {
			  resolve(res)
          }
        })
	  })
  };
	
	tf.scrape = (url) => {
    console.log('trakfind-meta', 'trakfind-meta test method fired');
	  return new Promise((resolve, reject) => {
	  Meteor.call('meta.test', url, (err,res) => {
          if (err) {
            reject(err)
          } else {
			  resolve(res)
          }
        })
	  })
  };

  _global.tf = tf;

  if (typeof module !== 'undefined') {
    module.exports = tf;
  }
});
