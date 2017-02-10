/* global cordova, Camera */ // jsHint global declarations
JSONEditor.defaults.editors.imageFile = JSONEditor.AbstractEditor.extend({
  getDefault: function () {
    return this.schema.default || '';
  },
  setValue: function (value, initial, from_template) {
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
  removeProperty: function () {
    this._super();
    this.input.style.display = 'none';
    if (this.description)
      this.description.style.display = 'none';
    this.theme.disableLabel(this.label);
  },
  addProperty: function () {
    this._super();
    this.input.style.display = '';
    if (this.description)
      this.description.style.display = '';
    this.theme.enableLabel(this.label);
  },
  build: function () {
    var self = this;
    if (!this.getOption('compact', false))
      this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if (this.schema.description)
      this.description = this.theme.getFormInputDescription(this.schema.description);

    this.format = this.schema.format;
    if (!this.format && this.schema.media && this.schema.media.type) {
      this.format = this.schema.media.type.replace(/(^(application|text)\/(x-)?(script\.)?)|(-source$)/g, '');
    }

    // Specific format
    if (this.format) {
      // input type=file accept=image/*
      if (this.format === 'imageFile') {
        // inspired by:
        //  http://stackoverflow.com/a/18803568/956779
        var divElem = document.createElement('div');
        divElem.setAttribute("class", "image-upload");

        var fileInput = this.theme.getFormInputField('file');
        fileInput.setAttribute("accept", "image/*");
        fileInput.setAttribute("class", "hidden");
        var uuid = $uuid();
        fileInput.setAttribute("id", uuid);

        var labelElem = document.createElement('label');
        labelElem.setAttribute("for", uuid);
        var placeholderImg = document.createElement('img');
        //TODO make this an option rather than a hard-coded image.
        // An add-image image. stops us getting nasty broken image icons. This becomes a button.
        placeholderImg.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBoZWlnaHQ9IjQ4cHgiIGlkPSJMYXllcl8xIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiIgd2lkdGg9IjQ4cHgiIHhtbDpzcGFjZT0icHJlc2VydmUiPgogIDxnPgogICAgPGc+CiAgICAgIDxnPgogICAgICAgIDxwYXRoIGQ9Ik0yNTYgNDhDMTQxLjEgNDggNDggMTQxLjEgNDggMjU2czkzLjEgMjA4IDIwOCAyMDhjMTE0LjkgMCAyMDgtOTMuMSAyMDgtMjA4UzM3MC45IDQ4IDI1NiA0OHogTTI1NiA0NDYuNyBjLTEwNS4xIDAtMTkwLjctODUuNS0xOTAuNy0xOTAuN1MxNTAuOSA2NS4zIDI1NiA2NS4zUzQ0Ni43IDE1MC45IDQ0Ni43IDI1NlMzNjEuMSA0NDYuNyAyNTYgNDQ2Ljd6Ii8+CiAgICAgIDwvZz4KICAgIDwvZz4KICAgIDxnPgogICAgICA8cG9seWdvbiBwb2ludHM9IjI2NC4xLDEyOCAyNDcuMywxMjggMjQ3LjMsMjQ3LjkgMTI4LDI0Ny45IDEyOCwyNjQuNyAyNDcuMywyNjQuNyAyNDcuMywzODQgMjY0LjEsMzg0IDI2NC4xLDI2NC43IDM4NCwyNjQuNyAzODQsMjQ3LjkgMjY0LjEsMjQ3LjkiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPgo=";

        labelElem.appendChild(placeholderImg);

        divElem.appendChild(labelElem);
        divElem.appendChild(fileInput);

        this.input = divElem;
        this.input_type = 'file';
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

    var eventName = 'change';
    if ((typeof cordova !== "undefined") && (cordova.platformId === "android")) {
      // the 'change' event doesn't seem to fire on android
      eventName = 'click';
    }

    this.input
            .addEventListener(eventName, function (e) {
              var val = this.value,
                      sanitized = self.sanitize(val), // sanitize value
                      fileinput = this.querySelector("input[type=file]"),
                      imgelem = this.querySelector("img");

              e.preventDefault();
              e.stopPropagation();

              // Don't allow changing if this field is a template
              if (self.schema.template) {
                this.value = self.value;
                return;
              }

              // sanitize value
              if (val !== sanitized) {
                this.value = sanitized;
              }

              // use cordova camera and notification plugins
              function onImageNotChosenFail(message) {
                navigator.notification.alert(
                        'Failed because: ' + message, // message
                        function () {
                        }, // callback that does nothing
                        'Failed', // title
                        'OK'                  // buttonName
                        );
              }

// process the confirmation dialog result
              function obtainPicture(buttonIndex) {
                if (buttonIndex === 1) {
                  // take a new photo
                  navigator.camera.getPicture(onImageChosenSuccess, onImageNotChosenFail, {quality: 75, destinationType: Camera.DestinationType.FILE_URI});

                } else {
                  // Choose one from the library
                  navigator.camera.getPicture(onImageChosenSuccess, onImageNotChosenFail, {
                    quality: 75,
                    destinationType: Camera.DestinationType.FILE_URI,
                    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                    encodingType: Camera.EncodingType.JPEG,
                    mediaType: Camera.MediaType.PICTURE
                  }
                  );
                }
              }


              function onImageChosenSuccess(imageURI) {
                // use the data URI as the result.
                imgelem.src = imageURI;
                // the value will be an object, with the dataURI and metadata
                // set it up once the thumbnail has been loaded.
                var imageObj = new Image();
                imageObj.onload = function () {
                  var valueObj = {
                    "dataURI": this.src,
                    "width": this.width,
                    "name": imageURI,
                    "height": this.height //,
//                        "name": file.name,
//                        "size": file.size,
//                        "type": file.type,
//                        "lastModificationDate": file.lastModifiedDate
                  };
                  // if filename doesn't have an extension, try to derive one from the file type
//                      if (file.name.indexOf(".") === -1) {
//                        if (file.type.indexOf("/") !== -1) {
//                          valueObj.name += "." + file.type.split("/")[1];
//                        }
//                      }
                  self.setValue(valueObj);
                };
                imageObj.src = imageURI;

                //TODO: Move this to theme and make it more flexible.
                imgelem.style.maxWidth = "25%";
                imgelem.style.maxHeight = "25%";

              }


              if ((typeof cordova !== "undefined") && (cordova.platformId === "android")) {
                // Show a custom confirmation dialog
                //
                navigator.notification.confirm(
                        'Where should the image come from?', // message
                        obtainPicture, // callback to invoke with index of button pressed
                        'Choose Image Source', // title
                        ['Take Photo', 'Choose Existing']         // buttonLabels
                        );
              } else { // iOS or HTML
                console.log("not android");
                if (window.File && window.FileReader && window.FileList && window.Blob) {

                } else {
                  console.error('The File APIs are not fully supported in this browser.');
                  return;
                }

                if (!this) {
                  console.error("Um, couldn't find the fileinput element.");
                }
                else if (!fileinput.files) {
                  console.error("This browser doesn't seem to support the `files` property of file inputs.");
                }
                else if (!fileinput.files[0]) {
                  console.error("Please select a file before clicking 'Load'");
                }
                else {
                  var file = fileinput.files[0];
                  var fr = new FileReader();
                  fr.onload = function (params) {
                    // use the data URI as the result.
                    imgelem.src = fr.result;
                    // the value will be an object, with the dataURI and metadata
                    // set it up once the thumbnail has been loaded.
                    var imageObj = new Image();
                    imageObj.onload = function () {
                      var valueObj = {
                        "dataURI": this.src,
                        "width": this.width,
                        "height": this.height,
                        "name": file.name,
                        "size": file.size,
                        "type": file.type,
                        "lastModificationDate": file.lastModifiedDate
                      };
                      // if filename doesn't have an extension, try to derive one from the file type
                      if (file.name.indexOf(".") === -1) {
                        if (file.type.indexOf("/") !== -1) {
                          valueObj.name += "." + file.type.split("/")[1];
                        }
                      }
                      self.setValue(valueObj);
                    };
                    imageObj.src = fr.result;

                    //TODO: Move this to theme and make it more flexible.
                    imgelem.style.maxWidth = "25%";
                    imgelem.style.maxHeight = "25%";
                  };

                  fr.readAsDataURL(file);
                }
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

    this.control = this.theme.getFormControl(this.label, this.input, this.description, this.schema);
    this.container.appendChild(this.control);

    // If the Select2 library is loaded
    if (this.input_type === "select" && window.$ && $.fn && $.fn.select2) {
      $(this.input).select2();
    }

    // Any special formatting that needs to happen after the input is added to the dom
    requestAnimationFrame(function () {
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
  enable: function () {
    if (!this.always_disabled) {
      this.input.disabled = false;
      // TODO: WYSIWYG and Markdown editors
    }
    this._super();
  },
  disable: function () {
    this.input.disabled = true;
    // TODO: WYSIWYG and Markdown editors
    this._super();
  },
  afterInputReady: function () {
    var self = this;

    // Code editor
    self.theme.afterInputReady(self.input);
  },
  refreshValue: function () {
    this.value = this.input.value;
    if (typeof this.value !== "string")
      this.value = '';
    this.serialized = this.value;
  },
  destroy: function () {


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
  sanitize: function (value) {
    return value;
  },
  /**
   * Re-calculates the value if needed
   */
  onWatchedFieldChange: function () {
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
        var j;
        // Constant values
        if (this.enumSource[i] instanceof Array) {
          select_options = select_options.concat(this.enumSource[i]);
          select_titles = select_titles.concat(this.enumSource[i]);
        }
        // A watched field
        else if (vars[this.enumSource[i].source]) {
          var items = vars[this.enumSource[i].source];

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
  showValidationErrors: function (errors) {
    var self = this;

    var messages = [];
    $each(errors, function (i, error) {
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
