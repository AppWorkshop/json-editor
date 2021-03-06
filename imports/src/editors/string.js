JSONEditor.defaults.editors.string = JSONEditor.AbstractEditor.extend({
  register: function() {
    this._super();
    if(!this.input) return;
    this.input.setAttribute('name',this.formname);
  },
  unregister: function() {
    this._super();
    if(!this.input) return;
    this.input.removeAttribute('name');
  },
  setValue: function(value,initial,from_template) {
    var self = this;
    
    if(this.template && !from_template) {
      return;
    }
    
    if(value === null) value = "";
    else if(typeof value === "object") value = JSON.stringify(value);
    else if(typeof value !== "string") value = ""+value;
    
    if(value === this.serialized) return;

    // Sanitize value before setting it
    // we can add a link to a route if the value is not defined:
    //    "linkRouteIfUndefined": Router.path("euroSCORE"),
    //    "linkTextIfUndefined": " Tap here to calculate",
    if (this.schema.linkRouteIfUndefined) {
      if (!value) {
        // override the input field with a link
        this.input = document.createElement("A");
        this.input.href = this.schema.linkRouteIfUndefined;
        var linkTextNode = document.createTextNode(this.schema.linkTextIfUndefined);
        this.input.appendChild(linkTextNode);
      } else {
        var parentNode = this.input.parentNode;
        parentNode.removeChild(this.input);
        this.input = document.createElement("INPUT");
        this.input.disabled = true;
        parentNode.appendChild(this.input);
      }
    }

    var sanitized = this.sanitize(value);

    if(this.input.value === sanitized) {
      return;
    }

    this.input.value = sanitized;
    
    // If using SCEditor, update the WYSIWYG
    if(this.sceditor_instance) {
      this.sceditor_instance.val(sanitized);
    }
    else if(this.epiceditor) {
      this.epiceditor.importFile(null,sanitized);
    }
    else if(this.ace_editor) {
      this.ace_editor.setValue(sanitized);
    }
    
    var changed = from_template || this.getValue() !== value;
    
    this.refreshValue();
    
    if(initial) this.is_dirty = false;
    else if(this.jsoneditor.options.show_errors === "change") this.is_dirty = true;

    // Bubble this setValue to parents if the value changed
    this.onChange(changed);
  },
  getNumColumns: function() {
    var min = Math.ceil(Math.max(this.getTitle().length,this.schema.maxLength||0,this.schema.minLength||0)/5);
    var num;
    
    if(this.input_type === 'textarea') num = 6;
    else if(['text','email'].indexOf(this.input_type) >= 0) num = 4;
    else num = 2;
    
    return Math.min(12,Math.max(min,num));
  },
  build: function() {
    var self = this, i;
    if(!this.options.compact) this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if(this.schema.description) this.description = this.theme.getFormInputDescription(this.schema.description, this.schema.showHTML);

    this.format = this.schema.format;
    if(!this.format && this.schema.media && this.schema.media.type) {
      this.format = this.schema.media.type.replace(/(^(application|text)\/(x-)?(script\.)?)|(-source$)/g,'');
    }
    // Specific format
    if (this.format && this.format === 'geolocation') {
      var divElem = document.createElement('div');
      divElem.setAttribute("class", "geolocation");

      var hiddenInput = this.theme.getFormInputField('hidden');
      var uuid = $uuid();
      hiddenInput.setAttribute("id", uuid);

      var labelElem = document.createElement('label');
      labelElem.setAttribute("for", uuid);

      var labelTextNode = document.createTextNode("");
      labelElem.appendChild(labelTextNode);

      divElem.appendChild(labelElem);
      labelElem.appendChild(hiddenInput);

      this.input = divElem;
      this.input_type = 'hidden';

      var geolocAvailable = false, needGeolocUpdate = false;

      if (typeof JutoCordovaBridge !== "undefined") {

        if (JutoCordovaBridge.deviceReady) {

          // flag geoloc as available; it will be handled by the native plugin.
          geolocAvailable = true;

          // see if we need to update the location
          if (JutoCordovaBridge.locationFixObtained) {

            var currentTime = new Date();
            var differenceMilliseconds = currentTime - JutoCordovaBridge.lastLocationUpdateTime;
            var toleratedDifferenceMilliseconds = JutoCordovaBridge.locationUpdateFrequencySeconds * 1000;
            if (differenceMilliseconds > toleratedDifferenceMilliseconds) {
              // time for an update.
              needGeolocUpdate = true;
            } else {

              // old location still valid.

              labelTextNode.nodeValue = "Latitude/Longitude: " + JutoCordovaBridge.latitude + "," + JutoCordovaBridge.longitude;
              hiddenInput.value = JutoCordovaBridge.latitude + "," + JutoCordovaBridge.longitude;
              self.setValue(JutoCordovaBridge.latitude + "," + JutoCordovaBridge.longitude);
            }
          } else {
            // we haven't yet obtained a fix. Let's add ourselves as a listener 
            // for when the device is ready.
            needGeolocUpdate = true;
          }

        } else {
          // the device isn't ready yet. Add ourselves as a listener for the geoloc
          // call that will be invoked when the device is ready.

          // Are we in a cordova device that we can detect? Because we *REALLY*
          //  don't want to fall back to web, we'd get a nasty alert message.
          var app = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;

          if (app) { // we are in an app.
            geolocAvailable = true; // assume that cordova plugins WILL work, they just haven't yet.
          }

        }

        if (needGeolocUpdate) {
          // OK for some reason (above), we need an update to geolocation
          // The function below is a callback that will occur when it's done.
          JutoCordovaBridge.updateCurrentPosition(function() {

            // success callback.
            // update the label and hidden field value.
            labelTextNode.nodeValue = "Lat/Long: " + JutoCordovaBridge.latitude + "," + JutoCordovaBridge.longitude;
            hiddenInput.value = JutoCordovaBridge.latitude + "," + JutoCordovaBridge.longitude;
            self.setValue(JutoCordovaBridge.latitude + "," + JutoCordovaBridge.longitude);
            // return true, so that we get invoked if the position gets updated again.
            return true;
          });

        }
      }

      if (!geolocAvailable) {

        // OK we haven't got it yet. Try navigator.geolocation.getCurrentPosition.
        navigator.geolocation.getCurrentPosition(function(pos) {

          hiddenInput.value = pos.coords.latitude + "," + pos.coords.longitude;
          labelTextNode.nodeValue = "Lat/Long: " + pos.coords.latitude + "," + pos.coords.longitude;
          self.setValue(pos.coords.latitude + "," + pos.coords.longitude);
        },
                function(err) {

                  console.log("couldn't get position");

                  console.log(err);
                });
      }
    }

    if(!this.format && this.options.default_format) {
      this.format = this.options.default_format;
    }
    if(this.options.format) {
      this.format = this.options.format;
    }

    // Specific format
    if(this.format) {
      // Text Area
      if(this.format === 'textarea') {
        this.input_type = 'textarea';
        this.input = this.theme.getTextareaInput();
      }
      // Range Input
      else if(this.format === 'range') {
        this.input_type = this.format;
        var min = this.schema.minimum || 0;
        var max = this.schema.maximum || Math.max(100,min+1);
        var step = 1;
        if(this.schema.multipleOf) {
          if(min%this.schema.multipleOf) min = Math.ceil(min/this.schema.multipleOf)*this.schema.multipleOf;
          if(max%this.schema.multipleOf) max = Math.floor(max/this.schema.multipleOf)*this.schema.multipleOf;
          step = this.schema.multipleOf;
        }

        this.input = this.theme.getRangeInput(min,max,step);

        // Do we have mobile range slider defined? If so use it. (https://github.com/ubilabs/mobile-range-slider)
        if (typeof MobileRangeSlider !== 'undefined') {
          // set up the nessiscariry markup
          var rangeDiv = document.createElement('div');
          rangeDiv.className = 'slider';
          rangeDiv.innerHTML = '<div class="track"></div><div class="knob"></div>';

          // create the mobile slider
          this.mobileRangeSlider = new MobileRangeSlider(rangeDiv, {
            min: min,
            max: max,
            change: function(value) {
             self.setValue(String(value));
            }
          });

          this.input = rangeDiv; // set the input to the new mobile slider
        }

        // Allow an input alongside a range slider to override the maximum property
        if (this.schema.overrideMaximum) {
          var rangeInput = this.input; // store the range input
          this.input = this.theme.getFormInputField('number'); // make a number input the primary input
          // create the control for the range slider
          this.secondaryControl = this.theme.getFormControl(null, rangeInput);

          // update the range slider when we change the primary input
          this.input.addEventListener('change', function(e) {
            if (self.mobileRangeSlider) {
              // modified from the mobile slider source
              // sets the knob position instead of setValue which calls the change callback (we don't want that)
              var
                knobWidth = rangeInput.getElementsByClassName('knob')[0].offsetWidth,
                trackWidth = rangeInput.getElementsByClassName('track')[0].offsetWidth,
                range = max - min,
                width = trackWidth - knobWidth,
                position = Math.round((Math.min(e.target.value, max) - min) * width / range);

              self.mobileRangeSlider.setKnobPosition(position);
            }
            else rangeInput.value = e.target.value;
          });
          // update the primary input when we change the range slider
          rangeInput.addEventListener('change', function(e) {
            self.setValue(e.target.value);
          });
          // set the range slider to the default value
          rangeInput.value = this.schema.default;
        }
      }
      // Source Code
      else if([
          'actionscript',
          'batchfile',
          'bbcode',
          'c',
          'c++',
          'cpp',
          'coffee',
          'csharp',
          'css',
          'dart',
          'django',
          'ejs',
          'erlang',
          'golang',
          'handlebars',
          'haskell',
          'haxe',
          'html',
          'ini',
          'jade',
          'java',
          'javascript',
          'json',
          'less',
          'lisp',
          'lua',
          'makefile',
          'markdown',
          'matlab',
          'mysql',
          'objectivec',
          'pascal',
          'perl',
          'pgsql',
          'php',
          'python',
          'r',
          'ruby',
          'sass',
          'scala',
          'scss',
          'smarty',
          'sql',
          'stylus',
          'svg',
          'twig',
          'vbscript',
          'xml',
          'yaml'
        ].indexOf(this.format) >= 0
      ) {
        this.input_type = this.format;
        this.source_code = true;
        
        this.input = this.theme.getTextareaInput();
      }
      else if (this.format === "hidden") {
        this.input_type = this.format;
        this.input = this.theme.getFormInputField(this.input_type);
        this.container.setAttribute('class',this.container.getAttribute('class')+' hidden');
      }
      // HTML5 Input type
      else if (this.format !== "geolocation") {
        this.input_type = this.format;
        this.input = this.theme.getFormInputField(this.input_type);
      }
    }
    // Normal text input
    else {
      this.input_type = 'text';
      this.input = this.theme.getFormInputField(this.input_type);
    }
    
    // minLength, maxLength, and pattern
    if(typeof this.schema.maxLength !== "undefined") this.input.setAttribute('maxlength',this.schema.maxLength);
    if(typeof this.schema.pattern !== "undefined") this.input.setAttribute('pattern',this.schema.pattern);
    else if(typeof this.schema.minLength !== "undefined") this.input.setAttribute('pattern','.{'+this.schema.minLength+',}');

    if(this.options.compact) this.container.setAttribute('class',this.container.getAttribute('class')+' compact');

    if(this.schema.readOnly || this.schema.readonly || this.schema.template) {
      this.always_disabled = true;
      this.input.disabled = true;
    }
    if (this.schema.autocomplete) {
      if (typeof $ !== "undefined") { // if we have jquery
        // attach autocomplete data, if it exists and JqueryUI is available
        if (this.schema.autocompleteData && !!$(this.input).autocomplete) {
          $(this.input).autocomplete(
                  {
                    "source": this.schema.autocompleteData,
                    select: function(event, ui) {
                      self.setValue(ui.item.value);
                      self.jsoneditor.onChange();
                    }
                  }
          );
        }
      }
    }

    this.theme.attachHandlers(this.input, function(e) {
      e.preventDefault();
      e.stopPropagation();

      // Don't allow changing if this field is a template
      if(self.schema.template) {
        this.value = self.value;
        return;
      }

      var val = this.value;

      // sanitize value
      var sanitized = self.sanitize(val);
      if(val !== sanitized) {
        this.value = sanitized;
      }

      self.is_dirty = true;

      self.refreshValue();
      self.onChange(true);
    });

    if(this.format) this.input.setAttribute('data-schemaformat',this.format);
    if (this.schema.information_only) {
      // override the input field with an empty span
      this.input = document.createElement("SPAN");
    }
    if (this.schema.linkRouteIfUndefined) {
      // override the input field with a link
      this.input = document.createElement("A");
      this.input.href=this.schema.linkRouteIfUndefined;
      var linkTextNode = document.createTextNode(this.schema.linkTextIfUndefined);
      this.input.appendChild(linkTextNode);
    }

    this.control = this.theme.getFormControl(this.label, this.input, this.description, this.schema.info);

    this.container.appendChild(this.control);

    if (this.secondaryControl) this.container.appendChild(this.secondaryControl);


/*
    // materialize date picker
    if (this.format === 'date' && this.jsoneditor.options.theme === 'materialize' && !$isCordova()) {
      $(this.input).pickadate({format: 'dd/mm/yyyy'});
      this.input = $(this.control).find('input').get(0);
      $(this.input).change(function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.refreshValue();
        self.onChange(true);
      });
    }
*/

    // Any special formatting that needs to happen after the input is added to the dom
    window.requestAnimationFrame(function() {
      // Skip in case the input is only a temporary editor,
      // otherwise, in the case of an ace_editor creation,
      // it will generate an error trying to append it to the missing parentNode
      if(self.input.parentNode) self.afterInputReady();
    });

    // Compile and store the template
    if(this.schema.template) {
      this.template = this.jsoneditor.compileTemplate(this.schema.template, this.template_engine);
      this.refreshValue();
    }
    else {
      this.refreshValue();
    }
  },
  enable: function() {
    if(!this.always_disabled) {
      this.input.disabled = false;
      // TODO: WYSIWYG and Markdown editors
    }
    this._super();
  },
  disable: function() {
    this.input.disabled = true;
    // TODO: WYSIWYG and Markdown editors
    this._super();
  },
  afterInputReady: function() {
    var self = this, options;

    // Set the mobile range slider to the default value
    if (this.mobileRangeSlider) this.mobileRangeSlider.setValue(this.schema.default);
    
    // Code editor
    if(this.source_code) {      
      // WYSIWYG html and bbcode editor
      if(this.options.wysiwyg && 
        ['html','bbcode'].indexOf(this.input_type) >= 0 && 
        window.jQuery && window.jQuery.fn && window.jQuery.fn.sceditor
      ) {
        options = $extend({},{
          plugins: self.input_type==='html'? 'xhtml' : 'bbcode',
          emoticonsEnabled: false,
          width: '100%',
          height: 300
        },JSONEditor.plugins.sceditor,self.options.sceditor_options||{});
        
        window.jQuery(self.input).sceditor(options);
        
        self.sceditor_instance = window.jQuery(self.input).sceditor('instance');
        
        self.sceditor_instance.blur(function() {
          // Get editor's value
          var val = window.jQuery("<div>"+self.sceditor_instance.val()+"</div>");
          // Remove sceditor spans/divs
          window.jQuery('#sceditor-start-marker,#sceditor-end-marker,.sceditor-nlf',val).remove();
          // Set the value and update
          self.input.value = val.html();
          self.value = self.input.value;
          self.is_dirty = true;
          self.onChange(true);
        });
      }
      // EpicEditor for markdown (if it's loaded)
      else if (this.input_type === 'markdown' && window.EpicEditor) {
        this.epiceditor_container = document.createElement('div');
        this.input.parentNode.insertBefore(this.epiceditor_container,this.input);
        this.input.style.display = 'none';
        
        options = $extend({},JSONEditor.plugins.epiceditor,{
          container: this.epiceditor_container,
          clientSideStorage: false
        });
        
        this.epiceditor = new window.EpicEditor(options).load();
        
        this.epiceditor.importFile(null,this.getValue());
      
        this.epiceditor.on('update',function() {
          var val = self.epiceditor.exportFile();
          self.input.value = val;
          self.value = val;
          self.is_dirty = true;
          self.onChange(true);
        });
      }
      // ACE editor for everything else
      else if(window.ace) {
        var mode = this.input_type;
        // aliases for c/cpp
        if(mode === 'cpp' || mode === 'c++' || mode === 'c') {
          mode = 'c_cpp';
        }
        
        this.ace_container = document.createElement('div');
        this.ace_container.style.width = '100%';
        this.ace_container.style.position = 'relative';
        this.ace_container.style.height = '400px';
        this.input.parentNode.insertBefore(this.ace_container,this.input);
        this.input.style.display = 'none';
        this.ace_editor = window.ace.edit(this.ace_container);
        
        this.ace_editor.setValue(this.getValue());
        
        // The theme
        if(JSONEditor.plugins.ace.theme) this.ace_editor.setTheme('ace/theme/'+JSONEditor.plugins.ace.theme);
        // The mode
        mode = window.ace.require("ace/mode/"+mode);
        if(mode) this.ace_editor.getSession().setMode(new mode.Mode());
        
        // Listen for changes
        this.ace_editor.on('change',function() {
          var val = self.ace_editor.getValue();
          self.input.value = val;
          self.refreshValue();
          self.is_dirty = true;
          self.onChange(true);
        });
      }
    }
    
    self.theme.afterInputReady(self.input);
  },
  refreshValue: function() {
    this.value = this.input.value;
    if(typeof this.value !== "string") this.value = '';
    this.serialized = this.value;
  },
  destroy: function() {
    // If using SCEditor, destroy the editor instance
    if(this.sceditor_instance) {
      this.sceditor_instance.destroy();
    }
    else if(this.epiceditor) {
      this.epiceditor.unload();
    }
    else if(this.ace_editor) {
      this.ace_editor.destroy();
    }
    
    
    this.template = null;
    if(this.input && this.input.parentNode) this.input.parentNode.removeChild(this.input);
    if(this.label && this.label.parentNode) this.label.parentNode.removeChild(this.label);
    if(this.description && this.description.parentNode) this.description.parentNode.removeChild(this.description);

    this._super();
  },
  /**
   * This is overridden in derivative editors
   */
  sanitize: function(value) {
    return value;
  },
  /**
   * Re-calculates the value if needed
   */
  onWatchedFieldChange: function() {    
    var self = this, vars, j;
    
    // If this editor needs to be rendered by a macro template
    if(this.template) {
      vars = this.getWatchedFieldValues();
      this.setValue(this.template(vars),false,true);
    }
    
    this._super();
  },
  showValidationErrors: function(errors) {
    var self = this;
    
    if(this.jsoneditor.options.show_errors === "always") {}
    else if(!this.is_dirty && this.previous_error_setting===this.jsoneditor.options.show_errors) return;
    
    this.previous_error_setting = this.jsoneditor.options.show_errors;

    var messages = [];
    $each(errors,function(i,error) {
      if(error.path === self.path) {
        messages.push(error.message);
      }
    });

    if(messages.length) {
      this.theme.addInputError(this.input, messages.join('. ')+'.');
    }
    else {
      this.theme.removeInputError(this.input);
    }
  }
});
