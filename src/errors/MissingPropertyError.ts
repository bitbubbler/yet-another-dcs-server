export class MissingPropertyError extends Error {
  public name = 'MissingPropertyError'
  public propertyName: string
  public targetName: string

  constructor(propertyName: string, targetName: string) {
    super()
    Object.setPrototypeOf(this, MissingPropertyError.prototype)

    this.propertyName = propertyName
    this.targetName = targetName
  }

  public get message(): string {
    return `${this.name}: property ${this.propertyName} was missing from ${this.targetName}`
  }
}
