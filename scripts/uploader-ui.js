(function( $ ){
    
    
    
    $.uploaderui = function(obj, opt) {
        
        
        var options = $.extend({}, $.uploaderui.defaults);
        var origobj = obj;
        var $this = $(obj);
        var data = $this.data('uploaderui');
        var uploader = null;
        var theList = null;
        var fileIndex = 0;
        
        function setOptions(opt) {
            options = $.extend(options, opt);
        }
        
        function init() {
            if (!data) {
                data = {};
                $this.data('uploaderui', data);
            }
            
            var opt = $.extend({}, options);
            opt.listeners = getFileListener;
            
            uploader = $this.uploader(opt);
            
            theList = $(options.listContainer);
            theList.addClass('upload-list');
        }
        
        function onSuccess(data, preview) {
            if (typeof data == 'string') {
                data = $.parseJSON(data);
            }

            preview.find('.bar').css('width', '100%');
            preview.find('img').attr('src', data.url);
        }
        
        function getOnSuccess(fileId, file) {
            var preview = $('#' + fileId);
            if (options.preview) {
                var _onSuccess = (function(prev) {
                    return function(data) {
                        onSuccess(data, prev);
                        
                    }
                })(preview); 
                
                return _onSuccess;
            }
        }
        
        function onError(data, preview) {
            console.log(data);
        }
        
        function getOnError(fileId, file) {
            var preview = $('#' + fileId);
            
            if (options.preview) {
                var _onError = (function(prev) {
                    return function(data) {
                        onError(data, prev);
                        
                    }
                })(preview);
                
                return _onError;
            }
        }
        
        function onComplete(xhr, ev) {
            console.log('On complete');
        }
        
        function onProgress(xhr, ev, preview) {
            // get percentage of how much of the current file has been sent
            var position = ev.position || ev.loaded;
            var total = ev.totalSize || ev.total;
            var percentage = Math.round((position/total)*100);
            console.log('percentage: ' + percentage);
            if (preview) {
                preview.find('.bar').css('width', percentage + '%');
            }
        }
        
        function _getFileId(inc) {
            if (inc) {
                fileIndex++;
            }
            return 'file-' + fileIndex;
        }
        
        function getFileListener(file) {
            var fileId = _getFileId(true);
            return {
                onProgress: getOnProgress(fileId, file),
                onSuccess: getOnSuccess(fileId, file),
                onError: getOnError(fileId, file)
            }
        }
        
        function getOnProgress(id, file) {
            var preview = null;
            var _onProgress = null;
            if (options.preview) {
                var previewReader = new FileReader();
                preview = $('<div id="' + id + '" class="upload-preview hide"><img /><div class="progress"><div class="bar"></div></div></div>');
                theList.append(preview);
                    
                _onProgress = (function(prev) {
                    return function(xhr, ev) {
                        onProgress(xhr, ev, prev);
                        
                    }
                })(preview); 
                
                previewReader.onload = function(e) {
                    preview.removeClass('hide');
                    var img = preview.find('img');
                    img.attr('src', e.target.result);
                    img.attr('title', file.name);
                };
                previewReader.readAsDataURL(file);
                
                return _onProgress;
            }
        }
        
        function initEvent() {
            $this.click(function() {
                printout();
            });
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
    $.uploaderui.defaults = {
        fileId: null,
        fieldName: 'file',
        multiple: true,
        url: '',
        listContainer: '#upload-list',
        preview: true,
        chunkSize: 1000000
    }
    
    /* These are methods that can be called by $(selector).uploaderui(mothodname); */
    var methods = {
        init : function(options ) {
            
            
            return this.each(function() {
                $.uploaderui(this, options);
            });
        },
        
        update: function() {
            /* Api mapping is set in data, we need to get it */
            var data = this.data('uploaderui');
            data.api.update();
        }
    }


    /* JQuery plugins setting, just allow methods specified on methods */
    $.fn.uploaderui = function( method ) {
    
        // Method calling logic
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.uploaderui' );
        }    
  
    };

})( jQuery );