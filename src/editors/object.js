JSONEditor.defaults.editors.object = JSONEditor.AbstractEditor.extend({
  getDefault: function() {
    return $extend({},this.schema.default || {});
  },
  getChildEditors: function() {
    return this.editors;
  },
  register: function() {
    this._super();
    if(this.editors) {
      for(var i in this.editors) {
        if(!this.editors.hasOwnProperty(i)) continue;
        this.editors[i].register();
      }
    }
  },
  unregister: function() {
    this._super();
    if(this.editors) {
      for(var i in this.editors) {
        if(!this.editors.hasOwnProperty(i)) continue;
        this.editors[i].unregister();
      }
    }
  },
  enable: function() {
    if(this.editjson_button) this.editjson_button.disabled = false;
    if(this.addproperty_button) this.addproperty_button.disabled = false;
    
    this._super();
    if(this.editors) {
      for(var i in this.editors) {
        if(!this.editors.hasOwnProperty(i)) continue;
        this.editors[i].enable();
      }
    }
  },
  disable: function() {
    if(this.editjson_button) this.editjson_button.disabled = true;
    if(this.addproperty_button) this.addproperty_button.disabled = true;
    this.hideEditJSON();
    
    
    this._super();
    if(this.editors) {
      for(var i in this.editors) {
        if(!this.editors.hasOwnProperty(i)) continue;
        this.editors[i].disable();
      }
    }
  },
  layoutEditors: function() {
    var self = this;
    var rows = [];
    $each(this.editors, function(key,editor) {
      if(editor.property_removed) return;
      var found = false;
      var width = editor.getNumColumns();
      var height = editor.container.offsetHeight;
      // See if the editor will fit in any of the existing rows first
      for(var i=0; i<rows.length; i++) {
        // If the editor will fit in the row horizontally
        if(rows[i].width + width <= 12) {
          // If the editor is close to the other elements in height
          // i.e. Don't put a really tall editor in an otherwise short row or vice versa
          if(!height || (rows[i].minh*.5 < height && rows[i].maxh*2 > height)) {
            found = i;
            continue;
          }
        }
      }
      
      // If there isn't a spot in any of the existing rows, start a new row
      if(found === false) {
        rows.push({
          width: 0,
          minh: 999999,
          maxh: 0,
          editors: []
        });
        found = rows.length-1;
      }
      
      rows[found].editors.push({
        key: key,
        //editor: editor,
        width: width,
        height: height
      });
      rows[found].width += width;
      rows[found].minh = Math.min(rows[found].minh,height);
      rows[found].maxh = Math.max(rows[found].maxh,height);
    });
    
    // Make almost full rows width 12
    // Do this by increasing all editors' sizes proprotionately
    // Any left over space goes to the biggest editor
    // Don't touch rows with a width of 6 or less
    for(var i=0; i<rows.length; i++) {
      if(rows[i].width < 12 && rows[i].width > 6) {
        var biggest = false;
        var new_width = 0;
        for(var j=0; j<rows[i].editors.length; j++) {
          if(biggest === false) biggest = j;
          else if(rows[i].editors[j].width > rows[i].editors[biggest].width) biggest = j;
          rows[i].editors[j].width *= 12/rows[i].width;
          rows[i].editors[j].width = Math.floor(rows[i].editors[j].width);
          new_width += rows[i].editors[j].width;
        }
        if(new_width < 12) rows[i].editors[biggest].width += 12-new_width;
        rows[i].width = 12;
      }
    }
    
    // layout hasn't changed
    if(this.layout === JSON.stringify(rows)) return false;
    this.layout = JSON.stringify(rows);
    
    // Layout the form
    var container = document.createElement('div');
    for(var i=0; i<rows.length; i++) {
      var row = this.theme.getGridRow();
      container.appendChild(row);
      for(var j=0; j<rows[i].editors.length; j++) {
        var editor = this.editors[rows[i].editors[j].key];
        this.theme.setGridColumnSize(editor.container,rows[i].editors[j].width);
        row.appendChild(editor.container);
      }
    }
    this.row_container.innerHTML = '';
    this.row_container.appendChild(container);
  },
  build: function() {
    this.editors = {};
    var self = this;

    this.schema.properties = this.schema.properties || {};

    // If the object should be rendered as a table row
    if(this.getOption('table_row',false)) {
      this.editor_holder = this.container;
      $each(this.schema.properties, function(key,schema) {
        var editor = self.jsoneditor.getEditorClass(schema, self.jsoneditor);
        var holder = self.editor_holder.appendChild(self.getTheme().getTableCell());

        self.editors[key] = new editor({
          jsoneditor: self.jsoneditor,
          schema: schema,
          container: holder,
          path: self.path+'.'+key,
          parent: self,
          compact: true
        });
      });
      this.no_link_holder = true;
    }
    // If the object should be rendered as a table
    else if(this.getOption('table',false)) {
      // TODO: table display format
      throw "Not supported yet";
    }
    // If the object should be rendered as a div
    else {
      this.header = document.createElement('span');
      this.header.textContent = this.getTitle();
      this.title = this.getTheme().getHeader(this.header);
      this.container.appendChild(this.title);
      this.container.style.position = 'relative';
      
      // Edit JSON modal
      this.editjson_holder = this.theme.getModal();
      this.editjson_holder.style.height = '210px';
      this.editjson_holder.style.width = '300px';
      this.editjson_textarea = this.theme.getTextareaInput();
      this.editjson_textarea.style.height = '170px';
      this.editjson_textarea.style.width = '100%';
      this.editjson_save = this.getButton('Save','save','Save');
      this.editjson_save.style.position = 'absolute';
      this.editjson_save.style.bottom = '5px';
      this.editjson_save.style.right = '5px';
      this.editjson_save.addEventListener('click',function() {
        self.saveJSON();
      });
      this.editjson_cancel = this.getButton('Cancel','cancel','Cancel');
      this.editjson_cancel.style.position = 'absolute';
      this.editjson_cancel.style.bottom = '5px';
      this.editjson_cancel.style.left = '5px';
      this.editjson_cancel.addEventListener('click',function() {
        self.hideEditJSON();
      });
      this.editjson_holder.appendChild(this.editjson_textarea);
      this.editjson_holder.appendChild(this.editjson_save);
      this.editjson_holder.appendChild(this.editjson_cancel);
      
      // Manage Properties modal
      this.addproperty_holder = this.theme.getModal();
      this.addproperty_holder.style.height = '200px';
      this.addproperty_holder.style.width = '300px';
      this.addproperty_list = document.createElement('div');
      this.addproperty_list.style.width = '295px';
      this.addproperty_list.style.height = '160px';
      this.addproperty_list.style.marginBottom = '5px';
      this.addproperty_list.style.overflowY = 'auto';
      this.addproperty_list.style.overflowX = 'hidden';
      this.addproperty_list.style.paddingLeft = '5px';
      this.addproperty_add = this.getButton('add','add','add');
      this.addproperty_add.style.float = 'right';
      this.addproperty_input = this.theme.getFormInputField('text');
      this.addproperty_input.setAttribute('placeholder','Property name...');
      this.addproperty_input.style.width = '200px';
      this.addproperty_input.style.float = 'left';
      this.addproperty_add.addEventListener('click',function() {
        if(self.addproperty_input.value) {
          if(self.editors[self.addproperty_input.value]) {
            alert('there is already a property with that name');
            return;
          }
          
          self.addObjectProperty(self.addproperty_input.value);
          self.addPropertyCheckbox(self.addproperty_input.value);
          if(self.editors[self.addproperty_input.value]) {
            self.editors[self.addproperty_input.value].disable();
          }
        }
      });
      this.addproperty_holder.appendChild(this.addproperty_list);
      this.addproperty_holder.appendChild(this.addproperty_add);
      this.addproperty_holder.appendChild(this.addproperty_input);
      
      
      // Description
      if(this.schema.description) {
        this.description = this.getTheme().getDescription(this.schema.description);
        this.container.appendChild(this.description);
      }
      
      // Validation error placeholder area
      this.error_holder = document.createElement('div');
      this.container.appendChild(this.error_holder);
      
      // Container for child editor area
      this.editor_holder = this.getTheme().getIndentedPanel();
      this.editor_holder.style.paddingBottom = '0';
      this.container.appendChild(this.editor_holder);

      // Container for rows of child editors
      this.row_container = this.theme.getGridContainer();
      this.editor_holder.appendChild(this.row_container);

      $each(this.schema.properties, function(key,schema) {
        var editor = self.jsoneditor.getEditorClass(schema, self.jsoneditor);
        var holder = self.getTheme().getGridColumn();
        self.row_container.appendChild(holder);

        // If the property is required
        var required;
        if(self.schema.required && self.schema.required instanceof Array) {
          required = self.schema.required.indexOf(key) >= 0;
        }

        self.editors[key] = new editor({
          jsoneditor: self.jsoneditor,
          schema: schema,
          container: holder,
          path: self.path+'.'+key,
          parent: self,
          required: required
        });
      });

      // Initial layout
      this.layoutEditors();
      // Do it again now that we know the approximate heights of elements
      this.layoutEditors();

      // Control buttons
      this.title_controls = this.getTheme().getHeaderButtonHolder();
      this.editjson_controls = this.getTheme().getHeaderButtonHolder();
      this.addproperty_controls = this.getTheme().getHeaderButtonHolder();
      this.title.appendChild(this.title_controls);
      this.title.appendChild(this.editjson_controls);
      this.title.appendChild(this.addproperty_controls);

      // Show/Hide button
      this.collapsed = false;
      this.toggle_button = this.getButton('','collapse','Collapse');
      this.title_controls.appendChild(this.toggle_button)
      this.toggle_button.addEventListener('click',function() {
        if(self.collapsed) {
          self.editor_holder.style.display = '';
          self.collapsed = false;
          self.setButtonText(self.toggle_button,'','collapse','Collapse');
        }
        else {
          self.editor_holder.style.display = 'none';
          self.collapsed = true;
          self.setButtonText(self.toggle_button,'','expand','Expand');
        }
      });

      // If it should start collapsed
      if(this.options.collapsed) {
        $trigger(this.toggle_button,'click');
      }
      
      // Edit JSON Button
      this.editjson_button = this.getButton('JSON','edit','Edit JSON');
      this.editjson_button.addEventListener('click',function() {
        self.toggleEditJSON();
      });
      this.editjson_controls.appendChild(this.editjson_button);
      this.editjson_controls.appendChild(this.editjson_holder);
      
      // Object Properties Button
      if(this.canHaveAdditionalProperties()) {
        this.addproperty_button = this.getButton('Properties','edit','Object Properties');
        this.addproperty_button.addEventListener('click',function() {
          self.toggleAddProperty();
        });
        this.addproperty_controls.appendChild(this.addproperty_button);
        this.addproperty_controls.appendChild(this.addproperty_holder);
      }
    }
    
    this.jsoneditor.notifyWatchers(this.path);
  },
  showEditJSON: function() {
    if(!this.editjson_holder) return;
    this.hideAddProperty();
    
    // Position the form directly beneath the button
    // TODO: edge detection
    this.editjson_holder.style.left = this.editjson_button.offsetLeft+"px";
    this.editjson_holder.style.top = this.editjson_button.offsetTop + this.editjson_button.offsetHeight+"px";
    
    // Start the textarea with the current value
    this.editjson_textarea.value = JSON.stringify(this.getValue(),null,2);
    
    // Disable the rest of the form while editing JSON
    this.disable();
    
    this.editjson_holder.style.display = '';
    this.editing_json = true;
  },
  hideEditJSON: function() {
    if(!this.editjson_holder) return;
    
    this.editjson_holder.style.display = 'none';
    this.enable();
    this.editing_json = false;
  },
  saveJSON: function() {
    if(!this.editjson_holder) return;
    
    try {
      var json = JSON.parse(this.editjson_textarea.value);
      this.setValue(json);
      this.hideEditJSON();
    }
    catch(e) {
      alert('invalid JSON');
      throw e;
    }
  },
  toggleEditJSON: function() {
    if(this.editing_json) this.hideEditJSON();
    else this.showEditJSON();
  },
  addPropertyCheckbox: function(key) {
    var editor = this.editors[key];
    if(!editor) return;
    var self = this;
    var checkbox, label, control;
    
    checkbox = self.theme.getCheckbox();
    checkbox.style.width = 'auto';
    label = self.theme.getCheckboxLabel(key);
    control = self.theme.getFormControl(label,checkbox);
    control.style.paddingBottom = control.style.marginBottom = 0;
    control.style.height = '25px';
    self.addproperty_list.appendChild(control);
    
    checkbox.checked = !editor.property_removed;
    if(editor.isRequired()) checkbox.disabled = true;
    checkbox.addEventListener('change',function() {
      if(checkbox.checked) {
        self.addObjectProperty(key);
      }
      else {
        self.removeObjectProperty(key);
      }
    });
  },
  showAddProperty: function() {
    if(!this.addproperty_holder) return;
    this.hideEditJSON();
    
    // Position the form directly beneath the button
    // TODO: edge detection
    this.addproperty_holder.style.left = this.addproperty_button.offsetLeft+"px";
    this.addproperty_holder.style.top = this.addproperty_button.offsetTop + this.addproperty_button.offsetHeight+"px";
    
    // Build the properties list
    this.addproperty_list.innerHTML = '';
    var self = this;
    $each(this.editors,function(i,editor) {
      self.addPropertyCheckbox(i);
    });
    
    // Disable the rest of the form while editing JSON
    this.disable();
    
    this.adding_property = true;
    
    this.addproperty_holder.style.display = '';
  },
  hideAddProperty: function() {
    if(!this.addproperty_holder) return;
    
    this.addproperty_holder.style.display = 'none';
    this.enable();
    
    this.adding_property = false;
  },
  toggleAddProperty: function() {
    if(this.adding_property) this.hideAddProperty();
    else this.showAddProperty();
  },
  removeObjectProperty: function(property) {
    if(this.editors[property]) {
      this.editors[property].property_removed = true;
      this.editors[property].unregister();
      this.refreshValue();
      this.layoutEditors();
      this.jsoneditor.notifyWatchers(this.path);
      if(this.parent) this.parent.onChildEditorChange(this);
      else this.jsoneditor.onChange();
    }
  },
  addObjectProperty: function(name) {
    var self = this;
    
    // If property with this name already exists
    if(this.editors[name]) {
      // Property  was removed, add it back
      if(this.editors[name].property_removed) {
        this.editors[name].property_removed = false;
        this.editors[name].register();
        this.jsoneditor.notifyWatchers(this.editors[name].path);
      }
      else {
        return; 
      }
    }
    else {
      // Determine the schema to use for this new property
      var schema = {}, matched = false;
      // Check if it matches any of the pattern properties
      if(self.schema.patternProperties) {
        $each(self.schema.patternProperties,function(i,el) {
          var regex = new RegExp(i);
          if(regex.test(name)) {
            matched = true;
            schema = $extend(schema,el);
          }
        });
      }
      // Otherwise, check if additionalProperties is a schema
      if(!matched && typeof self.schema.additionalProperties === "object") {
        schema = $extend(schema,self.schema.additionalProperties);
      }
      
      // Add the property
      var editor = self.jsoneditor.getEditorClass(schema, self.jsoneditor);
      var holder = self.getTheme().getChildEditorHolder();
      self.editor_holder.appendChild(holder);

      self.editors[name] = new editor({
        jsoneditor: self.jsoneditor,
        schema: schema,
        container: holder,
        path: self.path+'.'+name,
        parent: self,
        required: false
      });
      self.editors[name].not_core = true;
    }
    
    self.refreshValue();
    self.jsoneditor.notifyWatchers(self.path);
    if(self.parent) self.parent.onChildEditorChange(self);
    else self.jsoneditor.onChange();
    
    self.layoutEditors();
  },
  onChildEditorChange: function(editor) {
    this.refreshValue();
    this._super(editor);
  },
  canHaveAdditionalProperties: function() {
    return this.schema.additionalProperties !== false && !this.jsoneditor.options.no_additional_properties;
  },
  destroy: function() {
    $each(this.editors, function(i,el) {
      el.destroy();
    });
    this.editor_holder.innerHTML = '';
    if(this.title) this.title.parentNode.removeChild(this.title);
    if(this.error_holder) this.error_holder.parentNode.removeChild(this.error_holder);

    this.editors = null;
    this.editor_holder.parentNode.removeChild(this.editor_holder);
    this.editor_holder = null;

    this._super();
  },
  refreshValue: function() {
    this.value = {};
    this.serialized = '';
    var self = this;
    var props = 0;
    
    var removed = false;
    var new_editors = this.editors;
    $each(this.editors, function(i,editor) {
      if(editor.property_removed && editor.not_core) {
        new_editors = {};
        removed = true;
      }
    });
    
    $each(this.editors, function(i,editor) {
      if(editor.addremove) editor.addremove.style.display = '';
      if(editor.property_removed) {
        if(!editor.not_core && removed) new_editors[i] = editor;
        else if(editor.not_core) {
          var container = editor.container;
          editor.destroy();
          if(container.parentNode) container.parentNode.removeChild(container);
        }
        return;
      }
      else if(removed) new_editors[i] = editor;
      
      props++;
      self.value[i] = editor.getValue();
    });
    this.editors = new_editors;
    
    // See if we need to show/hide the add/remove property links
    if(typeof this.schema.minProperties !== "undefined") {
      if(props <= this.schema.minProperties) {
        $each(this.editors, function(i,editor) {
          if(!editor.property_removed && editor.addremove) {
            editor.addremove.style.display = 'none';
          }
        });
      }
    }
    if(typeof this.schema.maxProperties !== "undefined") {
      if(props >= this.schema.maxProperties) {
        $each(this.editors, function(i,editor) {
          if(editor.property_removed && editor.addremove) {
            editor.addremove.style.display = 'none';
          }
        });
      }
    }
  },
  setValue: function(value, initial) {
    var self = this;
    value = value || {};
    
    if(typeof value !== "object" || value instanceof Array) value = {};
    
    // First, set the values for all of the defined properties
    $each(this.editors, function(i,editor) {      
      if(typeof value[i] !== "undefined") {
        // If property is removed, add property
        if(editor.property_removed) {
          self.addObjectProperty(i);
        }
        
        editor.setValue(value[i],initial);
      }
      else {
        // If property isn't required, remove property
        if(!initial && !editor.property_removed && !editor.isRequired()) {
          self.removeObjectProperty(i);
          return;
        }
        
        editor.setValue(editor.getDefault(),initial);
      }
    });
    
    // If additional properties are allowed, create the editors for any of those
    if(this.canHaveAdditionalProperties()) {
      $each(value, function(i,val) {
        if(!self.editors[i]) {
          self.addObjectProperty(i);
          if(self.editors[i]) {
            self.editors[i].setValue(val,initial);
          }
        }
      });
    }
    
    this.refreshValue();
    this.jsoneditor.notifyWatchers(this.path);
  },
  showValidationErrors: function(errors) {
    var self = this;

    // Get all the errors that pertain to this editor
    var my_errors = [];
    var other_errors = [];
    $each(errors, function(i,error) {
      if(error.path === self.path) {
        my_errors.push(error);
      }
      else {
        other_errors.push(error);
      }
    });

    // Show errors for this editor
    if(this.error_holder) {
      if(my_errors.length) {
        var message = [];
        this.error_holder.innerHTML = '';
        this.error_holder.style.display = '';
        $each(my_errors, function(i,error) {
          self.error_holder.appendChild(self.theme.getErrorMessage(error.message));
        });
      }
      // Hide error area
      else {
        this.error_holder.style.display = 'none';
      }
    }

    // Show error for the table row if this is inside a table
    if(this.getOption('table_row')) {
      if(my_errors.length) {
        this.theme.addTableRowError(this.container);
      }
      else {
        this.theme.removeTableRowError(this.container);
      }
    }

    // Show errors for child editors
    $each(this.editors, function(i,editor) {
      editor.showValidationErrors(other_errors);
    });
  }
});
