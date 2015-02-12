// Public exports
window.qed = {
  Editor: require('./editor'),
  Point: require('./point'),
  Range: require('./range'),
  Toolbar: require('./toolbar'),

  InlineDecorator: require('./inline-decorator')

  // TODO: Just export all the classes so people can put them together
  //       however they like.
};

