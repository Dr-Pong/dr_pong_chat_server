export class SortUtil {
  static byNicknames = (a, b) => {
    if (a.nickname > b.nickname) {
      return 1;
    }
    if (a.nickname < b.nickname) {
      return -1;
    }
    return 0;
  };
}
