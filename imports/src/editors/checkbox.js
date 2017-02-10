JSONEditor.defaults.editors.checkbox = JSONEditor.AbstractEditor.extend({
  getDefault: function() {
    return this.schema.default || '';
  },
  setValue: function(value, initial) {
    value = this.typecast(value || '');

    // Sanitize value before setting it
    var sanitized = value;
    if (this.enum_values.indexOf(sanitized) < 0) {
      sanitized = this.enum_values[0];
    }


    // set value straight from the "checked" property.
    this.value = sanitized;
    this.input.checked = sanitized;
    this.jsoneditor.notifyWatchers(this.path);
  },
  typecast: function(value) {
    if (this.schema.type === "boolean") {
      return !!value;
    }
    else if (this.schema.type === "number") {
      return 1 * value;
    }
    else if (this.schema.type === "integer") {
      return Math.floor(value * 1);
    }
    else {
      return "" + value;
    }
  },
  getValue: function() {
    return this.value;
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
  // override updateHeaderText as it destroys our checkboxes
  updateHeaderText: function() {
    if (this.header && this.schema.format !== "checkbox") {
      this.header.textContent = this.getHeaderText();
    }
  },
  build: function() {
    var self = this;
    if (!this.getOption('compact', false))
      this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    if (this.schema.description)
      this.description = this.theme.getFormInputDescription(this.schema.description);

    this.input_type = 'checkbox';
    this.enum_values = [];

    self.enum_values = [true, false];

    if (this.getOption('compact'))
      this.container.setAttribute('class', this.container.getAttribute('class') + ' compact');
    if (this.schema.format === "checkbox" && this.schema.type === "boolean") {
      this.input = this.theme.getCheckbox(this.path, this.schema.default);
    }

    if (this.schema.readOnly || this.schema.readonly) {
      this.always_disabled = true;
      this.input.disabled = true;
    }

    var eventName = 'change'; // use onchange for select events, onclick for checkbox
    this.input.addEventListener(eventName, function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (self.schema.format === "checkbox") {
        // set the value to be the "checked" property of the checkbox
        self.value = this.checked;
      }
      if (self.parent)
        self.parent.onChildEditorChange(self);
      else
        self.jsoneditor.onChange();
      self.jsoneditor.notifyWatchers(self.path);
    });

    this.control = this.theme.getFormControl(this.label, this.input, this.description);
    this.container.appendChild(this.control);

    self.theme.afterInputReady(self.input);
    this.jsoneditor.notifyWatchers(this.path);
  },
  enable: function() {
    if (!this.always_disabled)
      this.input.disabled = false;
    this._super();
  },
  disable: function() {
    this.input.disabled = true;
    this._super();
  },
  destroy: function() {
    if (this.label)
      this.label.parentNode.removeChild(this.label);
    if (this.description)
      this.description.parentNode.removeChild(this.description);
    this.input.parentNode.removeChild(this.input);

    this._super();
  }
});
