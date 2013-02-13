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
                
                
                var file = this.files[0];
                _send(file);
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
                
            var reader = new FileReader();
            if (file.webkitSlice) {
         
                var blob = file.webkitSlice(0, file.size);
            } else if (file.mozSlice) {
                var blob = file.mozSlice(0, file.size);
            } else if (file.slice) {
                var blob = file.slice(0, file.size);
            }
            
            reader.readAsBinaryString(blob);
            reader.onloadend  = function(evt)  {
                // create XHR instance
                var xhr = new XMLHttpRequest();

                // send the file through POST
                xhr.open("PUT", options.url, true);
                    
                for (var i in headers) {
                    xhr.setRequestHeader(i, headers[i]);
                }
                xhr.sendAsBinary(evt.target.result);
            /*
                    var jqXHR = $.ajax({
                        form: $this.theForm, 
                        url: options.url, 
                        type: 'PUT', 
                        headers: headers, 
                        contentType: 'application/octet-stream', 
                        data: evt.target.result
                    }); */
            }
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
        url: ''
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