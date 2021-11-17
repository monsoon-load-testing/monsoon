class HttpError extends Error {
  constructor(error, errorCode) {
    super(error);
    this.code = errorCode;
  }
}

module.exports = HttpError;
