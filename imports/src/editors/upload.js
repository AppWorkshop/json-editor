JSONEditor.defaults.editors.upload = JSONEditor.AbstractEditor.extend({
  getNumColumns: function() {
    return 4;
  },
  build: function() {    
    var self = this;
    this.title = this.header = this.label = this.theme.getFormInputLabel(this.getTitle());

    // Input that holds the base64 string
    this.input = this.theme.getFormInputField('hidden');
    this.container.appendChild(this.input);

    // Don't show uploader if this is readonly
    if(!this.schema.readOnly && !this.schema.readonly) {

      if(!this.jsoneditor.options.upload) throw "Upload handler required for upload editor";

      // inspired by:
      //  http://stackoverflow.com/a/18803568/956779
      var divElem = document.createElement('div');
      divElem.setAttribute("class", "image-upload");

      var fileInput = this.theme.getFormInputField('file');
      this.uploader = fileInput;
      var accept = "image/*";
      if (this.schema.options && this.schema.options.accept) {
        accept = this.schema.options.accept;
      }
      fileInput.setAttribute("accept", accept);
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

      // File uploader
      // this.uploader = this.theme.getFormInputField('file');

      if (this.schema.readOnly || this.schema.readonly || this.schema.template) {
        this.always_disabled = true;
        this.input.disabled = true;
      }

      // var eventName = 'change';
      // if ((typeof cordova !== "undefined") && (cordova.platformId === "android")) {
      //   // the 'change' event doesn't seem to fire on android
      //   eventName = 'click';
      // }

      this.uploader.addEventListener("change",function(e) {
        e.preventDefault();
        e.stopPropagation();

        function previewURLAndUploadFile(previewURL, fileObj) {
          // var fr = new FileReader();
          // fr.onload = function(evt) {
          // self.preview_value = e.target.result;
          self.refreshPreview(previewURL);
          self.onChange(true);
          // fr = null;

          self.theme.removeInputError(self.uploader);

          if (self.theme.getProgressBar) {
            self.progressBar = self.theme.getProgressBar();
            self.preview.appendChild(self.progressBar);
          }

          self.jsoneditor.options.upload(self.path, fileObj, {
            success: function (url) {
              self.setValue(url);

              if (self.parent) self.parent.onChildEditorChange(self);
              else self.jsoneditor.onChange();

              if (self.progressBar) self.preview.removeChild(self.progressBar);
            },
            failure: function (error) {
              self.theme.addInputError(self.uploader, error);
              if (self.progressBar) self.preview.removeChild(self.progressBar);
            },
            updateProgress: function (progress) {
              if (self.progressBar) {
                if (progress) self.theme.updateProgressBar(self.progressBar, progress);
                else self.theme.updateProgressBarUnknown(self.progressBar);
              }
            }
          });
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
          var picOptions = {
            quality: 75,
            destinationType: Camera.DestinationType.FILE_URI,
            correctOrientation: true,
            encodingType: Camera.EncodingType.JPEG
          };

          if (buttonIndex === 1) {

            picOptions.sourceType = Camera.PictureSourceType.CAMERA;
            picOptions.allowEdit = true;


          } else {
            picOptions.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
            picOptions.mediaType = Camera.MediaType.PICTURE;

          }
          // take a new photo
          navigator.camera.getPicture(onImageChosenSuccess, onImageNotChosenFail, picOptions);
        }


        function onImageChosenSuccess(imageURI) {

          window.resolveLocalFileSystemURL(imageURI, function success(fileEntry) {

            // Do something with the FileEntry object, like write to it, upload it, etc.
            // writeFile(fileEntry, imgUri);
            console.log("got file: " + fileEntry.fullPath);
            // displayFileData(fileEntry.nativeURL, "Native URL");
            // use mule uploader with fileEntry.file
            fileEntry.file(function (file) {

              previewURLAndUploadFile(fileEntry.toInternalURL(), file);
            }, function (error) {
              console.error(error);
            });

          });


        }

        // if ((typeof cordova !== "undefined") && (cordova.platformId === "android")) {
        //   // Show a custom confirmation dialog
        //   //
        //   navigator.notification.confirm(
        //     'Where should the image come from?', // message
        //     obtainPicture, // callback to invoke with index of button pressed
        //     'Choose Image Source', // title
        //     ['Take Photo', 'Choose Existing']         // buttonLabels
        //   );
        // } else if(this.files && this.files.length) {
          var objectURL = window.URL.createObjectURL(this.files[0]);

          previewURLAndUploadFile(objectURL, this.files[0]);



          // };

        // }
      });
    }

    var description = this.schema.description;
    if (!description) description = '';


    // this.control = this.theme.getFormControl(this.label, this.uploader||this.input, this.preview);
    this.control = this.theme.getFormControl(this.label, this.input, this.description, this.schema.info);
    this.container.appendChild(this.control);
    this.preview = this.theme.getFormInputDescription(description);
    this.container.appendChild(this.preview);
  },
  refreshPreview: function(objectURL) {
    // if(this.last_preview === this.preview_value) return;
    // this.last_preview = this.preview_value;

    var imgelem = this.container.querySelector("img");
    imgelem.src = objectURL;
    //TODO: Move this to theme and make it more flexible.
    imgelem.style.maxWidth = "25%";
    imgelem.style.maxHeight = "25%";


    // this.preview.innerHTML = '';
    //
    //
    // var self = this;
    //
    // var file = this.uploader.files[0];
    //
    // var mime = file.type;
    // this.preview.innerHTML = '<strong>Type:</strong> '+mime+', <strong>Size:</strong> '+file.size+' bytes';
    // if((!mime) || mime.substr(0,5)==="image") {
    //   this.preview.innerHTML += '<br>';
    //   var img = document.createElement('img');
    //   img.style.maxWidth = '100%';
    //   img.style.maxHeight = '100px';
    //   if (objectURL) {
    //     img.src = objectURL;
    //     img.onload = function() {
    //       window.URL.revokeObjectURL(objectURL);
    //     }
    //
    //   }
    //   this.preview.appendChild(img);
    // }
    //
    // this.preview.innerHTML += '<br>';
    // var uploadButton = this.getButton('Upload', 'upload', 'Upload');
    // this.preview.appendChild(uploadButton);
    // uploadButton.addEventListener('click',function(event) {
    //   event.preventDefault();
    //
    //   uploadButton.setAttribute("disabled", "disabled");
      // self.theme.removeInputError(self.uploader);
      //
      // if (self.theme.getProgressBar) {
      //   self.progressBar = self.theme.getProgressBar();
      //   self.preview.appendChild(self.progressBar);
      // }
      //
      // self.jsoneditor.options.upload(self.path, file, {
      //   success: function(url) {
      //     self.setValue(url);
      //
      //     if(self.parent) self.parent.onChildEditorChange(self);
      //     else self.jsoneditor.onChange();
      //
      //     if (self.progressBar) self.preview.removeChild(self.progressBar);
      //     uploadButton.removeAttribute("disabled");
      //   },
      //   failure: function(error) {
      //     self.theme.addInputError(self.uploader, error);
      //     if (self.progressBar) self.preview.removeChild(self.progressBar);
      //     uploadButton.removeAttribute("disabled");
      //   },
      //   updateProgress: function(progress) {
      //     if (self.progressBar) {
      //       if (progress) self.theme.updateProgressBar(self.progressBar, progress);
      //       else self.theme.updateProgressBarUnknown(self.progressBar);
      //     }
      //   }
      // });
    // });
  },
  enable: function() {
    if(this.uploader) this.uploader.disabled = false;
    this._super();
  },
  disable: function() {
    if(this.uploader) this.uploader.disabled = true;
    this._super();
  },
  setValue: function(val) {
    if(this.value !== val) {
      this.value = val;
      this.input.value = this.value;
      this.onChange();
    }
  },
  destroy: function() {
    if(this.preview && this.preview.parentNode) this.preview.parentNode.removeChild(this.preview);
    if(this.title && this.title.parentNode) this.title.parentNode.removeChild(this.title);
    if(this.input && this.input.parentNode) this.input.parentNode.removeChild(this.input);
    if(this.uploader && this.uploader.parentNode) this.uploader.parentNode.removeChild(this.uploader);

    this._super();
  }
});
