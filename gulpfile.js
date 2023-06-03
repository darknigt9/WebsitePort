'use strict';
const { src, dest, series, parallel } = require('gulp');
const gulp = require('gulp');
const atoprefixer = require('gulp-autoprefixer');
const cssbeautify = require('gulp-cssbeautify');
const cssnano = require('gulp-cssnano');
const imagemin = require('gulp-imagemin');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const rigger = require('gulp-rigger');
const sass = require('gulp-sass')(require('sass'));
const removeComments = require('gulp-strip-css-comments');
const uglify = require('gulp-uglify');
const panini = require('panini');
const browserSync = require('browser-sync').create();
const del = require('del');
const notify = require('gulp-notify');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');

/*Const paths */
const srcPath = 'src/';
const disPath = 'dist/';
const path = {
  build: {
    html: disPath,
    css: disPath + 'assets/css/',
    js: disPath + 'assets/js/',
    images: disPath + 'assets/images/',
    fonts: disPath + 'assets/fonts/',
  },

  src: {
    html: srcPath + '*.html',
    css: srcPath + 'assets/scss/*.scss',
    js: srcPath + 'assets/js/*.js',
    images:
      srcPath +
      'assets/images/**/*.{png,jpg,svg,gif,ico,xml,json,webp,webmanifest}',
    fonts: srcPath + 'assets/fonts/**/*.{woff,woff2,ttf,svg,eot,otf}',
  },
  watch: {
    html: srcPath + '**/*.html',
    js: srcPath + 'assets/js/**/*.js',
    css: srcPath + 'assets/scss/**/*.scss',
    images:
      srcPath +
      'assets/images/**/*.{png,jpg,svg,gif,ico,xml,json,webp,webmanifest}',
    fonts: srcPath + 'assets/fonts/**/*.{woff,woff2,ttf,svg,eot,otf}',
  },
  clean: './' + disPath,
};

function serve() {
  browserSync.init({
    server: { baseDir: './' + disPath },
  });
}
function html() {
  panini.refresh();
  return src(path.src.html, { base: srcPath })
    .pipe(plumber())
    .pipe(
      panini({
        root: srcPath,
        layouts: srcPath + 'tpl/layouts/',
        partials: srcPath + 'tpl/partials/',
      })
    )
    .pipe(dest(path.build.html))
    .pipe(browserSync.reload({ stream: true }));
}
function css() {
  return src(path.src.css, { base: srcPath + 'assets/scss/' })
    .pipe(sourcemaps.init())
    .pipe(
      plumber({
        errorHandler: function (err) {
          notify.onError({
            title: 'SCSS Error',
            message: 'Error: <%= error.message %>',
          })(err);
          this.emit('end');
        },
      })
    )
    .pipe(sass())
    .pipe(autoprefixer({ cascade: false }))
    .pipe(cssbeautify())
    .pipe(dest(path.build.css))
    .pipe(
      cssnano({
        zindex: false,
        discardComments: {
          removeAll: true,
        },
      })
    )
    .pipe(removeComments())
    .pipe(
      rename({
        suffix: '.min',
        extname: '.css',
      })
    )
    .pipe(sourcemaps.write('.'))
    .pipe(dest(path.build.css))
    .pipe(browserSync.reload({ stream: true }));
}

function js() {
  return src(path.src.js, { base: srcPath + 'assets/js/' })
    .pipe(
      plumber({
        errorHandler: function (err) {
          notify.onError({
            title: 'JS Error',
            message: 'Error: <%= error.message %>',
          })(err);
          this.emit('end');
        },
      })
    )
    .pipe(rigger())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(
      rename({
        suffix: '.min',
        extname: '.js',
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browserSync.reload({ stream: true }));
}

function images() {
  return src(path.src.images, { base: srcPath + 'assets/images/' })
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(dest(path.build.images))
    .pipe(browserSync.reload({ stream: true }));
}
function fonts() {
  return src(path.src.fonts, { base: srcPath + 'assets/fonts/' }).pipe(
    browserSync.reload({ stream: true })
  );
}

function clean() {
  return del(path.clean);
}
function watchFiles() {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.images], images);
  gulp.watch([path.watch.fonts], fonts);
}

const build = series(clean, gulp.parallel(html, js, css, images, fonts));
const watch = gulp.parallel(build, watchFiles, serve);

exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.fonts = fonts;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = watch;
