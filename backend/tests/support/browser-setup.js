// SHOW_BUGS=1 runs the known-bug tests (test.failing) as ordinary tests, to see each failure.
if (process.env.SHOW_BUGS) test.failing = test;

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  require("./page").unloadPage();
  jest.restoreAllMocks();
  localStorage.clear();
});
