module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            my_target: {
                files: {
                    'simplevast.min.js': ['src/simpleVast.js']
                }
            }
        },

        coffee: {
            options: {
                sourceMap: true
            },
            compile: {
                files: {
                    'src/simpleVast.js': ['src/simpleVast.coffee']
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-coffee');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['coffee', 'uglify']);

};