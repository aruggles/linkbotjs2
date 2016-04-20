module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');

  // Default task(s).
  grunt.registerTask('default', ['browserify', 'watch']);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
        main: {
            src: 'src/robotimpl.js',
            dest: 'dist/linkbot.js'
        }
    },
    watch: {
        files: 'src/*',
        tasks: ['default']
    }
  });
};
