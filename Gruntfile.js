module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jshint-jsx');

    // Default task(s).
    grunt.registerTask('default', ['jshint', 'browserify:prod', 'uglify', 'copy', 'less']);
    grunt.registerTask('debug', ['jshint', 'browserify:dev', 'uglify', 'copy', 'less']);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
                sourceMap: true
            },
            dist: {
                files: {
                    'dist/linkbot.min.js': ['dist/linkbot.js']
                }
            }
        },
        browserify: {
            prod: {
                files: { 'dist/linkbot.js': ['src/js/robotimpl.js', 'src/js/api.js', 'src/jsx/**/*.jsx']},
                options: {
                    transform: ['reactify']
                }
            },
            dev: {
                files: { 'dist/linkbot.js': ['src/js/robotimpl.js', 'src/js/api.js', 'src/jsx/**/*.jsx']},
                options: {
                    browserifyOptions: {
                        debug: true
                    },
                    transform: ['reactify']
                }

            }
        },
        copy: {
            main: {
                files: [
                    {expand: true, cwd: 'src/proto/', src: ['*'], dest: 'dist/proto/', filter: 'isFile'},
                    {expand: true, cwd: 'src/proto/', src: ['*'], dest: 'demo/proto/', filter: 'isFile'},
                    {expand: true, cwd: 'src/proto/', src: ['*'], dest: 'test/proto/', filter: 'isFile'},
                    {expand: true, cwd: 'src/', src: ['img/**'], dest: 'dist/'}
                ]
            }
        },
        less: {
            normal: {
                files: {
                    'dist/linkbot.css': 'src/less/linkbot.less'
                }
            }
        },
        jshint: {
            files: {
                src: ['src/js/**/*.js']
            },
            options: {
                globals: {
                    console: true,
                    module: true,
                    global: true,
                    document: true,
                    node: true

                },
                browserify: true,
                esversion: 6,
                browser: true
            }
        }
    });
};
