/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const Fiber = require('fibers');
const browserSync = require('browser-sync').create();
const child = require('child_process');
const log = require('fancy-log');

const gulp = require('gulp');
const debug = require('gulp-debug');
const gulpif = require('gulp-if');
const postcss = require('gulp-postcss');
const postcssFilterRules = require('postcss-filter-rules');
const posthtml = require('gulp-posthtml');
const posthtmlHighlight = require('posthtml-highlight');
const posthtmlInlineAssets = require('posthtml-inline-assets');
const htmlnano = require('htmlnano');
const rename = require('gulp-rename');
const sass = require('gulp-sass');

sass.compiler = require('sass');

const sassFiles = '**/*.scss';
const cssFiles = '**/*.css';
const siteRoot = '_site';
const stageAssets = '/tmp/assets';
const stageJekyll = '/tmp/jekyll';
const jekyllHtml = stageJekyll + '/**/*.html';
const jekyllOther = [stageJekyll + '/**/*', '!' + jekyllHtml];

const production = (process.env.JEKYLL_ENV == 'production');

gulp.task('css:katex:fonts', function () {
  return gulp.src('../yarn/katex/dist/katex.css')
    .pipe(debug({ title: 'css:katex:fonts'}))
    .pipe(postcss([postcssFilterRules({
      keepAtRules: ['font-face'],
      filter: () => false
    })]))
    .pipe(rename('katex.fonts.css'))
    .pipe(gulp.dest(stageAssets + '/_sass'));
});

gulp.task('css:katex:styles', function () {
  return gulp.src('../yarn/katex/dist/katex.css')
    .pipe(debug({ title: 'css:katex:styles'}))
    .pipe(postcss([postcssFilterRules({
      keepAtRules: false,
      filter: () => true
    })]))
    .pipe(rename('katex.styles.css'))
    .pipe(gulp.dest(stageAssets + '/_sass'));
});

gulp.task('css:katex', gulp.parallel('css:katex:fonts', 'css:katex:styles'));

gulp.task('css:sass', function () {
  return gulp.src([sassFiles, '!_*/**'], { base: '.' })
    .pipe(debug({ title: 'css:sass:' }))
    .pipe(sass({ includePaths: ['_sass', stageAssets + '/_sass', '../yarn/highlight.js/styles'], fiber: Fiber }).on('error', sass.logError))
    .pipe(gulp.dest(stageAssets));
});

gulp.task('css:processed', gulp.series('css:katex', 'css:sass'));

gulp.task('css:raw', function () {
  return gulp.src([cssFiles, '!_*/**'], { base: '.' })
    .pipe(debug({ title: 'css:stage:' }))
    .pipe(gulp.dest(stageAssets));
});

gulp.task('css:stage', gulp.parallel('css:processed', 'css:raw'));

gulp.task('css:copy', function () {
  return gulp.src([stageAssets + '/**/*.css', '!' + stageAssets + '/_sass/**', '!' + stageAssets + '/assets/css/inline.css'], { base: stageAssets })
    .pipe(debug({ title: 'css:copy' }))
    .pipe(gulpif(production, postcss()))
    .pipe(gulp.dest(siteRoot));
});

gulp.task('build:css', gulp.series('css:stage', 'css:copy'));

gulp.task('watch:css:files', () => {
  gulp.watch([sassFiles, cssFiles, '!_*/**'], gulp.series('css:stage', 'css:copy'));
});

gulp.task('watch:css', gulp.series('build:css', 'watch:css:files'));

function makeLogger(label, logger) {
  return function (data) {
    data.toString()
      .split(/\n/)
      .forEach((message) => logger(label + ': ' + message));
  };
}

function runJekyll(cb, watch = false) {
  var args = ['build', '--incremental', '-d', stageJekyll, '--trace'];
  var label = 'jekyll:stage';

  if (!production) args.push('--drafts');
  if (watch) {
    label = 'watch:jekyll';
    args.push('--watch');
  }

  const jekyll = child.spawn('jekyll', args);
  jekyll.stdout.on('data', makeLogger(label, log.info));
  jekyll.stderr.on('data', makeLogger(label, log.error));
  jekyll.on('exit', cb);
  return jekyll;
}

gulp.task('jekyll:stage', (cb) => {
  runJekyll(cb);
});

gulp.task('jekyll:copy:html', () => {
  var plugins = [
    posthtmlInlineAssets({
      root: stageAssets,
      transforms: {
        image: false,
        script: false,
        style: {
          resolve(node) {
            return node.tag === 'link' && node.attrs && node.attrs.rel === 'stylesheet' &&
              node.attrs.href === '/assets/css/inline.css' && node.attrs.href;
          }
        }
      },
    }),
    posthtmlHighlight.default(),
    htmlnano({removeUnusedCss: {}}, production ? htmlnano.presets.safe : {})
  ];

  return gulp.src(jekyllHtml, { base: stageJekyll })
    .pipe(debug({ title: 'jekyll:copy:html:' }))
    .pipe(posthtml(plugins, {}))
    .pipe(gulp.dest(siteRoot));
});

gulp.task('jekyll:copy:other', () => {
  return gulp.src(jekyllOther, { base: stageJekyll })
    .pipe(debug({ title: 'jekyll:copy:other:' }))
    .pipe(gulp.dest(siteRoot));
});

gulp.task('watch:jekyll', (cb) => {
  runJekyll(cb, true);
  gulp.watch(jekyllHtml, gulp.series('jekyll:copy:html'));
  gulp.watch(jekyllOther, gulp.series('jekyll:copy:other'));
});

gulp.task('build:jekyll', gulp.series('jekyll:stage', 'jekyll:copy:html', 'jekyll:copy:other'));

gulp.task('build:katex', () => {
  return gulp.src('../yarn/katex/dist/fonts/*.*')
    .pipe(debug({ title: 'copy:katex:' }))
    .pipe(gulp.dest(siteRoot + '/assets/css/fonts'));
});

gulp.task('build', gulp.parallel('build:css', 'build:jekyll', 'build:katex'));

gulp.task('serve:browsersync', () => {
  browserSync.init({
    files: [siteRoot + '/**'],
    host: "0.0.0.0",
    port: 4000,
    open: false,
    server: {
      baseDir: siteRoot
    },
    reloadDelay: 2000,
    reloadDebounce: 2000,
  });
});

gulp.task('serve', gulp.parallel('watch:css', 'watch:jekyll', 'serve:browsersync'));
