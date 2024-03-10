// Validaartion
interface validatable {
  value: string | number
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
}

function validate(validatableInput: validatable) {
  let isValid = true
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0
  }
  if (
    validatableInput.minLength != null &&
    typeof validatableInput.value === 'string'
  ) {
    isValid =
      isValid && validatableInput.value.length >= validatableInput.minLength
  }
  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === 'string'
  ) {
    isValid =
      isValid && validatableInput.value.length <= validatableInput.maxLength
  }
  if (
    validatableInput.min != null &&
    typeof validatableInput.value === 'number'
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min
  }
  if (
    validatableInput.max != null &&
    typeof validatableInput.value === 'number'
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max
  }
  return isValid
}

// Auto bind decorator
function autoBind(_: any, _2: string, descriptior: PropertyDescriptor) {
  const originalMethod = descriptior.value
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this)
      return boundFn
    },
  }
  return adjDescriptor
}

// Project Input class
class ProjectManager {
  templateElement: HTMLTemplateElement
  hostElement: HTMLDivElement
  element: HTMLFormElement
  titleInputElement: HTMLInputElement
  descriptionInputElement: HTMLInputElement
  peopleInputElement: HTMLInputElement

  constructor() {
    this.templateElement = document.getElementById(
      'project-input'
    )! as HTMLTemplateElement
    const importedNode = document.importNode(this.templateElement.content, true)
    this.element = importedNode.firstElementChild as HTMLFormElement
    this.element.id = 'user-input'
    this.hostElement = document.getElementById('app')! as HTMLDivElement

    this.titleInputElement = this.element.querySelector(
      '#title'
    )! as HTMLInputElement

    this.descriptionInputElement = this.element.querySelector(
      '#description'
    )! as HTMLInputElement
    this.peopleInputElement = this.element.querySelector(
      '#people'
    )! as HTMLInputElement

    this.attach()
    this.configure()
  }
  private attach() {
    this.hostElement.insertAdjacentElement('afterbegin', this.element)
  }

  private gatherUserData(): [string, string, number] | void {
    // void tells that this function has condition where it will return nothing
    const enteredTitleValue = this.titleInputElement.value
    const enteredDescriptionValue = this.descriptionInputElement.value
    const enteredPeopleNumberValue = this.peopleInputElement.value

    const titleValidatabel: validatable = {
      value: enteredTitleValue,
      required: true,
    }
    const descriptionValidatabel: validatable = {
      value: enteredDescriptionValue,
      required: true,
      minLength: 5,
    }
    const peopleNumberValidatabel: validatable = {
      value: +enteredPeopleNumberValue,
      required: true,
      min: 1,
      max: 5,
    }

    if (
      !validate(titleValidatabel) ||
      !validate(descriptionValidatabel) ||
      !validate(peopleNumberValidatabel)
    ) {
      alert('Please enter valid input values')
      return
    } else {
      return [
        enteredTitleValue,
        enteredDescriptionValue,
        +enteredPeopleNumberValue,
      ]
    }
  }

  @autoBind
  private submitHandler(event: Event) {
    event.preventDefault()
    const userInput = this.gatherUserData()
    if (Array.isArray(userInput)) {
      const [title, description, people] = userInput
      console.log('😇 L-78 in app.ts=> ', title, description, people)
      this.clearInputs()
    }
  }
  private clearInputs() {
    this.titleInputElement.value = ''
    this.descriptionInputElement.value = ''
    this.peopleInputElement.value = ''
  }
  private configure() {
    this.element.addEventListener('submit', this.submitHandler)
  }
}

const prjInput = new ProjectManager()
