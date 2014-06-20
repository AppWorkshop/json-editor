'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    concat: {
      dist: {
        src: [
          // License & version info, start the containing closure
          'src/intro.js',
          
          // Simple inheritance
          'src/class.js',
          // IE9 polyfills
          'src/ie9.js',
          // Utils like extend, each, and trigger
          'src/utilities.js',
          
          // The main JSONEditor class
          'src/core.js',

          // JSON Schema validator
          'src/validator.js',
          
          // All the editors
          'src/editor.js',
          'src/editors/null.js',
          'src/editors/string.js',
          'src/editors/number.js',
          'src/editors/integer.js',
          'src/editors/object.js',
          'src/editors/imageFile.js',
          'src/editors/array.js',
          'src/editors/geolocation.js',
          'src/editors/imageFileArray.js',
          'src/editors/table.js',
          'src/editors/multiple.js',
          'src/editors/enum.js',
          'src/editors/select.js',
          
          // All the themes and iconlibs
          'src/theme.js',
          'src/themes/*.js',
          'src/iconlib.js',
          'src/iconlibs/*.js',

          // The JS templating engines
          'src/templates/*.js',

          // Set the defaults
          'src/defaults.js',
          
          // Wrapper for $.fn style initialization
          'src/jquery.js',
          
          // End the closure
          'src/outro.js'
        ],
        dest: 'dist/jsoneditor.js'
      },
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
        files: ["src/**/*.js"],
        tasks: ["concat"]
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['concat', 'uglify']);

};
