module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bower_concat: {
      all: {
        dest: 'build/_bower.js',
        cssDest: 'build/_bower.css'
      }
    },
    uglify: {
      build: {
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: {
          'build/upload.min.js': ['build/_bower.js', 'src/upload.js']
        }
      }
    },
  	jade: {
  		compile: {
  			files: {
  				"build/index.html": "views/upload.jade"
  			}
  		}
  	}
  });

  grunt.loadNpmTasks('grunt-bower-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jade');

  // Default task(s).
  grunt.registerTask('default', ['bower_concat', 'uglify', 'jade']);

};
