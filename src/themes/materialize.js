JSONEditor.defaults.themes.materialize = JSONEditor.AbstractTheme.extend({
  rangeSliderReinit: function() {
    /**
     * Taken from materialize.js
     * The range slider may not initialise properly when it's injected dynamically
     * This is used to reinitialize the range slider after it has been inserted
     * TODO: detect if range slider has already been initialised
     */

    var range_type = 'input[type=range]';
    var range_mousedown = false;
    var left;
    $(range_type).each(function () {
      var thumb = $('<span class="thumb"><span class="value"></span></span>');
      $(this).after(thumb);
    });
    var range_wrapper = '.range-field';
    $(document).on('change', range_type, function(e) {
      var thumb = $(this).siblings('.thumb');
      thumb.find('.value').html($(this).val());
    });
    $(document).on('input mousedown touchstart', range_type, function(e) {
      var thumb = $(this).siblings('.thumb');
      var width = $(this).outerWidth();
      // If thumb indicator does not exist yet, create it
      if (thumb.length <= 0) {
        thumb = $('<span class="thumb"><span class="value"></span></span>');
        $(this).after(thumb);
      }
      // Set indicator value
      thumb.find('.value').html($(this).val());
      range_mousedown = true;
      $(this).addClass('active');
      if (!thumb.hasClass('active')) {
        thumb.velocity({ height: "30px", width: "30px", top: "-20px", marginLeft: "-15px"}, { duration: 300, easing: 'easeOutExpo' });
      }
      if (e.type !== 'input') {
        if(e.pageX === undefined || e.pageX === null){//mobile
          left = e.originalEvent.touches[0].pageX - $(this).offset().left;
        }
        else{ // desktop
          left = e.pageX - $(this).offset().left;
        }
        if (left < 0) {
          left = 0;
        }
        else if (left > width) {
          left = width;
        }
        thumb.addClass('active').css('left', left);
      }
      thumb.find('.value').html($(this).val());
    });
    $(document).on('mouseup touchend', range_wrapper, function() {
      range_mousedown = false;
      $(this).removeClass('active');
    });
    $(document).on('mousemove touchmove', range_wrapper, function(e) {
      var thumb = $(this).children('.thumb');
      var left;
      if (range_mousedown) {
        if (!thumb.hasClass('active')) {
          thumb.velocity({ height: '30px', width: '30px', top: '-20px', marginLeft: '-15px'}, { duration: 300, easing: 'easeOutExpo' });
        }
        if (e.pageX === undefined || e.pageX === null) { //mobile
          left = e.originalEvent.touches[0].pageX - $(this).offset().left;
        }
        else{ // desktop
          left = e.pageX - $(this).offset().left;
        }
        var width = $(this).outerWidth();
        if (left < 0) {
          left = 0;
        }
        else if (left > width) {
          left = width;
        }
        thumb.addClass('active').css('left', left);
        thumb.find('.value').html(thumb.siblings(range_type).val());
      }
    });
    $(document).on('mouseout touchleave', range_wrapper, function() {
      if (!range_mousedown) {
        var thumb = $(this).children('.thumb');
        if (thumb.hasClass('active')) {
          thumb.velocity({ height: '0', width: '0', top: '10px', marginLeft: '-6px'}, { duration: 100 });
        }
        thumb.removeClass('active');
      }
    });
  },
  onReady: function() {
    this.rangeSliderReinit();
  },
  attachHandlers: function(input, handler) {
    // materialize datepicker
    if (input.tagName === 'INPUT' && input.getAttribute('type') === 'date') {
      if (!$isCordova()) { // don't use on mobile
        $(input).pickadate({format: 'dd/mm/yyyy'});
        input = $(input.parentNode).find('input').get(0);
      }
      $(input).change(handler); // only triggers through jquery
    }
    // materialize selects
    else if (input.tagName === 'SELECT') {
      if (!$isCordova()) { // don't use on mobile
        $(input).material_select();
        input = $(input.parentNode).find('select').get(0);
      }
      $(input).change(handler); // only triggers through jquery
    }
    else this._super(input, handler);
  },
  setGridColumnSize: function(el,size) {
    el.className += ' col s'+size;
  },
  afterInputReady: function(input) {
    if(input.controlgroup) return;
    input.controlgroup = this.closest(input, '.input-container');
  },
  setSelectValue: function(input) {
    $(input).material_select(); // re-initialise when the value is programmatically changed
  },
  setSelectOptions: function(select, options, titles) {
    titles = titles || [];
    if ($isCordova()) select.className += ' browser-default'; // browser default on mobile
    select.innerHTML = '';
    var defaultOp = document.createElement('option');
    defaultOp.textContent = "Choose Option";
    defaultOp.disabled = true;
    defaultOp.selected = true;
    select.appendChild(defaultOp);
    for(var i=0; i<options.length; i++) {
      var option = document.createElement('option');
      option.setAttribute('value',options[i]);
      option.textContent = titles[i] || options[i];
      select.appendChild(option);
    }
  },
  getTextareaInput: function() {
    var el = document.createElement('textarea');
    el.className = 'materialize-textarea';
    return el;
  },
  getFormInputField: function(type) {
    var el = this._super(type);
    return el;
  },
  getFormControl: function(label, input, description, info) {
    var group = document.createElement('div');
    var infoSpan = document.createElement("i");

    group.className += ' input-container';

    if (label) {
      var id = $uuid();
      input.id = id;
      label.setAttribute("for", id);
    }


    var nestedInput = input.querySelector('input');
    if(nestedInput !== null && nestedInput.getAttribute('type') === 'radio') {
      if (info) {
        infoSpan.setAttribute("class", "fa fa-info prefix jutoInfoLabel");
        infoSpan.info = info;
        group.appendChild(infoSpan);
        group.appendChild(document.createTextNode("\x20")); // space
      }
      group.appendChild(label);
      group.appendChild(input);
    }
    else if(label && input.getAttribute('type') === 'checkbox') {
      input.className += ' filled-in';
      group.appendChild(input);
      group.appendChild(label);
      if (description) group.appendChild(document.createElement('br'));
    }
    else {
      group.className += ' input-field';
      if (nestedInput !== null && nestedInput.getAttribute('type') === 'file')
        group.className = group.className.replace(/\s?input-field/g,'');

      if (info) {
        infoSpan.setAttribute("class", "fa fa-info prefix jutoInfoLabel");
        infoSpan.info = info;
        infoSpan.style.textAlign = "center";
        group.appendChild(infoSpan);
      }
      if (input.getAttribute('type') === 'range') {
        group.className = group.className.replace(/\s?input-field/g,' range-field');
        if (label) group.appendChild(label);
        group.appendChild(input);
      }
      else if (input.getAttribute('type') === 'color') {
        group.className = group.className.replace(/\s?input-field/g,'');
        if (label) {
          group.appendChild(label);
          group.appendChild(document.createElement('br'));
        }
        group.appendChild(input);
        if (description) group.appendChild(document.createElement('br'));
      }
      else {
        group.appendChild(input);
        if (label) group.appendChild(label);
      }
    }

    if(description) {
      description.style.fontSize = '0.8em';
      group.appendChild(description);
    }

    return group;
  },
  getRadioLabel: function(text, isChecked) {
    var el = this.getFormInputLabel(text);
    el.setAttribute("class","radioLabel");
    return el;
  },
  getHeader: function(text) {
    var el = document.createElement('h4');
    if(typeof text === "string") {
      el.textContent = text;
    }
    else {
      el.appendChild(text);
    }

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
    holder.setAttribute("class","radio-holder");
    for(var i=0; i<options.length; i++) {
      var isChecked = (options[i] === defaultVal);
      var radio = this.getRadioInput(name, options[i], isChecked);
      var radioLabel = this.getRadioLabel(titles[i] || options[i], isChecked);
      var uuid = $uuid();
      radio.setAttribute("id",uuid);
      radioLabel.setAttribute("for",uuid);
      var p = document.createElement("p");
      p.appendChild(radio);
      p.appendChild(radioLabel);
      holder.appendChild(p);
    }
    return holder;
  },  
  getIndentedPanel: function() {
    var el = document.createElement('div');
    el.className = 'card-panel';
    return el;
  },
  getFormInputDescription: function(text) {
    var el = document.createElement('span');
    el.textContent = text;
    return el;
  },
  getHeaderButtonHolder: function() {
    var el = this.getButtonHolder();
    el.style.marginLeft = '10px';
    return el;
  },
  getButtonHolder: function() {
    var el = document.createElement('span');
    el.style.fontSize = '12px';
    el.style.verticalAlign = 'middle';
    return el;
  },
  getButton: function(text, icon, title) {
    var el = this._super(text, icon, title);
    el.className += 'waves-effect waves-light btn';
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
    var label = input.controlgroup.querySelector('label');
    if (label) label.className += ' red-text text-lighten-1';
    if(!input.errmsg) {
      input.errmsg = document.createElement('span');
      input.errmsg.className = 'red-text';
      input.errmsg.style.fontSize = '0.8em';
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
    var label = input.controlgroup.querySelector('label');
    if (label) label.className = label.className.replace(/\s?red-text\stext-lighten-1/g, '');
  },
  getTabHolder: function() {
    var el = document.createElement('div');
    el.innerHTML = "<div class='collection col m2'></div><div class='col m10'></div>";
    el.className = 'row';
    return el;
  },
  getTab: function(text) {
    var el = document.createElement('a');
    el.className = 'collection-item';
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
    bar.className = 'determinate';
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
    progressBar.className = 'progress';
    bar.className = 'indeterminate';
    bar.removeAttribute('aria-valuenow');
    bar.innerHTML = '';
  }
});
