// Public exports
window.qed = {
  Editor: require('./editor'),
  Point: require('./point'),
  Range: require('./range'),

  // Plugins for core editor
  Toolbar: require('./toolbar'),
  StemTracker: require('./stems/stem-tracker'),
  Placeholders: require('./placeholders/placeholder-tracker'),
  InlineDecorator: require('./inline-decorator'),
  util: require('./util'),
  keycodes: require('./keycodes')

  // TODO: Just export all the classes so people can put them together
  //       however they like.
};

