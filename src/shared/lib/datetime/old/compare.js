/*
  Check of the *date* of the passed date is before the other passed date
  *sigh*
*/
export const dateIsBefore = function(a, b) {
  let localA = a;
  let localB = b;
  localA = new Date(localA);
  localB = new Date(localB);
  localA.setHours(0, 0, 0, 0);
  localB.setHours(0, 0, 0, 0);
  return localA.getTime() < localB.getTime();
};

/*
  Check of the *date* of the passed date is before or equal to the other passed date
  *sigh*
*/
export const dateIsBeforeOrEqualTo = function(a, b) {
  let localA = a;
  let localB = b;
  localA = new Date(localA);
  localB = new Date(localB);
  localA.setHours(0, 0, 0, 0);
  localB.setHours(0, 0, 0, 0);
  return localA.getTime() < localB.getTime() || localA.getTime() === localB.getTime();
};
