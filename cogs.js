module.exports = {
  in: {
    scss: {
      out: 'css',
      transformers: [
        'directives',
        {name: 'sass', options: {imagePath: '/assets'}}
      ]
    }
  },
  builds: {
    'assets/css/main.scss': 'public/css/'
  }
};
