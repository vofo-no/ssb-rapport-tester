module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    coffee: {
      compile: {
        files: {
          'src/upload.js': 'coffee/upload.coffee',
          'src/validator.js': 'coffee/validator.coffee'
        }
      }
    },
    bower_concat: {
      all: {
        dest: 'src/parse.js',
        include: ['papaparse']
      }
    },
    uglify: {
      build: {
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: {
          'build/upload.min.js': 'src/upload.js',
          'build/validator.min.js': 'src/validator.js',
          'build/parse.min.js': 'src/parse.js'
        }
      }
    },
  	jade: {
  		compile: {
  			files: {
  				"build/debug.html": "views/upload.jade"
  			}
  		}
    },
    preprocess : {
      html : {
        src : 'build/debug.html',
        dest : 'build/index.html'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-bower-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-preprocess');

  // Default task(s).
  grunt.registerTask('default', ['coffee', 'bower_concat', 'uglify', 'jade', 'preprocess']);

};
