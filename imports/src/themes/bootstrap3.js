JSONEditor.defaults.themes.bootstrap3 = JSONEditor.AbstractTheme.extend({
  getSelectInput: function(options) {
    var el = this._super(options);
    el.className += 'form-control';
    //el.style.width = 'auto';
    return el;
  },
  setGridColumnSize: function(el,size) {
    el.className = el.className + ' col-md-'+size;
  },
  afterInputReady: function(input) {
    if(input.controlgroup) return;
    input.controlgroup = this.closest(input,'.form-group');
    if(this.closest(input,'.compact')) {
      input.controlgroup.style.marginBottom = 0;
    }

    // TODO: use bootstrap slider
  },
  getTextareaInput: function() {
    var el = document.createElement('textarea');
    el.className = 'form-control';
    return el;
  },
  getRangeInput: function(min, max, step) {
    // TODO: use better slider
    return this._super(min, max, step);
  },
  getFormInputField: function(type) {
    var el = this._super(type);
    if(type !== 'checkbox') {
      el.className += 'form-control';
    }
    return el;
  },
  getFormControl: function(label, input, description, info) {
    var group = document.createElement('div');

    if(label && input.getAttribute('type') === 'checkbox') {
      label.className += ' checkbox';
      label.appendChild(input);
      // add an empty span inside the label, alongside the checkbox.
      var emptySpan = document.createElement('span');
      emptySpan.setAttribute('class','checkbox-target');
      label.appendChild(emptySpan);
      group.appendChild(label);
//      input.style.position = 'relative';
//      input.style.cssFloat = 'left';
    } 
    else {
      group.className += ' form-group';
      if(label) {
        var labelHolder = document.createElement("div");
        labelHolder.setAttribute("class","jutoLabelHolder");
        label.className += ' control-label';
        if (info) {
          var infoSpan = document.createElement("i");
          infoSpan.setAttribute("class", "fa fa-info jutoInfoLabel");
          infoSpan.info = info;
          labelHolder.appendChild(label);
          labelHolder.appendChild(infoSpan);
        } else {
          labelHolder.appendChild(label);
        }
        group.appendChild(labelHolder);
      }
      group.appendChild(input);
    }



    if(description) group.appendChild(description);

    return group;
  },
  getFormInputLabel: function(text) {
    var labelToReturn = this._super(text);
    return labelToReturn;
  },
  // <div class="btn-group" data-toggle="buttons">
  //  <label class="btn btn-primary active">
  //    <input type="radio" name="options" id="option1" checked> Option 1 (preselected)
  //  </label>
  //  <label class="btn btn-primary">
  //    <input type="radio" name="options" id="option2"> Option 2
  //  </label>
  //  <label class="btn btn-primary">
  //    <input type="radio" name="options" id="option3"> Option 3
  //  </label>
  //</div>
  
  getRadioLabel: function(text, isChecked) {
    var el = this.getFormInputLabel(text);
    el.setAttribute("class","btn btn-primary radioLabel" + (isChecked?" active":""));
    return el;
  },
  getRadioInput: function(name, value, checked) {
    var radio = this.getFormInputField('radio');
    radio.setAttribute("name",name);
    radio.setAttribute("value",value);
    if (checked) {
     radio.setAttribute("checked",true);
    }
    radio.setAttribute("class","radio");
    return radio;
  },
//getRadioGroupFormControl(this.path, self.enum_values, self.enum_display, this.schema.default)
  getRadioGroupFormControl: function(name, options, titles, defaultVal) {
    var holder = document.createElement("div");
    holder.setAttribute("class","radio-holder btn-group");
    for(var i=0; i<options.length; i++) {
      var isChecked = (options[i] === defaultVal);
      var radio = this.getRadioInput(name, options[i], isChecked);
      var radioLabel = this.getRadioLabel(titles[i] || options[i], isChecked);
      var uuid = $uuid();
      radio.setAttribute("id",uuid);
      radioLabel.setAttribute("for",uuid);
      radioLabel.appendChild(radio);
      holder.appendChild(radioLabel);
    }
    holder.addEventListener("change",
      function (evt) {
          var oldActive = holder.querySelector('.btn.active');
          if (oldActive) {
              oldActive.classList.remove('active');
          }
          evt.target.parentElement.classList.add('active');
      });
    return holder;
  },  
  getIndentedPanel: function() {
    var el = document.createElement('div');
    el.className = 'well well-sm';
    return el;
  },
  getFormInputDescription: function(text, html) {
    if (html) {
      var div = document.createElement('div');
      div.innerHTML = text;
      return div;
    }
    var el = document.createElement('p');
    el.className = 'help-block';
    el.textContent = text;
    return el;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    el.style.marginLeft = '10px';
    return el;
  },
  getButtonHolder: function() {
    var el = document.createElement('div');
    el.className = 'btn-group';
    return el;
  },
  getButton: function(text, icon, title) {
    var el = this._super(text, icon, title);
    el.className += 'btn btn-default';
    return el;
  },
  getTable: function() {
    var el = document.createElement('table');
    el.className = 'table table-bordered';
    el.style.width = 'auto';
    el.style.maxWidth = 'none';
    return el;
  },

  addInputError: function(input,text) {
    if(!input.controlgroup) return;
    input.controlgroup.className += ' has-error';
    if(!input.errmsg) {
      input.errmsg = document.createElement('p');
      input.errmsg.className = 'help-block errormsg';
      input.controlgroup.appendChild(input.errmsg);
    }
    else {
      input.errmsg.style.display = '';
    }

    input.errmsg.textContent = text;
  },
  removeInputError: function(input) {
    if(!input.errmsg) return;
    input.errmsg.style.display = 'none';
    input.controlgroup.className = input.controlgroup.className.replace(/\s?has-error/g,'');
  },
  getTabHolder: function() {
    var el = document.createElement('div');
    el.innerHTML = "<div class='tabs list-group col-md-2'></div><div class='col-md-10'></div>";
    el.className = 'rows';
    return el;
  },
  getTab: function(text) {
    var el = document.createElement('a');
    el.className = 'list-group-item';
    el.setAttribute('href','#');
    el.appendChild(text);
    return el;
  },
  markTabActive: function(tab) {
    tab.className += ' active';
  },
  markTabInactive: function(tab) {
    tab.className = tab.className.replace(/\s?active/g,'');
  },
  getProgressBar: function() {
    var min = 0, max = 100, start = 0;

    var container = document.createElement('div');
    container.className = 'progress';

    var bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuenow', start);
    bar.setAttribute('aria-valuemin', min);
    bar.setAttribute('aria-valuenax', max);
    bar.innerHTML = start + "%";
    container.appendChild(bar);

    return container;
  },
  updateProgressBar: function(progressBar, progress) {
    if (!progressBar) return;

    var bar = progressBar.firstChild;
    var percentage = progress + "%";
    bar.setAttribute('aria-valuenow', progress);
    bar.style.width = percentage;
    bar.innerHTML = percentage;
  },
  updateProgressBarUnknown: function(progressBar) {
    if (!progressBar) return;

    var bar = progressBar.firstChild;
    progressBar.className = 'progress progress-striped active';
    bar.removeAttribute('aria-valuenow');
    bar.style.width = '100%';
    bar.innerHTML = '';
  }
});
