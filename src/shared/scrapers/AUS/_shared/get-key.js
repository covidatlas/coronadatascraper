const buildFragmentMatcher = lowerLabel => definition => lowerLabel.includes(Object.values(definition)[0]);

const getKey = ({ label, labelFragmentsByKey }) => {
  const lowerLabel = label.toLowerCase();
  const definitionIndex = labelFragmentsByKey.findIndex(buildFragmentMatcher(lowerLabel));
  if (definitionIndex === -1) {
    throw new Error(`There is an unexpected label: ${lowerLabel}`);
  }
  return Object.keys(labelFragmentsByKey[definitionIndex])[0];
};

export default getKey;
