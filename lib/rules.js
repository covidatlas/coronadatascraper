/*
  Given a data object and arrays of criteria with keys/values that match the data object,
  determine if the object is acceptable.

  If the object has keys that match everything in at least one rejection criteria, it is rejected
  If the object has keys that match everything in at least one acceptance criteria, it's accepted
*/
function isAcceptable(data, acceptCriteria, rejectCriteria) {
  // Fail things that match reject criteria
  if (rejectCriteria) {
    for (let [index, criteria] of Object.entries(rejectCriteria)) {
      for (let [prop, value] of Object.entries(criteria)) {
        if (data[prop] === value) {
          return false;
        }
      }
    }
  }

  // Accept things that pass at least one accept criteria
  if (acceptCriteria) {
    for (let [index, criteria] of Object.entries(acceptCriteria)) {
      let criteriaMatch = true;
      criteriaTest: for (let [prop, value] of Object.entries(criteria)) {
        if (data[prop] != value) {
          criteriaMatch = false;
          break criteriaTest;
        }
      }
      if (criteriaMatch) {
        return true;
      }
    }
    return false;
  }

  return true;
};

export { isAcceptable };
