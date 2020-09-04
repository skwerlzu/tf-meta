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
	
	tf.set = (data = null, cb = null) =>{
		
		data = {
			title: 'Test Meta',
			url: 'http://trakfind.com'
		}
		
		console.log('tf.set',document.getElementsByTagName("title"))
		var html = '';
    //document.querySelector("meta [property='og:title']").setAttribute('content', data.title);
    //title
	   if (document.getElementsByTagName("title").length){
		  document.getElementsByTagName('title')[0].innerHTML = data.title
	   }else{
		  html += '<title>'+data.title+'</title>'
	   }
		
		if (document.querySelectorAll("[property='og:title']").length){
		  document.querySelectorAll("[property='og:title']")[0].setAttribute('content',data.title)
	   }else{
		  html += '<meta property="og:title" content="'+data.title+'">'
	   } 
		
		 if (document.getElementsByName('title').length){
			 document.getElementsByName('title')[0].setAttribute('content',data.title)
		   }else{
			  html += '<meta name="title" content="'+data.title+'">'
		   }
		
		   if (document.getElementsByName('twitter:title').length){
			  document.getElementsByName('twitter:title')[0].setAttribute('content',data.title)
		   }else{
			  html += '<meta name="twitter:title" content="'+data.title+'">'
		   }
		
		//url
	   if (document.querySelectorAll("[property='og:url']").length){
		 document.querySelectorAll("[property='og:url']")[0].setAttribute('content',data.url)
	   }else{
		  html += '<meta property="og:url" content="'+data.url+'">'
	   } 
								   
								   //canoical
	   if (document.querySelectorAll('[rel="canonical"]').length){
		 document.querySelectorAll('[rel="canonical"]')[0].setAttribute('href',data.url)
	   }else{
		  html += '<link rel="canonical" href="'+data.url+'" />'
	   }
		   
		//description
	   if (document.querySelectorAll('[name="description"]').length){
		 document.querySelectorAll('[name="description"]')[0].setAttribute('content',data.description)
	   }else{
		  html += '<meta name="description" content="'+data.description+'">'
	   }
	   if (document.querySelectorAll('[itemprop="description"]').length){
		 document.querySelectorAll('[itemprop="description"]')[0].setAttribute('content',data.description)
	   }else{
		  html += '<meta itemprop="description" content="'+data.description+'">'
	   }
	   if (document.querySelectorAll('[property="og:description"]').length){
		 document.querySelectorAll('[property="og:description"]')[0].setAttribute('content',data.description)
	   }else{
		  html += '<meta property="og:description" content="'+data.description+'">'
	   }
	   if (document.querySelectorAll('[name="twitter:description"]').length){
		 document.querySelectorAll('[name="twitter:description"]')[0].setAttribute('content',data.description)
	   }else{
		  html += '<meta name="twitter:description" content="'+data.description+'">'
	   }   
		
		//Image
	   if (document.querySelectorAll('[itemprop="image"]').length){
		 document.querySelectorAll('[itemprop="image"]')[0].setAttribute('content',data.image)
	   }else{
		  html += '<meta itemprop="image" content="'+data.image+'">'
	   }
	   if (document.querySelectorAll('[property="og:image"]').length){
		 document.querySelectorAll('[property="og:image"]')[0].setAttribute('content',data.image)
	   }else{
		  html += '<meta property="og:image" content="'+data.image+'">'
	   }
	   if (document.querySelectorAll('[name="twitter:image"]').length){
		 document.querySelectorAll('[name="twitter:image"]')[0].setAttribute('content',data.image)
	   }else{
		  html += '<meta name="twitter:image" content="'+data.image+'">'
	   }
		
		//alternate image text
   if (document.querySelectorAll('[property="og:image:alt"]').length){
     document.querySelectorAll('[property="og:image:alt"]')[0].setAttribute('content',data.url)
   }else{
      html += '<meta property="og:image:alt" content="'+data.title+'">'
   }
   
   //meta type
   if (document.querySelectorAll('[property="og:type"]').length){
     document.querySelectorAll('[property="og:type"]')[0].setAttribute('content',data.url)
   }else{
      if(typeof data.type != 'undefined'){
         html += '<meta property="og:type" content="'+data.type+'">'
      }else{
         html += '<meta property="og:type" content="website">'
      }
    }

   //facebook app id
   if (!document.querySelectorAll('[property="fb:app_id"]').length){
      html += '<meta property="fb:app_id" content="1756445077816469">'
   } 
   
    document.querySelectorAll('head')[0].innerHTML = html + document.querySelectorAll('head')[0].innerHTML;
	
	if(cb != null){
		cb();
	}
	}

  _global.tf = tf;

  if (typeof module !== 'undefined') {
    module.exports = tf;
  }
});
