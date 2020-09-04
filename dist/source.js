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
var _global = typeof window === 'object' && window.window === window ?
    window : typeof self === 'object' && self.self === self ?
    self : typeof global === 'object' && global.global === global ?
    global :
    this

var ac = {}

//console.log('TF_META')
//console.log('isCordova: ' + Meteor.isCordova)


ac.test = () => {
   //console.log(Meteor.isCordova)
   //console.log(Vue)
}


ac.darkColorGen = () => {
    var letters = '012345678'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.round(Math.random() * 8)];
    }
    return color;
}

ac.lightColorGen = () => {
    var letters = 'BCDEF'.split('');
                var color = '#';
                for (var i = 0; i < 6; i++ ) {
                    color += letters[Math.floor(Math.random() * letters.length)];
                }
                return color;
}

ac.hexToRGB = (hex) => {
   if(hex.length != 6){
        throw "Only six-digit hex colors are allowed.";
    }

    var aRgbHex = hex.match(/.{1,2}/g);
    var aRgb = parseInt(aRgbHex[0], 16) + ',' + parseInt(aRgbHex[1], 16) + ',' + parseInt(aRgbHex[2], 16)
    return aRgb;
}

ac.rgbToHex = (rgb) => {
    // Choose correct separator
  let sep = rgb.indexOf(",") > -1 ? "," : " ";
  // Turn "rgb(r,g,b)" into [r,g,b]
  rgb = rgb.substr(4).split(")")[0].split(sep);

  let r = (+rgb[0]).toString(16),
      g = (+rgb[1]).toString(16),
      b = (+rgb[2]).toString(16);

  if (r.length == 1)
    r = "0" + r;
  if (g.length == 1)
    g = "0" + g;
  if (b.length == 1)
    b = "0" + b;

  return "#" + r + g + b;
}

ac.b64toBlob = (b64_data, file_name, slice_size, cb = null) => {
        //console.log('b64toblob start')
        if (Object.prototype.toString.call(slice_size) == '[object Function]') {
            //console.log('slice size is function')
            cb = slice_size;
            slice_size = 512
        }
        slice_size = slice_size || 512;

        if (!file_name) {
            //file_name should include extension Example: test.pdf
            var message = 'Base64 conversion requires a file name to upload'
            console.error('Base64 conversion error', message)
            if (cb) {
                cb({
                    error: true,
                    message: message
                })
                return false
            }
        } else {
            var ext = file_name.split(".")
            ext = ext.pop()
            var content_type = ac.mime_types[ext]
            if (!content_type) {
                var message = 'Unrecognized File Type'
                console.error('S3 upload error', message)
                if (cb) {
                    cb({
                        error: true,
                        message: message
                    })
                    return false
                }
            }
            var file_type = content_type.split("/")[0]
        }

        var byteCharacters = atob(b64_data);
        var byte_arrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += slice_size) {
            var slice = byteCharacters.slice(offset, offset + slice_size);

            var byte_numbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byte_numbers[i] = slice.charCodeAt(i);
            }

            var byte_array = new Uint8Array(byte_numbers);

            byte_arrays.push(byte_array);
        }

        var blob = new Blob(byte_arrays, {
            type: content_type,
            lastModified: new Date()
        });
        blob.name = file_name
        //console.log('blob', blob)

        if (cb != null) {
            //console.log('Callback is a function')
            cb(blob)
        }

        //console.log('end b64toblob')
        return blob;
    }

/*
Upload function is built to work specifically with AWS S3
See WebApp or Cordova examples in the developer pages


This uses the AWS settings within the settings.json file

"public" : {
     "amazon_identity" : "us-east-1:9e2c7006-07aa-4bf2-82b7-8d8d4b77191b",
    "amazon_bucket" : "trakfinddevtesting",
    "amazon_region" : "us-east-1"
  },
  "private":{
  	"trakfind_npm" : {
		"size_limit" : 5 //size limit in mb
	}
  }


BEGIN S3 UPLOAD --------------------------------------------------------------------
*/
ac.upload = (file, path = '', settings = null, cb = null) => {

	
	
    var S3 = require('aws-sdk/clients/s3');
    var AWS = require('aws-sdk/global');

    //if path is the callback set cb to proper method
    //console.log('S# Global Called')
    //console.log(file)
    // //console.log(path)
    // //console.log(cb)

    if (Object.prototype.toString.call(path) == '[object Function]') {
        cb = path;
        path = ''
    }
	
	
	 if (Object.prototype.toString.call(settings) == '[object Function]') {
        cb = settings;
        try{
				settings = Meteor.settings.public.trakfind_npm
			}catch(err){
				console.error('trakfind-meta',err)
			}
    }else{
		if(!settings){
			try{
				settings = Meteor.settings.public.trakfind_npm
			}catch(err){
				console.error('trakfind-meta',err)
			}
			
		}
	}

	
    //cb is called on http updates
    if (!file) {
        var message = 'S3 upload requires a file(s) to upload'
        console.error('S3 upload error', message)

        if (cb) {
            cb({
                name: file.name,
                error: true,
                message: message
            })
            return false
        }


    }

	//run through settings
	if(settings){
		if(settings.size_limit){
			//check file size against set limit
			//console.log('trakfind-meta: file_size', file, settings)
			let f_size = file.size / (1024*1024)
			if(f_size > settings.size_limit ){ //settings.size_limit
				 if (cb) {
					cb({
						name: file.name,
						error: true,
						message: file.name + ' size of '+f_size.toFixed(1)+ 'mb is larger than '+settings.size_limit+'mb'
					})
					return false
				}
			}
		}
	}
	
	var content_type = null
	
    if (!file.name) {
        //file_name should include extension Example: test.pdf
        var message = 'S3 upload requires a file name to upload'
        console.error('S3 upload error', message)
        if (cb) {
            cb({
                name: file.name,
                error: true,
                message: message
            })
            return false
        }
    } else {
        var ext = file.name.split(".")
        ext = ext.pop()
        content_type = ac.mime_types[ext]
        if (!content_type) {
            var message = 'Unrecognized File Type'
            console.error('S3 upload error', message)
            if (cb) {
                cb({
                    name: file.name,
                    error: true,
                    message: message
                })
                return false
            }
        }
        var file_type = content_type.split("/")[0]
    }



    //set the proper file type data

    var bucket_name = Meteor.settings.public.amazon_bucket;

    var bucketRegion = Meteor.settings.public.amazon_region;

    AWS.config.update({
        region: bucketRegion,
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: Meteor.settings.public.amazon_identity
        })
    });

    var s3 = new AWS.S3({
        apiVersion: '2006-03-01',
        params: {
            Bucket: bucket_name
        }
    });


	
	var file_size = 0;
    s3.upload({
        Key: path + file.name,
        Body: file,
        unique_name: false,
        ContentType: content_type,
        ACL: 'public-read'
    }, {
        partSize: 10 * 1024 * 1024,
        queueSize: 1
    }, (err, data) => {
        if (err) {
            console.error('S3 Upload error', err)
            cb({
                error: true,
                message: err
            })
        } else {
            //console.log(data)
            data.progress = 100
            data.file_type = file_type
            data.ext = ext
			data.mime_type = content_type
			data.file_size = file_size
            data.name = file.name
            data.complete = true
			data.settings = settings
            cb(data)
        }
    }).on('httpUploadProgress', (evt) => {
		file_size = evt.loaded
        var return_data = {
            name: file.name,
            event: evt,
            progress: evt.loaded / evt.total * 100,
			file_size: evt.loaded
        }
        cb(return_data)

    });
}
//End Upload

/*
Download methods 'saveAs'
BEGIN DOWNLOAD SAVEAS -----------------------------------------------------------------------------
*/

function bom(blob, opts) {
    if (typeof opts === 'undefined') opts = {
        autoBom: false
    }
    else if (typeof opts !== 'object') {
        console.warn('Deprecated: Expected third argument to be a object')
        opts = {
            autoBom: !opts
        }
    }

    // prepend BOM for UTF-8 XML and text/* types (including HTML)
    // note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
    if (opts.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
        return new Blob([String.fromCharCode(0xFEFF), blob], {
            type: blob.type
        })
    }
    return blob
}

function download(url, name, opts) {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.responseType = 'blob'
    xhr.onload = function() {
        ac.saveAs(xhr.response, name, opts)
    }
    xhr.onerror = function() {
        console.error('could not download file')
    }
    xhr.send()
}

function corsEnabled(url) {
    var xhr = new XMLHttpRequest()
    // use sync to avoid popup blocker
    xhr.open('HEAD', url, false)
    try {
        xhr.send()
    } catch (e) {}
    return xhr.status >= 200 && xhr.status <= 299
}

// `a.click()` doesn't work for all browsers (#465)
function click(node) {
    try {
        node.dispatchEvent(new MouseEvent('click'))
    } catch (e) {
        var evt = document.createEvent('MouseEvents')
        evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80,
            20, false, false, false, false, 0, null)
        node.dispatchEvent(evt)
    }
}



ac.saveAs = function() {
    //console.log('trakfind-meta Initiating....')
    return false
};

if (Meteor.isCordova) {

    //console.log('trakfind-meta: Device Ready')
    //console.log(cordova.file);


    //If cordova switch to native file transfering and local storage
    //required: cordova file plugin and cordova openfile2 plugin
    ac.saveAs = function saveAs(url, file_name = null, opts = null, cb = null) {

        try {
            if (!resolveLocalFileSystemURL) {
                console.error('TF_META Downloader requires the cordova-plugin-file plugin for native download and storage.')
                console.error('<a href="https://github.com/apache/cordova-plugin-file">https://github.com/apache/cordova-plugin-file</a>')
                console.error('meteor add cordova:cordova-plugin-file@6.0.2')
            }
        } catch (err) {
            console.error('resolveLocalFileSystemURL undefined')
            console.error('TF_META Downloader requires the cordova-plugin-file plugin for native download and storage.')
            console.error('<a href="https://github.com/apache/cordova-plugin-file">https://github.com/apache/cordova-plugin-file</a>')
            console.error('meteor add cordova:cordova-plugin-file@6.0.2')
        }

        var self = this;
        var storage_location = null
        //if function is passed in the file_name or opts var, set callback to the passed function
        if (Object.prototype.toString.call(file_name) == '[object Function]' || typeof file_name === "function") {
            cb = file_name
        }

        if (Object.prototype.toString.call(opts) == '[object Function]' || typeof opts === "function") {
            cb = opts
        }

        if (!file_name || !Object.prototype.toString.call(file_name) == '[object Function]' || !typeof file_name === "function") {
            file_name = url.split('/').pop()
        }

        if (!storage_location || Object.prototype.toString.call(storage_location) == '[object Function]' || typeof storage_location === "function") {
            switch (device.platform) {
                case "Android":
                    storage_location = cordova.file.externalDataDirectory;
                    break;

                case "iOS":
                    storage_location = cordova.file.documentsDirectory;
                    break;
            }
        }




        resolveLocalFileSystemURL(
            storage_location,
            function(fs) {
                //console.log('file system open: ' + fs.name);
                fs.getFile(file_name, {
                    create: true,
                    exclusive: false
                }, function(fileEntry) {

                    //console.log('fileEntry is file? ' + fileEntry.isFile.toString());
                    var oReq = new XMLHttpRequest();
                    // Make sure you add the domain name to the Content-Security-Policy <meta> element.
                    oReq.open("GET", url, true);
                    // Define how you want the XHR data to come back
                    oReq.responseType = "blob";

                    oReq.addEventListener('readystatechange', function(e) {
                        if (oReq.readyState == 2 && oReq.status == 200) {
                            //console.log('Download is being started')
                        } else if (oReq.readyState == 3) {
                            //console.log('Download is in progress')
                        } else if (oReq.readyState == 4) {
                            //console.log('Downloading has finished')

                            self.DL_OBJECT = oReq.response;


                            //console.log(oReq)

                            // Set href as a local object URL
                            self.DL_PATH = self.DL_OBJECT;

                            // Set name of download
                            //document.querySelector('#save-file').setAttribute('download', 'img.jpeg');
                            self.DL_NAME = file_name

                            var blob = oReq.response; // Note: not oReq.responseText
                            if (blob) {
                                fileEntry.createWriter(
                                    function(fileWriter) {
                                        fileWriter.write(blob);

                                        var mimeType = fileEntry.file.type
                                        //console.log('mimetype: ' + mimeType)
                                        fileWriter.onwriteend = function() {
                                            var url = fileEntry.toURL();



                                            if (!cordova.plugins.fileOpener2) {
                                                if (!resolveLocalFileSystemURL) {
                                                    console.warn('TF_META Downloader requires the cordova-plugin-file-opener2 plugin to automatically open files <a href="https://github.com/pwlin/cordova-plugin-file-opener2">https://github.com/pwlin/cordova-plugin-file-opener2</a>')
                                                    console.error('meteor add cordova:cordova-plugin-file-opener2@3.0.0')
                                                }
                                            } else {
                                                cordova.plugins.fileOpener2.open(url, mimeType, {
                                                    error: function error(err) {
                                                        console.error(err);
                                                        //alert("Unable to download");
                                                        cb({
                                                            file: fileEntry,
                                                            progress: 100,
                                                            file_name: file_name,
                                                            url: url,
                                                            storage_location: storage_location
                                                        })
                                                    },
                                                    success: function success() {
                                                        //console.log("success with opening the file");
                                                        try {
                                                            cb({
                                                                file: fileEntry,
                                                                progress: 100,
                                                                file_name: file_name,
                                                                url: url,
                                                                storage_location: storage_location
                                                            })
                                                        } catch (err) {
                                                            console.error(err)
                                                        }
                                                    }

                                                });
                                            }
                                        };

                                        fileWriter.onerror = function(err) {
                                            alert("Unable to download");
                                            console.error(err);
                                        };
                                    }
                                )

                                /*writeFile(reader.result, null);
                                 // Or read the data with a FileReader
                                 var reader = new FileReader();
                                 reader.addEventListener("loadend", function(e) {
                                    // reader.result contains the contents of blob as text
                                    //console.log('File Downloaded')
                                    //console.log(reader)
                                 });
                                
                                 //console.log(reader.readAsText(blob));
                                 */
                            } else console.error('we didnt get an XHR response!');

                            // Recommended : Revoke the object URL after some time to free up resources
                            // There is no way to find out whether user finished downloading
                            setTimeout(function() {
                                window.URL.revokeObjectURL(self.DL_OBJECT);
                            }, 60 * 1000);
                        }
                    });

                    oReq.addEventListener('progress', function(e) {
                        if (cb) {
                            cb({
                                progress: (e.loaded / e.total) * 100,
                                file_name: file_name,
                                url: url,
                                storage_location: storage_location
                            })
                        }
                    });


                    oReq.send(null);
                }, function(err) {
                    console.error('error getting file! ' + err);
                });
            },
            function(err) {
                console.error('error getting persistent fs! ' + err);
            });
    }




} else {

    ac.saveAs = _global.saveAs || (
        // probably in some web worker
        (typeof window !== 'object' || window !== _global) ?
        function saveAs() {
            /* noop */ }

        // Use download attribute first if possible (#193 Lumia mobile)
        :
        'download' in HTMLAnchorElement.prototype ?
        function saveAs(blob, file_name = null, opts = null, cb = null) {
            //if function is passed in the file_name or opts var, set callback to the passed function
            if (Object.prototype.toString.call(opts) == '[object Function]' || typeof opts === "function") {
                cb = opts
            }
            if (Object.prototype.toString.call(file_name) == '[object Function]' || typeof file_name === "function") {
                cb = file_name
            }



            var URL = _global.URL || _global.webkitURL
            var a = document.createElement('a')
            file_name = file_name || blob.name
            if (!file_name || !Object.prototype.toString.call(file_name) == '[object Function]' || !typeof file_name === "function") {
                try {
                    file_name = blob.split('/').pop()
                } catch (err) {
                    console.error(err)
                    file_name = 'download'
                }
            }

            a.download = file_name
            a.rel = 'noopener' // tabnabbing

            // TODO: detect chrome extensions & packaged apps
            // a.target = '_blank'

            if (typeof blob === 'string') {
                // Support regular links
                a.href = blob
                if (a.origin !== location.origin) {
                    corsEnabled(a.href) ?
                        download(blob, file_name, opts) :
                        click(a, a.target = '_blank')
                } else {
                    click(a)
                }
            } else {
                // Support blobs
                a.href = URL.createObjectURL(blob)
                setTimeout(function() {
                    URL.revokeObjectURL(a.href)
                }, 4E4) // 40s
                setTimeout(function() {
                    click(a)
                }, 0)
            }
        }

        // Use msSaveOrOpenBlob as a second approach
        :
        'msSaveOrOpenBlob' in navigator ?
        function saveAs(blob, file_name = null, opts = null, cb = null) {

            //if function is passed in the file_name or opts var, set callback to the passed function
            if (Object.prototype.toString.call(opts) == '[object Function]' || typeof opts === "function") {
                cb = opts
            }
            if (Object.prototype.toString.call(file_name) == '[object Function]' || typeof file_name === "function") {
                cb = file_name
            }

            file_name = file_name || blob.name
            if (!file_name || !Object.prototype.toString.call(file_name) == '[object Function]' || !typeof file_name === "function") {
                try {
                    file_name = blob.split('/').pop()
                } catch (err) {
                    console.error(err)
                    file_name = 'download'
                }
            }

            if (typeof blob === 'string') {
                if (corsEnabled(blob)) {
                    download(blob, file_name, opts)
                } else {
                    var a = document.createElement('a')
                    a.href = blob
                    a.target = '_blank'
                    setTimeout(function() {
                        click(a)
                    })
                }
            } else {
                navigator.msSaveOrOpenBlob(bom(blob, opts), file_name)
            }
        }

        // Fallback to using FileReader and a popup
        :
        function saveAs(blob, file_name, opts, popup) {
            // Open a popup immediately do go around popup blocker
            // Mostly only available on user interaction and the fileReader is async so...
            popup = popup || open('', '_blank')
            if (popup) {
                popup.document.title =
                    popup.document.body.innerText = 'downloading...'
            }

            //if function is passed in the file_name or opts var, set callback to the passed function
            if (Object.prototype.toString.call(opts) == '[object Function]' || typeof opts === "function") {
                cb = opts
            }
            if (Object.prototype.toString.call(file_name) == '[object Function]' || typeof file_name === "function") {
                cb = file_name
            }

            file_name = file_name || blob.name
            if (!file_name || !Object.prototype.toString.call(file_name) == '[object Function]' || !typeof file_name === "function") {
                try {
                    file_name = blob.split('/').pop()
                } catch (err) {
                    console.error(err)
                    file_name = 'download'
                }
            }

            if (typeof blob === 'string') return download(blob, file_name, opts)

            var force = blob.type === 'application/octet-stream'
            var isSafari = /constructor/i.test(_global.HTMLElement) || _global.safari
            var isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent)

            if ((isChromeIOS || (force && isSafari)) && typeof FileReader === 'object') {
                // Safari doesn't allow downloading of blob URLs
                var reader = new FileReader()
                reader.onloadend = function() {
                    var url = reader.result
                    url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, 'data:attachment/file;')
                    if (popup) popup.location.href = url
                    else location = url
                    popup = null // reverse-tabnabbing #460
                }
                reader.readAsDataURL(blob)
            } else {
                var URL = _global.URL || _global.webkitURL
                var url = URL.createObjectURL(blob)
                if (popup) popup.location = url
                else location.href = url
                popup = null // reverse-tabnabbing #460
                setTimeout(function() {
                    URL.revokeObjectURL(url)
                }, 4E4) // 40s
            }
        }
    )
}

//--------------------- END DOWNLOAD SAVAS ---------------------


/* Global Data
This is a storage of standard data that may be needed in various apps
*/

ac.states = [
   {
    abreviation: "AL",
    full: "Alabama"
}, {
    abreviation: "AK",
    full: "Alaska"
}, {
    abreviation: "AS",
    full: "American Samoa"
}, {
    abreviation: "AZ",
    full: "Arizona"
}, {
    abreviation: "AR",
    full: "Arkansas"
}, {
    abreviation: "CA",
    full: "California"
}, {
    abreviation: "CO",
    full: "Colorado"
}, {
    abreviation: "CT",
    full: "Connecticut"
}, {
    abreviation: "DE",
    full: "Delaware"
}, {
    abreviation: "DC",
    full: "District Of Columbia"
}, {
    abreviation: "FM",
    full: "Federated States Of Micronesia"
}, {
    abreviation: "FL",
    full: "Florida"
}, {
    abreviation: "GA",
    full: "Georgia"
}, {
    abreviation: "GU",
    full: "Guam"
}, {
    abreviation: "HI",
    full: "Hawaii"
}, {
    abreviation: "ID",
    full: "Idaho"
}, {
    abreviation: "IL",
    full: "Illinois"
}, {
    abreviation: "IN",
    full: "Indiana"
}, {
    abreviation: "IA",
    full: "Iowa"
}, {
    abreviation: "KS",
    full: "Kansas"
}, {
    abreviation: "KY",
    full: "Kentucky"
}, {
    abreviation: "LA",
    full: "Louisiana"
}, {
    abreviation: "ME",
    full: "Maine"
}, {
    abreviation: "MH",
    full: "Marshall Islands"
}, {
    abreviation: "MD",
    full: "Maryland"
}, {
    abreviation: "MA",
    full: "Massachusetts"
}, {
    abreviation: "MI",
    full: "Michigan"
}, {
    abreviation: "MN",
    full: "Minnesota"
}, {
    abreviation: "MS",
    full: "Mississippi"
}, {
    abreviation: "MO",
    full: "Missouri"
}, {
    abreviation: "MT",
    full: "Montana"
}, {
    abreviation: "NE",
    full: "Nebraska"
}, {
    abreviation: "NV",
    full: "Nevada"
}, {
    abreviation: "NH",
    full: "New Hampshire"
}, {
    abreviation: "NJ",
    full: "New Jersey"
}, {
    abreviation: "NM",
    full: "New Mexico"
}, {
    abreviation: "NY",
    full: "New York"
}, {
    abreviation: "NC",
    full: "North Carolina"
}, {
    abreviation: "ND",
    full: "North Dakota"
}, {
    abreviation: "MP",
    full: "Northern Mariana Islands"
}, {
    abreviation: "OH",
    full: "Ohio"
}, {
    abreviation: "OK",
    full: "Oklahoma"
}, {
    abreviation: "OR",
    full: "Oregon"
}, {
    abreviation: "PW",
    full: "Palau"
}, {
    abreviation: "PA",
    full: "Pennsylvania"
}, {
    abreviation: "PR",
    full: "Puerto Rico"
}, {
    abreviation: "RI",
    full: "Rhode Island"
}, {
    abreviation: "SC",
    full: "South Carolina"
}, {
    abreviation: "SD",
    full: "South Dakota"
}, {
    abreviation: "TN",
    full: "Tennessee"
}, {
    abreviation: "TX",
    full: "Texas"
}, {
    abreviation: "UT",
    full: "Utah"
}, {
    abreviation: "VT",
    full: "Vermont"
}, {
    abreviation: "VI",
    full: "Virgin Islands"
}, {
    abreviation: "VA",
    full: "Virginia"
}, {
    abreviation: "WA",
    full: "Washington"
}, {
    abreviation: "WV",
    full: "West Virginia"
}, {
    abreviation: "WI",
    full: "Wisconsin"
}, {
    abreviation: "WY",
    full: "Wyoming"
}
]

ac.mime_types = {
    "323": "text/h323",
    "3g2": "video/3gpp2",
    "3gp": "video/3gpp",
    "3gp2": "video/3gpp2",
    "3gpp": "video/3gpp",
    "7z": "application/x-7z-compressed",
    "aa": "audio/audible",
    "AAC": "audio/aac",
    "aaf": "application/octet-stream",
    "aax": "audio/vnd.audible.aax",
    "ac3": "audio/ac3",
    "aca": "application/octet-stream",
    "accda": "application/msaccess.addin",
    "accdb": "application/msaccess",
    "accdc": "application/msaccess.cab",
    "accde": "application/msaccess",
    "accdr": "application/msaccess.runtime",
    "accdt": "application/msaccess",
    "accdw": "application/msaccess.webapplication",
    "accft": "application/msaccess.ftemplate",
    "acx": "application/internet-property-stream",
    "AddIn": "text/xml",
    "ade": "application/msaccess",
    "adobebridge": "application/x-bridge-url",
    "adp": "application/msaccess",
    "ADT": "audio/vnd.dlna.adts",
    "ADTS": "audio/aac",
    "afm": "application/octet-stream",
    "ai": "application/postscript",
    "aif": "audio/x-aiff",
    "aifc": "audio/aiff",
    "aiff": "audio/aiff",
    "air": "application/vnd.adobe.air-application-installer-package+zip",
    "amc": "application/x-mpeg",
    "application": "application/x-ms-application",
    "art": "image/x-jg",
    "asa": "application/xml",
    "asax": "application/xml",
    "ascx": "application/xml",
    "asd": "application/octet-stream",
    "asf": "video/x-ms-asf",
    "ashx": "application/xml",
    "asi": "application/octet-stream",
    "asm": "text/plain",
    "asmx": "application/xml",
    "aspx": "application/xml",
    "asr": "video/x-ms-asf",
    "asx": "video/x-ms-asf",
    "atom": "application/atom+xml",
    "au": "audio/basic",
    "avi": "video/x-msvideo",
    "axs": "application/olescript",
    "bas": "text/plain",
    "bcpio": "application/x-bcpio",
    "bin": "application/octet-stream",
    "bmp": "image/bmp",
    "c": "text/plain",
    "cab": "application/octet-stream",
    "caf": "audio/x-caf",
    "calx": "application/vnd.ms-office.calx",
    "cat": "application/vnd.ms-pki.seccat",
    "cc": "text/plain",
    "cd": "text/plain",
    "cdda": "audio/aiff",
    "cdf": "application/x-cdf",
    "cer": "application/x-x509-ca-cert",
    "chm": "application/octet-stream",
    "class": "application/x-java-applet",
    "clp": "application/x-msclip",
    "cmx": "image/x-cmx",
    "cnf": "text/plain",
    "cod": "image/cis-cod",
    "config": "application/xml",
    "contact": "text/x-ms-contact",
    "coverage": "application/xml",
    "cpio": "application/x-cpio",
    "cpp": "text/plain",
    "crd": "application/x-mscardfile",
    "crl": "application/pkix-crl",
    "crt": "application/x-x509-ca-cert",
    "cs": "text/plain",
    "csdproj": "text/plain",
    "csh": "application/x-csh",
    "csproj": "text/plain",
    "css": "text/css",
    "csv": "text/csv",
    "cur": "application/octet-stream",
    "cxx": "text/plain",
    "dat": "application/octet-stream",
    "datasource": "application/xml",
    "dbproj": "text/plain",
    "dcr": "application/x-director",
    "def": "text/plain",
    "deploy": "application/octet-stream",
    "der": "application/x-x509-ca-cert",
    "dgml": "application/xml",
    "dib": "image/bmp",
    "dif": "video/x-dv",
    "dir": "application/x-director",
    "disco": "text/xml",
    "dll": "application/x-msdownload",
    "dll.config": "text/xml",
    "dlm": "text/dlm",
    "doc": "application/msword",
    "docm": "application/vnd.ms-word.document.macroEnabled.12",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "dot": "application/msword",
    "dotm": "application/vnd.ms-word.template.macroEnabled.12",
    "dotx": "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
    "dsp": "application/octet-stream",
    "dsw": "text/plain",
    "dtd": "text/xml",
    "dtsConfig": "text/xml",
    "dv": "video/x-dv",
    "dvi": "application/x-dvi",
    "dwf": "drawing/x-dwf",
    "dwp": "application/octet-stream",
    "dxr": "application/x-director",
    "eml": "message/rfc822",
    "emz": "application/octet-stream",
    "eot": "application/octet-stream",
    "eps": "application/postscript",
    "etl": "application/etl",
    "etx": "text/x-setext",
    "evy": "application/envoy",
    "exe": "application/octet-stream",
    "exe.config": "text/xml",
    "fdf": "application/vnd.fdf",
    "fif": "application/fractals",
    "filters": "Application/xml",
    "fla": "application/octet-stream",
    "flr": "x-world/x-vrml",
    "flv": "video/x-flv",
    "fsscript": "application/fsharp-script",
    "fsx": "application/fsharp-script",
    "generictest": "application/xml",
    "gif": "image/gif",
    "group": "text/x-ms-group",
    "gsm": "audio/x-gsm",
    "gtar": "application/x-gtar",
    "gz": "application/x-gzip",
    "h": "text/plain",
    "hdf": "application/x-hdf",
    "hdml": "text/x-hdml",
    "hhc": "application/x-oleobject",
    "hhk": "application/octet-stream",
    "hhp": "application/octet-stream",
    "hlp": "application/winhlp",
    "hpp": "text/plain",
    "hqx": "application/mac-binhex40",
    "hta": "application/hta",
    "htc": "text/x-component",
    "htm": "text/html",
    "html": "text/html",
    "htt": "text/webviewhtml",
    "hxa": "application/xml",
    "hxc": "application/xml",
    "hxd": "application/octet-stream",
    "hxe": "application/xml",
    "hxf": "application/xml",
    "hxh": "application/octet-stream",
    "hxi": "application/octet-stream",
    "hxk": "application/xml",
    "hxq": "application/octet-stream",
    "hxr": "application/octet-stream",
    "hxs": "application/octet-stream",
    "hxt": "text/html",
    "hxv": "application/xml",
    "hxw": "application/octet-stream",
    "hxx": "text/plain",
    "i": "text/plain",
    "ico": "image/x-icon",
    "ics": "application/octet-stream",
    "idl": "text/plain",
    "ief": "image/ief",
    "iii": "application/x-iphone",
    "inc": "text/plain",
    "inf": "application/octet-stream",
    "inl": "text/plain",
    "ins": "application/x-internet-signup",
    "ipa": "application/x-itunes-ipa",
    "ipg": "application/x-itunes-ipg",
    "ipproj": "text/plain",
    "ipsw": "application/x-itunes-ipsw",
    "iqy": "text/x-ms-iqy",
    "isp": "application/x-internet-signup",
    "ite": "application/x-itunes-ite",
    "itlp": "application/x-itunes-itlp",
    "itms": "application/x-itunes-itms",
    "itpc": "application/x-itunes-itpc",
    "IVF": "video/x-ivf",
    "jar": "application/java-archive",
    "java": "application/octet-stream",
    "jck": "application/liquidmotion",
    "jcz": "application/liquidmotion",
    "jfif": "image/pjpeg",
    "jnlp": "application/x-java-jnlp-file",
    "jpb": "application/octet-stream",
    "jpe": "image/jpeg",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "js": "application/x-javascript",
    "json": "application/json",
    "jsx": "text/jscript",
    "jsxbin": "text/plain",
    "latex": "application/x-latex",
    "library-ms": "application/windows-library+xml",
    "lit": "application/x-ms-reader",
    "loadtest": "application/xml",
    "lpk": "application/octet-stream",
    "lsf": "video/x-la-asf",
    "lst": "text/plain",
    "lsx": "video/x-la-asf",
    "lzh": "application/octet-stream",
    "m13": "application/x-msmediaview",
    "m14": "application/x-msmediaview",
    "m1v": "video/mpeg",
    "m2t": "video/vnd.dlna.mpeg-tts",
    "m2ts": "video/vnd.dlna.mpeg-tts",
    "m2v": "video/mpeg",
    "m3u": "audio/x-mpegurl",
    "m3u8": "audio/x-mpegurl",
    "m4a": "audio/m4a",
    "m4b": "audio/m4b",
    "m4p": "audio/m4p",
    "m4r": "audio/x-m4r",
    "m4v": "video/x-m4v",
    "mac": "image/x-macpaint",
    "mak": "text/plain",
    "man": "application/x-troff-man",
    "manifest": "application/x-ms-manifest",
    "map": "text/plain",
    "master": "application/xml",
    "mda": "application/msaccess",
    "mdb": "application/x-msaccess",
    "mde": "application/msaccess",
    "mdp": "application/octet-stream",
    "me": "application/x-troff-me",
    "mfp": "application/x-shockwave-flash",
    "mht": "message/rfc822",
    "mhtml": "message/rfc822",
    "mid": "audio/mid",
    "midi": "audio/mid",
    "mix": "application/octet-stream",
    "mk": "text/plain",
    "mmf": "application/x-smaf",
    "mno": "text/xml",
    "mny": "application/x-msmoney",
    "mod": "video/mpeg",
    "mov": "video/quicktime",
    "movie": "video/x-sgi-movie",
    "mp2": "video/mpeg",
    "mp2v": "video/mpeg",
    "mp3": "audio/mpeg",
    "mp4": "video/mp4",
    "mp4v": "video/mp4",
    "mpa": "video/mpeg",
    "mpe": "video/mpeg",
    "mpeg": "video/mpeg",
    "mpf": "application/vnd.ms-mediapackage",
    "mpg": "video/mpeg",
    "mpp": "application/vnd.ms-project",
    "mpv2": "video/mpeg",
    "mqv": "video/quicktime",
    "ms": "application/x-troff-ms",
    "msi": "application/octet-stream",
    "mso": "application/octet-stream",
    "mts": "video/vnd.dlna.mpeg-tts",
    "mtx": "application/xml",
    "mvb": "application/x-msmediaview",
    "mvc": "application/x-miva-compiled",
    "mxp": "application/x-mmxp",
    "nc": "application/x-netcdf",
    "nsc": "video/x-ms-asf",
    "nws": "message/rfc822",
    "ocx": "application/octet-stream",
    "oda": "application/oda",
    "odc": "text/x-ms-odc",
    "odh": "text/plain",
    "odl": "text/plain",
    "odp": "application/vnd.oasis.opendocument.presentation",
    "ods": "application/oleobject",
    "odt": "application/vnd.oasis.opendocument.text",
    "one": "application/onenote",
    "onea": "application/onenote",
    "onepkg": "application/onenote",
    "onetmp": "application/onenote",
    "onetoc": "application/onenote",
    "onetoc2": "application/onenote",
    "orderedtest": "application/xml",
    "osdx": "application/opensearchdescription+xml",
    "p10": "application/pkcs10",
    "p12": "application/x-pkcs12",
    "p7b": "application/x-pkcs7-certificates",
    "p7c": "application/pkcs7-mime",
    "p7m": "application/pkcs7-mime",
    "p7r": "application/x-pkcs7-certreqresp",
    "p7s": "application/pkcs7-signature",
    "pbm": "image/x-portable-bitmap",
    "pcast": "application/x-podcast",
    "pct": "image/pict",
    "pcx": "application/octet-stream",
    "pcz": "application/octet-stream",
    "pdf": "application/pdf",
    "pfb": "application/octet-stream",
    "pfm": "application/octet-stream",
    "pfx": "application/x-pkcs12",
    "pgm": "image/x-portable-graymap",
    "pic": "image/pict",
    "pict": "image/pict",
    "pkgdef": "text/plain",
    "pkgundef": "text/plain",
    "pko": "application/vnd.ms-pki.pko",
    "pls": "audio/scpls",
    "pma": "application/x-perfmon",
    "pmc": "application/x-perfmon",
    "pml": "application/x-perfmon",
    "pmr": "application/x-perfmon",
    "pmw": "application/x-perfmon",
    "png": "image/png",
    "pnm": "image/x-portable-anymap",
    "pnt": "image/x-macpaint",
    "pntg": "image/x-macpaint",
    "pnz": "image/png",
    "pot": "application/vnd.ms-powerpoint",
    "potm": "application/vnd.ms-powerpoint.template.macroEnabled.12",
    "potx": "application/vnd.openxmlformats-officedocument.presentationml.template",
    "ppa": "application/vnd.ms-powerpoint",
    "ppam": "application/vnd.ms-powerpoint.addin.macroEnabled.12",
    "ppm": "image/x-portable-pixmap",
    "pps": "application/vnd.ms-powerpoint",
    "ppsm": "application/vnd.ms-powerpoint.slideshow.macroEnabled.12",
    "ppsx": "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
    "ppt": "application/vnd.ms-powerpoint",
    "pptm": "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "prf": "application/pics-rules",
    "prm": "application/octet-stream",
    "prx": "application/octet-stream",
    "ps": "application/postscript",
    "psc1": "application/PowerShell",
    "psd": "application/octet-stream",
    "psess": "application/xml",
    "psm": "application/octet-stream",
    "psp": "application/octet-stream",
    "pub": "application/x-mspublisher",
    "pwz": "application/vnd.ms-powerpoint",
    "qht": "text/x-html-insertion",
    "qhtm": "text/x-html-insertion",
    "qt": "video/quicktime",
    "qti": "image/x-quicktime",
    "qtif": "image/x-quicktime",
    "qtl": "application/x-quicktimeplayer",
    "qxd": "application/octet-stream",
    "ra": "audio/x-pn-realaudio",
    "ram": "audio/x-pn-realaudio",
    "rar": "application/octet-stream",
    "ras": "image/x-cmu-raster",
    "rat": "application/rat-file",
    "rc": "text/plain",
    "rc2": "text/plain",
    "rct": "text/plain",
    "rdlc": "application/xml",
    "resx": "application/xml",
    "rf": "image/vnd.rn-realflash",
    "rgb": "image/x-rgb",
    "rgs": "text/plain",
    "rm": "application/vnd.rn-realmedia",
    "rmi": "audio/mid",
    "rmp": "application/vnd.rn-rn_music_package",
    "roff": "application/x-troff",
    "rpm": "audio/x-pn-realaudio-plugin",
    "rqy": "text/x-ms-rqy",
    "rtf": "application/rtf",
    "rtx": "text/richtext",
    "ruleset": "application/xml",
    "s": "text/plain",
    "safariextz": "application/x-safari-safariextz",
    "scd": "application/x-msschedule",
    "sct": "text/scriptlet",
    "sd2": "audio/x-sd2",
    "sdp": "application/sdp",
    "sea": "application/octet-stream",
    "searchConnector-ms": "application/windows-search-connector+xml",
    "setpay": "application/set-payment-initiation",
    "setreg": "application/set-registration-initiation",
    "settings": "application/xml",
    "sgimb": "application/x-sgimb",
    "sgml": "text/sgml",
    "sh": "application/x-sh",
    "shar": "application/x-shar",
    "shtml": "text/html",
    "sit": "application/x-stuffit",
    "sitemap": "application/xml",
    "skin": "application/xml",
    "sldm": "application/vnd.ms-powerpoint.slide.macroEnabled.12",
    "sldx": "application/vnd.openxmlformats-officedocument.presentationml.slide",
    "slk": "application/vnd.ms-excel",
    "sln": "text/plain",
    "slupkg-ms": "application/x-ms-license",
    "smd": "audio/x-smd",
    "smi": "application/octet-stream",
    "smx": "audio/x-smd",
    "smz": "audio/x-smd",
    "snd": "audio/basic",
    "snippet": "application/xml",
    "snp": "application/octet-stream",
    "sol": "text/plain",
    "sor": "text/plain",
    "spc": "application/x-pkcs7-certificates",
    "spl": "application/futuresplash",
    "src": "application/x-wais-source",
    "srf": "text/plain",
    "SSISDeploymentManifest": "text/xml",
    "ssm": "application/streamingmedia",
    "sst": "application/vnd.ms-pki.certstore",
    "stl": "application/vnd.ms-pki.stl",
    "sv4cpio": "application/x-sv4cpio",
    "sv4crc": "application/x-sv4crc",
    "svc": "application/xml",
    "swf": "application/x-shockwave-flash",
    "svg": "image/svg",
    "t": "application/x-troff",
    "tar": "application/x-tar",
    "tcl": "application/x-tcl",
    "testrunconfig": "application/xml",
    "testsettings": "application/xml",
    "tex": "application/x-tex",
    "texi": "application/x-texinfo",
    "texinfo": "application/x-texinfo",
    "tgz": "application/x-compressed",
    "thmx": "application/vnd.ms-officetheme",
    "thn": "application/octet-stream",
    "tif": "image/tiff",
    "tiff": "image/tiff",
    "tlh": "text/plain",
    "tli": "text/plain",
    "toc": "application/octet-stream",
    "tr": "application/x-troff",
    "trm": "application/x-msterminal",
    "trx": "application/xml",
    "ts": "video/vnd.dlna.mpeg-tts",
    "tsv": "text/tab-separated-values",
    "ttf": "application/octet-stream",
    "tts": "video/vnd.dlna.mpeg-tts",
    "txt": "text/plain",
    "u32": "application/octet-stream",
    "uls": "text/iuls",
    "user": "text/plain",
    "ustar": "application/x-ustar",
    "vb": "text/plain",
    "vbdproj": "text/plain",
    "vbk": "video/mpeg",
    "vbproj": "text/plain",
    "vbs": "text/vbscript",
    "vcf": "text/x-vcard",
    "vcproj": "Application/xml",
    "vcs": "text/plain",
    "vcxproj": "Application/xml",
    "vddproj": "text/plain",
    "vdp": "text/plain",
    "vdproj": "text/plain",
    "vdx": "application/vnd.ms-visio.viewer",
    "vml": "text/xml",
    "vscontent": "application/xml",
    "vsct": "text/xml",
    "vsd": "application/vnd.visio",
    "vsi": "application/ms-vsi",
    "vsix": "application/vsix",
    "vsixlangpack": "text/xml",
    "vsixmanifest": "text/xml",
    "vsmdi": "application/xml",
    "vspscc": "text/plain",
    "vss": "application/vnd.visio",
    "vsscc": "text/plain",
    "vssettings": "text/xml",
    "vssscc": "text/plain",
    "vst": "application/vnd.visio",
    "vstemplate": "text/xml",
    "vsto": "application/x-ms-vsto",
    "vsw": "application/vnd.visio",
    "vsx": "application/vnd.visio",
    "vtx": "application/vnd.visio",
    "wav": "audio/wav",
    "wave": "audio/wav",
    "wax": "audio/x-ms-wax",
    "wbk": "application/msword",
    "wbmp": "image/vnd.wap.wbmp",
    "wcm": "application/vnd.ms-works",
    "wdb": "application/vnd.ms-works",
    "wdp": "image/vnd.ms-photo",
    "webarchive": "application/x-safari-webarchive",
    "webtest": "application/xml",
    "wiq": "application/xml",
    "wiz": "application/msword",
    "wks": "application/vnd.ms-works",
    "WLMP": "application/wlmoviemaker",
    "wlpginstall": "application/x-wlpg-detect",
    "wlpginstall3": "application/x-wlpg3-detect",
    "wm": "video/x-ms-wm",
    "wma": "audio/x-ms-wma",
    "wmd": "application/x-ms-wmd",
    "wmf": "application/x-msmetafile",
    "wml": "text/vnd.wap.wml",
    "wmlc": "application/vnd.wap.wmlc",
    "wmls": "text/vnd.wap.wmlscript",
    "wmlsc": "application/vnd.wap.wmlscriptc",
    "wmp": "video/x-ms-wmp",
    "wmv": "video/x-ms-wmv",
    "wmx": "video/x-ms-wmx",
    "wmz": "application/x-ms-wmz",
    "wpl": "application/vnd.ms-wpl",
    "wps": "application/vnd.ms-works",
    "wri": "application/x-mswrite",
    "wrl": "x-world/x-vrml",
    "wrz": "x-world/x-vrml",
    "wsc": "text/scriptlet",
    "wsdl": "text/xml",
    "wvx": "video/x-ms-wvx",
    "x": "application/directx",
    "xaf": "x-world/x-vrml",
    "xaml": "application/xaml+xml",
    "xap": "application/x-silverlight-app",
    "xbap": "application/x-ms-xbap",
    "xbm": "image/x-xbitmap",
    "xdr": "text/plain",
    "xht": "application/xhtml+xml",
    "xhtml": "application/xhtml+xml",
    "xla": "application/vnd.ms-excel",
    "xlam": "application/vnd.ms-excel.addin.macroEnabled.12",
    "xlc": "application/vnd.ms-excel",
    "xld": "application/vnd.ms-excel",
    "xlk": "application/vnd.ms-excel",
    "xll": "application/vnd.ms-excel",
    "xlm": "application/vnd.ms-excel",
    "xls": "application/vnd.ms-excel",
    "xlsb": "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
    "xlsm": "application/vnd.ms-excel.sheet.macroEnabled.12",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "xlt": "application/vnd.ms-excel",
    "xltm": "application/vnd.ms-excel.template.macroEnabled.12",
    "xltx": "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
    "xlw": "application/vnd.ms-excel",
    "xml": "text/xml",
    "xmta": "application/xml",
    "xof": "x-world/x-vrml",
    "XOML": "text/plain",
    "xpm": "image/x-xpixmap",
    "xps": "application/vnd.ms-xpsdocument",
    "xrm-ms": "text/xml",
    "xsc": "application/xml",
    "xsd": "text/xml",
    "xsf": "text/xml",
    "xsl": "text/xml",
    "xslt": "text/xml",
    "xsn": "application/octet-stream",
    "xss": "application/xml",
    "xtp": "application/octet-stream",
    "xwd": "image/x-xwindowdump",
    "z": "application/x-compress",
    "zip": "application/x-zip-compressed"
}

_global.ac = ac

if (typeof module !== 'undefined') {
    module.exports = ac;
}