module.exports.getClassNames = function(classNames) {
  return Object.entries(classNames)
    .reduce((a, [className, use]) => {
      if (use) {
        a.push(className);
      }
      return a;
    }, [])
    .join(' ');
};
