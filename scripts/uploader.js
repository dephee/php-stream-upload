(function( $ ){
    
    
    
    $.uploader = function(obj, opt) {
        
        
        var options = $.extend({}, $.uploader.defaults);
        var origobj = obj;
        var $this = $(obj);
        var data = $this.data('uploader');
        var theForm = null;
        var theField = null;
        
        function setOptions(opt) {
            options = $.extend(options, opt);
        }
        
        function init() {
            if (!data) {
                data = {};
                $this.data('uploader', data);
            }
            
            data.width = $this.attr('data-width');
            initUI();
        }
        
        function initUI() {
            theForm = $this.parents('form');
            theField = options.field ? $(options.field) : null;
            $this.addClass('btn-upload');
            if (!theField || !theField[0]) {
                var _parent = $this;
                if (!theForm[0]) {
                    theForm = $('<form method="put" action="' + options.url + '"></form>');
                    $this.append(theForm);
                    _parent = theForm;
                }
                
                theField = $('<input type="file" name="' + options.fieldName + '" ' + (options.multiple ? 'multiple="true"' : '') + '/>');
                _parent.append(theField);
            }
            
            
            initEvent();
        }
        
        function _normalizeFile(index, file) {
            if (file.name === undefined && file.size === undefined) {
                file.name = file.fileName;
                file.size = file.fileSize;
            }
        }
        
        function initEvent() {
            theField.on('change', function(ev) {
                data = {
                    files: $.each($.makeArray(ev.target.files), _normalizeFile),
                    fileInput: $(ev.target),
                    form: $(ev.target.form)
                };
                
                
                if (data.files.length) {
                    for (i in data.files) {
                        _send(data.files[i]);
                    }
                }
            });
        }
        
        function _send(file) {
            var headers = {
                'X-File-Name': file.name,
                'X-File-Type': file.type,
                'X-File-Size': file.size,
                'X-File-Start': 0,
                'X-File-End': file.size,
                'Content-Type': 'application/octet-stream'
            };
                
            
            var params = options.listeners ? options.listeners(file) : {};
            params.headers = headers;
            params.url = options.url;
            
            _sendChunked(file, params);
        }
        
        function _sendFull(file, xhrOptions) {
            var reader = new FileReader();
            
            if (file.webkitSlice) {
         
                var blob = file.webkitSlice(0, file.size);
            } else if (file.mozSlice) {
                var blob = file.mozSlice(0, file.size);
            } else if (file.slice) {
                var blob = file.slice(0, file.size);
            }
            
            
            reader.onloadend  = function(evt)  {
                // create XHR instance
                var xhr = new XMLHttpRequest();

                // send the file through POST
                xhr.open("PUT", xhrOptions.url, true);
                    
                for (var i in xhrOptions.headers) {
                    xhr.setRequestHeader(i, xhrOptions.headers[i]);
                }
                
                // let's track upload progress
                var eventSource = xhr.upload || xhr;
                var dfd = $.Deferred();
                dfd.then(options.onSuccess, options.onError, xhrOptions.onProgress)
                dfd.always(options.onComplete);
                
                eventSource.addEventListener("progress", function(ev) {
                    
                    dfd.notify(xhr, ev);
                // here you should write your own code how you wish to proces this
                });

                // state change observer - we need to know when and if the file was successfully uploaded
                
                xhr.onreadystatechange = function(e) {
                    if(xhr.readyState == 4){
                        if(xhr.status == 200) {
                            //onSuccess.call(xhr, e);
                            dfd.resolve( xhr, e);
                        } else {
                            dfd.reject(xhr, e);
                        }
                    }
                };
                xhr.sendAsBinary(evt.target.result);
                blob = null;
            }
            reader.readAsBinaryString(blob); 
           
        }
        
        function getXhr(url, param) {
            var dfd = $.Deferred();
            var success = param.onSuccess || function() {}
            var fail = param.onFail || function() {}
            var progress = param.onProgress || function() {}
            var complete = param.onComplete || function() {}
            
            dfd.then(success, fail, progress)
            dfd.always(complete);
                
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function(e) {
                if(xhr.readyState == 4){
                    if(xhr.status == 200) {
                        dfd.resolveWith(e, [xhr.responseText]);
                    } else {
                        dfd.rejectWith(e, [xhr.reponseText]);
                    }
                }
            }
            var eventSource = xhr.upload || xhr;

            
            eventSource.addEventListener("progress", function(ev) {

                dfd.notify(xhr, ev);
            // here you should write your own code how you wish to proces this
            });
            
            xhr.open(param.method || 'GET', url , true);
                    
            for (var i in param.headers) {
                xhr.setRequestHeader(i, param.headers[i]);
            }

            if (param.binary) {
                var reader = new FileReader();    
                reader.onloadend  = function(evt)  {
                    // send the file through POST

                    if(!XMLHttpRequest.prototype.sendAsBinary){
                      XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
                        function byteValue(x) {
                          return x.charCodeAt(0) & 0xff;
                        }
                        var ords = Array.prototype.map.call(datastr, byteValue);
                        var ui8a = new Uint8Array(ords);
                        this.send(ui8a.buffer);
                      }
                    }

                    xhr.sendAsBinary(evt.target.result);
                    param.data = null;
                }
                reader.readAsBinaryString(param.data); 
                
            } else {
                xhr.send();
            }
            
            return dfd;
        }
        
        function _sendChunked(file, xhrOptions) {
            var ub = xhrOptions.uploadedByte = xhrOptions.uploadedByte || 0;
            var n = Math.ceil((file.size - ub)/options.chunkSize),
            mcs = options.chunkSize;
            var slice = file.webkitSlice || file.mozSlice || file.slice

            var dfd = $.Deferred();
            
            var upload = function(i) {
                if (!i) {
                    return dfd;
                }
                
                return upload(i - 1).then(function() {
                    var start = ub + (i-1) * mcs,
                        end = ub + i * mcs;
                    var blob = slice.call(file, start, end);
                    xhrOptions.headers['X-File-Start'] = start;
                    xhrOptions.headers['X-File-End'] = end;
                    
                    var xhr = getXhr(options.url, {
                        binary: true,
                        data: blob,
                        headers: xhrOptions.headers,
                        method: 'PUT' ,
                        onSuccess: function(data) {
                            if (typeof data == 'string') {
                                data = $.parseJSON(data);
                            }
                            if (data.filename) {
                                xhrOptions.headers['X-File-Target'] = data.filename;
                            }
                        },
                        onProgress: function(xhr, ev) {
                            if (xhrOptions.onProgress) {
                                xhrOptions.onProgress(xhr, $.Event('progress', {
                                    lengthComputable: true,
                                    loaded: xhrOptions.uploadedByte + ev.loaded,
                                    total: file.size,
                                    totalSize: file.size,
                                    position: xhrOptions.uploadedByte + ev.position
                                }));
                            }
                            
                        },
                        onComplete: function(xhr, ev) {
                            xhrOptions.uploadedByte += mcs;
                        }
                    }) || dfd;
                    
                    
                    return xhr;
                });
            }
            
            var xhr = upload(n);
            
            xhr.then(xhrOptions.onSuccess, xhrOptions.onError)
            xhr.always(xhrOptions.onComplete);
            
            
            dfd.resolve();
        }
        
        
        
        function printout() {
            console.log(options.selectable);
            alert(data.width);
        }
        
        setOptions(opt);
        init();
        
        /* These are method that can be called by methods */
        var api = {
            update: printout
        }
        data.api = api;
    }
    
    /* Default settings */
    $.uploader.defaults = {
        fileId: null,
        fieldName: 'file',
        multiple: true,
        url: '',
        chunkSize: 1000000,
        listeners: null
    }
    
    /* These are methods that can be called by $(selector).uploader(mothodname); */
    var methods = {
        init : function(options ) {
            
            
            return this.each(function() {
                $.uploader(this, options);
            });
        },
        
        update: function() {
            /* Api mapping is set in data, we need to get it */
            var data = this.data('uploader');
            data.api.update();
        }
    }


    /* JQuery plugins setting, just allow methods specified on methods */
    $.fn.uploader = function( method ) {
    
        // Method calling logic
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.uploader' );
        }    
  
    };

})( jQuery );