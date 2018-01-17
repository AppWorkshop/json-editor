'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    concat: {
      dist: {
        src: [
          // License & version info, start the containing closure
          'imports/src/intro.js',
          
          // Simple inheritance
          'imports/src/class.js',
          // IE9 polyfills
          'imports/src/ie9.js',
          // Utils like extend, each, and trigger
          'imports/src/utilities.js',
          
          // The main JSONEditor class
          'imports/src/core.js',

          // JSON Schema validator
          'imports/src/validator.js',
          
          // All the editors
          'imports/src/editor.js',
          'imports/src/editors/null.js',
          'imports/src/editors/string.js',
          'imports/src/editors/number.js',
          'imports/src/editors/integer.js',
          'imports/src/editors/object.js',
          'imports/src/editors/imageFile.js',
          'imports/src/editors/array.js',
          'imports/src/editors/imageFileArray.js',
          'imports/src/editors/table.js',
          'imports/src/editors/multiple.js',
          'imports/src/editors/enum.js',
          'imports/src/editors/checkbox.js', 
          'imports/src/editors/select.js',
          'imports/src/editors/radio.js', 
          'imports/src/editors/multiselect.js',
          'imports/src/editors/base64.js',
          'imports/src/editors/upload.js',
          'imports/src/editors/signature.js',

          // All the themes and iconlibs
          'imports/src/theme.js',
          'imports/src/themes/*.js',
          'imports/src/iconlib.js',
          'imports/src/iconlibs/*.js',

          // The JS templating engines
          'imports/src/templates/*.js',

          // Set the defaults
          'imports/src/defaults.js',
          
          // Wrapper for $.fn style initialization
          'imports/src/jquery.js',
          
          // End the closure
          'imports/src/outro.js'
        ],
        dest: 'dist/jsoneditor.js'
      }
    },
    uglify: {
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/jsoneditor.min.js'
      },
      options: {
        preserveComments: 'some'
      }
    },
    watch: {
      scripts: {
        files: ["imports/src/**/*.js"],
        tasks: ["concat", "uglify"]
      }
    },
    jshint: {
      options: {
        browser: true,
        indent: 2,
        nonbsp: true,
        nonew: true,
        immed: true,
        latedef: true,
        reporterOutput: "",
        "globals": {
          "Meteor": true,
          "MobileRangeSlider": true
        }
      },
      beforeconcat: [
        'imports/src/class.js',
        'imports/src/ie9.js',
        
        // Utils like extend, each, and trigger
        'imports/src/utilities.js',
        
        // The main JSONEditor class
        'imports/src/core.js',

        // JSON Schema validator
        'imports/src/validator.js',
        
        // All the editors
        'imports/src/editor.js',
        'imports/src/editors/*.js',
        
        // All the themes and iconlibs
        'imports/src/theme.js',
        'imports/src/themes/*.js',
        'imports/src/iconlib.js',
        'imports/src/iconlibs/*.js',

        // The JS templating engines
        'imports/src/templates/*.js',

        // Set the defaults
        'imports/src/defaults.js',
        
        // Wrapper for $.fn style initialization
        'imports/src/jquery.js'
      ],
      afterconcat: {
        options: {
          undef: true
        },
        files: {
          src: ['dist/jsoneditor.js']
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task.
  grunt.registerTask('default', ['jshint:beforeconcat','concat','jshint:afterconcat','uglify']);

};
