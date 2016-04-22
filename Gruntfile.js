module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('default', ['browserify', 'copy']);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
        main: {
            src: 'src/robotimpl.js',
            dest: 'dist/linkbot.js'
        }
    },
    copy: {
        main: {
            files: [
                {expand: true, cwd: 'src/proto/', src: ['*'], dest: 'dist/proto/', filter: 'isFile'},
            ],
        },
    }
  });
};
