export class MarkPanelsMissingError extends Error {
  constructor() {
    super('')

    Object.setPrototypeOf(this, MarkPanelsMissingError.prototype)
  }
}
