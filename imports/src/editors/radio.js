/* global _ */
JSONEditor.defaults.editors.radio = JSONEditor.defaults.editors.select.extend({
  setValue: function (value, initial) {
    value = this.typecast(value || '');

    // Sanitize value before setting it
    var sanitized = value;
    if (this.enum_values.indexOf(sanitized) < 0) { // not found, default to first
      this.input.value = "";
      this.value = "";
      return;
    }

    if (this.value === sanitized) {
      return;
    }

    this.value = sanitized;
    var elem = this.input.querySelector('input[type=radio][value="' + value + '"]');
    elem.checked = true;
    var radioNodeList = this.input.querySelectorAll('input[type=radio]');
    for (var i = 0; i<radioNodeList.length; i++) {
      var item = radioNodeList[i];
      item.parentElement.classList.remove("active");
    }


    elem.parentElement.classList.add("active"); // add the active CSS class to the label

    this.input.value = sanitized;
    this.onChange();

  },
  getDefault: function() {
    if(this.schema.default) return this.schema.default;
    return; // return undefined
  },
  register: function () {
    if (this.editors) {
      for (var i = 0; i < this.editors.length; i++) {
        if (!this.editors[i])
          continue;
        this.editors[i].unregister();
      }
      if (this.editors[this.type])
        this.editors[this.type].register();
    }
    this._super();
  },
  unregister: function () {
    this._super();
    if (this.editors) {
      for (var i = 0; i < this.editors.length; i++) {
        if (!this.editors[i])
          continue;
        this.editors[i].unregister();
      }
    }
  },
  getNumColumns: function () {
    return this._super();
  },
  typecast: function (value) {
    return this._super(value);
  },
  getValue: function () {
    var checkedElem = document.querySelector("input[name=\"" + this.path + "\"]:checked");
    if (checkedElem) {
      this.value = checkedElem.value;
    }
    return this.value;
  },
  preBuild: function () {
    var self = this;
    this.input_type = 'radio';
    this.enum_options = [];
    this.enum_values = [];
    this.enum_display = [];
    this.editors = [];
    this.validators = [];

    // "type":"radio",
    // "options": { "enum_titles": ["Swiss Cheese","Cheddar Cheese","Gouda Cheese"] },
    // "enum": ["swiss","cheddar","gouda"],
    // "default": "gouda"
    // Enum options enumerated
    if (this.schema.enum) {
      var display = this.schema.options && this.schema.options.enum_titles || [];

      $each(this.schema.enum, function (i, option) {
        self.enum_options[i] = "" + option;
        self.enum_display[i] = "" + (display[i] || option);
        self.enum_values[i] = self.typecast(option);
      });
    }
  },
  build: function () {
    var self = this;
    var container = this.container;


    if (!this.options.compact)
      this.header = this.label = this.theme.getFormInputLabel(this.getTitle());
    this.container.appendChild(this.header);
    if (this.schema.description)
      this.description = this.theme.getFormInputDescription(this.schema.description);

    if (this.options.compact)
      this.container.setAttribute('class', this.container.getAttribute('class') + ' compact');

    this.input = this.theme.getRadioGroupFormControl(this.path, self.enum_options, self.enum_display, this.schema.default);


    if (this.schema.readOnly || this.schema.readonly) {
      this.always_disabled = true;
      this.input.disabled = true;
    }

    this.input.addEventListener('change', function (e) {
      e.preventDefault();
      e.stopPropagation();
      self.onInputChange();
    });

    this.control = this.theme.getFormControl(this.label, this.input, this.description,this.schema.info);
    this.container.appendChild(this.control);

    this.value = this.schema.default;
  },
  onInputChange: function () {
    this._super();
  },
  setupSelect2: function () {
    this._super();
  },
  postBuild: function () {
    this._super();
  },
  onWatchedFieldChange: function () {
    this._super();
  },
  enable: function () {
    if (this.editors) {
      for (var i = 0; i < this.editors.length; i++) {
        if (!this.editors[i])
          continue;
        this.editors[i].enable();
      }
    }
    var radios = document.querySelectorAll("input[name=\"" + this.path + "\"]");
    var radioList = Array.prototype.slice.call(radios);
    if (radioList && radioList.length > 0) { // loop through each radio and enable it.
      radioList.forEach(
              function (item) {
                item.disabled = false;
              }
      );
    }
    this._super();
  },
  disable: function () {
    if (this.editors) {
      for (var i = 0; i < this.editors.length; i++) {
        if (!this.editors[i])
          continue;
        this.editors[i].disable();
      }
      var radios = document.querySelectorAll("input[name=\"" + this.path + "\"]");
      var radioList = Array.prototype.slice.call(radios);
      if (radioList && radioList.length > 0) { // loop through each radio and disable it.
        radioList.forEach(
                function (item) {
                  item.disabled = true;
                }
        );
      }

    }
    this._super();
  },
  destroy: function () {
    this._super();
  }
});
