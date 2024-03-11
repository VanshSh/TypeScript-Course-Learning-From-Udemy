enum ProjectStatus {
  Active,
  Finished,
}

// Project Type
class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

// Validation
interface validatable {
  value: string | number
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
}

// Input validation function
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

type Listener = (items: Project[]) => void
// Project State Management
class ProjectState {
  private listeners: Listener[] = []
  private projects: Project[] = []
  private static instance: ProjectState
  private constructor() {}

  static getInstance() {
    if (this.instance) {
      return this.instance
    }
    this.instance = new ProjectState()
    return this.instance
  }
  addListener(listenerFunc: Listener) {
    this.listeners.push(listenerFunc)
  }
  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Date.now().toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active
    )
    this.projects.push(newProject)
    for (const listenerFunc of this.listeners) {
      listenerFunc(this.projects.slice())
    }
  }
}

const projectState = ProjectState.getInstance()

// Project List
class ProjectList {
  assignedProjects: Project[]
  templateElement: HTMLTemplateElement
  hostElement: HTMLElement
  element: HTMLElement
  constructor(private type: 'active' | 'finished') {
    this.templateElement = document.getElementById(
      'project-list'
    )! as HTMLTemplateElement
    const importedNode = document.importNode(this.templateElement.content, true)
    this.element = importedNode.firstElementChild as HTMLElement
    this.element.id = `${this.type}-projects`
    this.hostElement = document.getElementById('app')! as HTMLDivElement
    this.assignedProjects = []
    projectState.addListener((projects: Project[]) => {
      this.assignedProjects = projects
      this.renderProjects()
    })
    this.attach()
    this.renderContent()
  }

  private renderProjects() {
    const listEl = document.getElementById(`${this.type}-projects-list`)!
    for (const projItem of this.assignedProjects) {
      const listItem = document.createElement('li')
      listItem.textContent = projItem.title
      listEl.appendChild(listItem)
    }
  }
  private renderContent() {
    const listId = `${this.type}-projects-list`
    this.element.querySelector('ul')!.id = listId
    this.element.querySelector('h2')!.textContent =
      this.type.toUpperCase() + ' PROJECTS'
  }

  private attach() {
    this.hostElement.insertAdjacentElement('beforeend', this.element)
  }
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
      projectState.addProject(title, description, people)
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
const activeProjectList = new ProjectList('active')
const finishedProjectList = new ProjectList('finished')
