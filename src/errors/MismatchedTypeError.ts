export class MismatchedTypeError extends Error {
  public name = 'MismatchedTypeError'
  public expectedType: string
  public receivedType: string

  constructor(expectedType: string, receivedType: string) {
    super()
    Object.setPrototypeOf(this, MismatchedTypeError.prototype)

    this.expectedType = expectedType
    this.receivedType = receivedType
  }

  public get message(): string {
    return `${this.name}: type ${this.expectedType} is not assignable to type ${this.receivedType}`
  }
}
