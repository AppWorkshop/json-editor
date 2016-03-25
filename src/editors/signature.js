/* global SignaturePad */
JSONEditor.defaults.editors.signature = JSONEditor.AbstractEditor.extend({
  getNumColumns: function () {
    return 4;
  },
  build: function () {
    var self = this;
    this.title = this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if (this.schema.description)
      this.description = this.theme.getFormInputDescription(this.schema.description);

    // Input that holds the base64 string

    var divElem = this.theme.getContainer();
    $(divElem).addClass("signature");
    var uuid = $uuid();

    var canvas = this.theme.getCanvas();
    canvas.setAttribute("id", uuid);

    divElem.appendChild(canvas);
    self.input = divElem;

    if (SignaturePad) {
      this.signaturePad = new SignaturePad(canvas);
      var sigpad = this.signaturePad;
      sigpad.onEnd = function () {
        self.setValue(
                {
                  dataURI: sigpad.toDataURL(),
                  height: canvas.height,
                  width: canvas.width,
                  timestamp: self.translate("signature_timestamp", [(new Date()).toLocaleString()]),
                  hasValue: !self.signaturePad.isEmpty()
                }
        );
        self.jsoneditor.notifyWatchers(self.path);
        if (self.parent)
          self.parent.onChildEditorChange(self);
        else
          self.jsoneditor.onChange();
      };
      var buttonHolder = this.theme.getButtonHolder();
      var button = this.getButton(self.translate("clear_signature_button"), 'cancel');
      buttonHolder.appendChild(button);
      button.addEventListener("click",
              function () {
                self.signaturePad.clear();
                self.setValue("");
                self.jsoneditor.notifyWatchers(self.path);
              }); // clear signature on press.
      divElem.appendChild(buttonHolder);
    } else {
      this.signaturePad = undefined;
    }


    if (this.getOption('compact'))
      this.container.setAttribute('class', this.container.getAttribute('class') + ' compact');

    if (this.schema.readOnly || this.schema.readonly || this.schema.template) {
      this.always_disabled = true;
    }

    // Compile and store the template
    if (this.schema.template) {
      this.template = this.jsoneditor.compileTemplate(this.schema.template, this.template_engine);
      this.jsoneditor.notifyWatchers(this.path);
    }
    else {
      this.jsoneditor.notifyWatchers(this.path);
    }

    this.control = this.theme.getFormControl(this.label, divElem, this.description);
    this.container.appendChild(this.control);

    function resizeCanvas() {
      var parent = $(canvas).parent();
      // resize to fill the parent, apart from the "clear signature" button at the bottom.
      resize(parent.width(), (parent.height() - parent.children('.btn-group').height()));
    }
    function resize(w, h){

// add a "getImageDataWithoutBlankMargins" function to the signature.
// from https://github.com/szimek/signature_pad/issues/49#issue-29108215

      var getImageURIWithoutBlankMargins = function (sigpad) {
        var ctx = sigpad._ctx,
          canvas = sigpad._ctx.canvas;
        var imgWidth = canvas.width;
        var imgHeight = canvas.height;
        if (imgWidth > 0 && imgHeight > 0) {
          var imageData = ctx.getImageData(0, 0, imgWidth, imgHeight),
            data = imageData.data,
            getAlpha = function(x, y) {
              return data[(imgWidth*y + x) * 4 + 3];
            },
            scanY = function (fromTop) {
              var offset = fromTop ? 1 : -1;

              // loop through each row
              for(var y = fromTop ? 0 : imgHeight - 1; fromTop ? (y < imgHeight) : (y > -1); y += offset) {

                // loop through each column
                for(var x = 0; x < imgWidth; x++) {
                  if (getAlpha(x, y)) {
                    return y;
                  }
                }
              }
              return null; // all image is white
            },
            scanX = function (fromLeft) {
              var offset = fromLeft? 1 : -1;

              // loop through each column
              for(var x = fromLeft ? 0 : imgWidth - 1; fromLeft ? (x < imgWidth) : (x > -1); x += offset) {

                // loop through each row
                for(var y = 0; y < imgHeight; y++) {
                  if (getAlpha(x, y)) {
                    return x;
                  }
                }
              }
              return null; // all image is white
            };

          var cropTop = scanY(true),
            cropBottom = scanY(false),
            cropLeft = scanX(true),
            cropRight = scanX(false);

          // figure out which dimension is larger
          var referenceDim,
            heightDifference,
            heightDifferencePC,
            widthDifference,
            widthDifferencePC,
            newHeight,
            newWidth;

          // how much smaller is the (desired) new canvas?
          widthDifference = canvas.width - (cropRight-cropLeft) - 2 ; // could be negative if it's been reduced in size.
          heightDifference = canvas.height - (cropBottom-cropTop) - 2; // ditto

          widthDifferencePC = (widthDifference / canvas.width); // e.g. 10% smaller would give us 0.1
          heightDifferencePC = (heightDifference / canvas.height);

          // calculate how our image needs to scale, keeping aspect ratio of its data
          referenceDim = Math.min(widthDifferencePC, heightDifferencePC);
          newHeight = canvas.height - (referenceDim * canvas.height);
          newWidth = canvas.width - (referenceDim * canvas.width);


          var relevantData = sigpad._ctx.getImageData(cropLeft, cropTop, (cropRight-cropLeft+2), (cropBottom-cropTop+2));
          // create an off-screen canvas of the requisite size, to get imagedata as a data uri
          var tempCanvas = document.createElement('canvas');
          tempCanvas.width = newWidth;
          tempCanvas.height = newHeight;
          var tempctx = tempCanvas.getContext('2d');
          tempctx.putImageData(relevantData, 0, 0);
          return tempCanvas.toDataURL("image/png");
        }
        return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'; // empty SVG data uri

      };

      // which one's been reduced by more: height, or width?
      var referenceDim,
        heightDifference,
        heightDifferencePC,
        widthDifference,
        widthDifferencePC,
        newHeight,
        newWidth;
      // how much bigger is the (desired) new canvas?
      widthDifference = w - canvas.width ; // could be negative if it's been reduced in size.
      heightDifference = h - canvas.height; // ditto

      widthDifferencePC = (widthDifference / canvas.width); // e.g. 10% larger would give us 0.1
      heightDifferencePC = (heightDifference / canvas.height);

      // calculate how our image needs to scale, keeping aspect ratio of its data
      referenceDim = Math.min(widthDifferencePC, heightDifferencePC);
      newHeight = canvas.height + (referenceDim * canvas.height);
      newWidth = canvas.width + (referenceDim * canvas.width);

      if (!self.signaturePad.isEmpty()) {
        var datauri = getImageURIWithoutBlankMargins(self.signaturePad);

        canvas.width = w;
        canvas.height = h;

        var ctx = canvas.getContext('2d');
        var img = new Image();
        img.onload = function () {
          // scale the image.
          ctx.drawImage(img, 0, 0, newWidth, newHeight); // Or at whatever offset you like
        };
        img.src = datauri;
      } else {
        canvas.width = w;
        canvas.height = h;
      }
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

  },
  enable: function () {
    this._super();
  },
  disable: function () {
    this._super();
  },
  setValue: function (val) {
    if (val === null)
      val = "";
    else if (typeof val === "object")
      val = JSON.stringify(val);
    else if (typeof val !== "string")
      val = "" + val;

    if (val === this.serialized)
      return;

    var changed = this.getValue() !== val;
    this.value = val;
    // Bubble this setValue to parents if the value changed
    this.onChange(changed);

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


