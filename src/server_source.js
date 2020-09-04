import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import he from 'he'
export const Meta = new Mongo.Collection('meta');

Meteor.methods({

  'meta.test'(url = null){
	   
                var META = {
                            url: url
                        };
	   return new Promise((resolve, reject) => {
               HTTP.call("GET", url,
                      {},
                      (error, result) => {
                        if (result.statusCode === 200) {
                            var html = result.content;


                            // search for a <title>
                        var title_regex = /<title>(.*)<\/title>/gmi;
var match
                        while ((match = title_regex.exec(html)) !== null) {
                          if (match.index === title_regex.lastIndex) {
                            title_regex.lastIndex++;
                          }
                          META.title = match[1];
                        }


                        // search and parse all <meta>
                         var meta_tag_regex = /<meta.*?(?:name|property|http-equiv)=['"]([^'"]*?)['"][\w\W]*?content=['"]([^'"]*?)['"].*?>/gmi;

             

                        var tags = {
                          title: ['title', 'og:title', 'twitter:title'],
                          description: ['description', 'og:description', 'twitter:description'],
                          image: ['image', 'og:image', 'twitter:image'],
                          url: ['url', 'og:url', 'twitter:url']
                        };

                        while ((match = meta_tag_regex.exec(html)) !== null) {
                          if (match.index === meta_tag_regex.lastIndex) {
                            meta_tag_regex.lastIndex++;
                          }

                          for (var item in tags) {
                            tags[item].forEach((prop) => {

                              if (match[1] === prop) {

                                var property = tags[item][0];
                                var content = match[2];

                                console.log(property);
                                console.log(content);
                                // Only push content to our 'META' object if 'META' doesn't already
                                // contain content for that property.
                                if (!META[property]) {
                                  META[property] = he.decode(content);
                                }

                              }

                            });
                          }
                        }
                            
                        if(typeof cb != 'undefined' && cb != null){
                            cb(META)
                        }
							console.log(META)
                        resolve(META);
                    	return META;
                    }
                })
	   })
	  
  },
})