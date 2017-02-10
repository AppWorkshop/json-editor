JSONEditor.defaults.editors.geolocation = JSONEditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.default || '';
  },
  setValue: function(value, initial, from_template) {
    var self = this;

    if (this.template && !from_template) {
      return;
    }

    value = value || '';
    if (typeof value === "object")
      value = JSON.stringify(value);
    if (typeof value !== "string")
      value = "" + value;
    if (value === this.serialized)
      return;

    // Sanitize value before setting it
    var sanitized = this.sanitize(value);
    if (this.select_options && this.select_options.indexOf(sanitized) < 0) {
      sanitized = this.select_options[0];
    }

    if (this.input.value === sanitized) {
      return;
    }


    this.input.value = sanitized;

    // If using SCEditor, update the WYSIWYG
    if (this.sceditor_instance) {
      this.sceditor_instance.val(sanitized);
    }
    else if (this.epiceditor) {
      this.epiceditor.importFile(null, sanitized);
    }
    else if (this.ace_editor) {
      this.ace_editor.setValue(sanitized);
    }

    var changed = from_template || this.getValue() !== value;

    this.refreshValue();

    if (changed) {
      if (self.parent)
        self.parent.onChildEditorChange(self);
      else
        self.jsoneditor.onChange();
    }

    this.watch_listener();
    this.jsoneditor.notifyWatchers(this.path);
  },
  removeProperty: function() {
    this._super();
    this.input.style.display = 'none';
    if (this.description)
      this.description.style.display = 'none';
    this.theme.disableLabel(this.label);
  },
  addProperty: function() {
    this._super();
    this.input.style.display = '';
    if (this.description)
      this.description.style.display = '';
    this.theme.enableLabel(this.label);
  },
  build: function() {
    var self = this;
    if (!this.getOption('compact', false))
      this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if (this.schema.description)
      this.description = this.theme.getFormInputDescription(this.schema.description);

    this.format = this.schema.format;
    // Specific format
    if (this.format) {
      // input type=file accept=image/*
      if (this.format === 'geolocation') {
        // inspired by:
        //  http://stackoverflow.com/a/18803568/956779
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
            var app = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;

            if (app ) { // we are in an app.
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
    }


    // minLength, maxLength, and pattern
    if (typeof this.schema.maxLength !== "undefined")
      this.input.setAttribute('maxlength', this.schema.maxLength);
    if (typeof this.schema.pattern !== "undefined")
      this.input.setAttribute('pattern', this.schema.pattern);
    else if (typeof this.schema.minLength !== "undefined")
      this.input.setAttribute('pattern', '.{' + this.schema.minLength + ',}');

    if (this.getOption('compact'))
      this.container.setAttribute('class', this.container.getAttribute('class') + ' compact');

    if (this.schema.readOnly || this.schema.readonly || this.schema.template) {
      this.always_disabled = true;
      this.input.disabled = true;
    }

    this.input
            .addEventListener('change', function(e) {
              e.preventDefault();
              e.stopPropagation();

              // Don't allow changing if this field is a template
              if (self.schema.template) {
                this.value = self.value;
                return;
              }

              var val = this.value;

              // sanitize value
              var sanitized = self.sanitize(val);
              if (val !== sanitized) {
                this.value = sanitized;
              }

              if (window.File && window.FileReader && window.FileList && window.Blob) {

              } else {
                console.error('The File APIs are not fully supported in this browser.');
                return;
              }

              self.refreshValue();
              self.watch_listener();
              self.jsoneditor.notifyWatchers(self.path);
              if (self.parent)
                self.parent.onChildEditorChange(self);
              else
                self.jsoneditor.onChange();
            });

    if (this.format)
      this.input.setAttribute('data-schemaformat', this.format);

    this.control = this.getTheme().getFormControl(this.label, this.input, this.description);
    this.container.appendChild(this.control);

    // If the Select2 library is loaded
    if (this.input_type === "select" && window.$ && $.fn && $.fn.select2) {
      $(this.input).select2();
    }

    // Any special formatting that needs to happen after the input is added to the dom
    requestAnimationFrame(function() {
      self.afterInputReady();
    });

    // Compile and store the template
    if (this.schema.template) {
      this.template = this.jsoneditor.compileTemplate(this.schema.template, this.template_engine);
      this.refreshValue();
      this.jsoneditor.notifyWatchers(this.path);
    }
    else {
      this.refreshValue();
      this.jsoneditor.notifyWatchers(this.path);
    }
  },
  enable: function() {
    if (!this.always_disabled) {
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
    var self = this;

    // Code editor
    self.theme.afterInputReady(self.input);
  },
  refreshValue: function() {
    this.value = this.input.value;
    if (typeof this.value !== "string")
      this.value = '';
    this.serialized = this.value;
  },
  destroy: function() {


    this.template = null;
    this.input.parentNode.removeChild(this.input);
    if (this.label)
      this.label.parentNode.removeChild(this.label);
    if (this.description)
      this.description.parentNode.removeChild(this.description);

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
    var self = this;
    var vars;
    // If this editor needs to be rendered by a macro template
    if (this.template) {
      vars = this.getWatchedFieldValues();
      this.setValue(this.template(vars), false, true);
    }
    // If this editor uses a dynamic select box
    if (this.enumSource) {
      vars = this.getWatchedFieldValues();
      var select_options = [];
      var select_titles = [];

      for (var i = 0; i < this.enumSource.length; i++) {
        // Constant values
        if (this.enumSource[i] instanceof Array) {
          select_options = select_options.concat(this.enumSource[i]);
          select_titles = select_titles.concat(this.enumSource[i]);
        }
        // A watched field
        else if (vars[this.enumSource[i].source]) {
          var items = vars[this.enumSource[i].source];
          var j;

          // Only use a predefined part of the array
          if (this.enumSource[i].slice) {
            items = Array.prototype.slice.apply(items, this.enumSource[i].slice);
          }
          // Filter the items
          if (this.enumSource[i].filter) {
            var new_items = [];
            for (j = 0; j < items.length; j++) {
              if (filter({i: j, item: items[j]}))
                new_items.push(items[j]);
            }
            items = new_items;
          }

          var item_titles = [];
          var item_values = [];
          for (j = 0; j < items.length; j++) {
            var item = items[j];

            // Rendered value
            if (this.enumSource[i].value) {
              item_values[j] = this.enumSource[i].value({
                i: j,
                item: item
              });
            }
            // Use value directly
            else {
              item_values[j] = items[j];
            }

            // Rendered title
            if (this.enumSource[i].title) {
              item_titles[j] = this.enumSource[i].title({
                i: j,
                item: item
              });
            }
            // Use value as the title also
            else {
              item_titles[j] = item_values[j];
            }
          }

          // TODO: sort

          select_options = select_options.concat(item_values);
          select_titles = select_titles.concat(item_titles);
        }
      }

      this.theme.setSelectOptions(this.input, select_options, select_titles);
      this.select_options = select_options;

      // If the previous value is still in the new select options, stick with it
      if (select_options.indexOf(this.value) !== -1) {
        this.input.value = this.value;
      }
      // Otherwise, set the value to the first select option
      else {
        this.input.value = select_options[0];
        this.value = select_options[0] || "";
        if (this.parent)
          this.parent.onChildEditorChange(this);
        else
          this.jsoneditor.onChange();
        this.jsoneditor.notifyWatchers(this.path);
      }
    }

    this._super();
  },
  showValidationErrors: function(errors) {
    var self = this;

    var messages = [];
    $each(errors, function(i, error) {
      if (error.path === self.path) {
        messages.push(error.message);
      }
    });

    if (messages.length) {
      this.theme.addInputError(this.input, messages.join('. ') + '.');
    }
    else {
      this.theme.removeInputError(this.input);
    }
  }
});
