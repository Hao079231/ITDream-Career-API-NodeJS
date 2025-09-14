class ResponseCleaner {
  static clean(obj) {
    if (Array.isArray(obj)) {
      return obj.map(ResponseCleaner.clean).filter(v => v !== null);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, v]) => v !== null)
          .map(([k, v]) => [k, ResponseCleaner.clean(v)])
      );
    }
    return obj;
  }
}

module.exports = ResponseCleaner;
