module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      build: {
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: {
          'build/upload.min.js': ['src/chartjs.js', 'src/tc-angular-chartjs.js', 'src/papa.js', 'src/upload.js']
        }
      }
    },
	jade: {
		compile: {
			files: {
				"upload.html": "views/upload.jade"
			}
		}
	},
  preprocess: {
    dist: {
      src: 'upload.html',
      dest: 'build/index.html',
      options: {
        context : {
          DEBUG: false
        }
      }
    }
  }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-preprocess');

  // Default task(s).
  grunt.registerTask('default', ['uglify', 'jade', 'preprocess:dist']);

};
