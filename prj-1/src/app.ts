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

type Listener<T> = (items: T[]) => void

class State<T> {
  protected listeners: Listener<T>[] = []
  addListener(listenerFunc: Listener<T>) {
    this.listeners.push(listenerFunc)
  }
}

// Project State Management
class ProjectState extends State<Project> {
  private projects: Project[] = []
  private static instance: ProjectState
  private constructor() {
    super()
  }

  static getInstance() {
    if (this.instance) {
      return this.instance
    }
    this.instance = new ProjectState()
    return this.instance
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

// Component Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement
  hostElement: T
  element: U
  constructor(
    templateId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElementId?: string
  ) {
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement
    this.hostElement = document.getElementById(hostElementId)! as T

    const importedNode = document.importNode(this.templateElement.content, true)
    this.element = importedNode.firstElementChild as U
    if (newElementId) {
      this.element.id = newElementId
    }
    this.attach(insertAtStart)
  }
  private attach(insertAtBeginning: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtBeginning ? 'afterbegin' : 'beforeend',
      this.element
    )
  }
  abstract configure(): void
  abstract renderContent(): void
}

// Project List
class ProjectList extends Component<HTMLDivElement, HTMLElement> {
  assignedProjects: Project[]
  constructor(private type: 'active' | 'finished') {
    super('project-list', 'app', false, `${type}-projects`)
    this.assignedProjects = []
    this.configure()
    this.renderContent()
  }

  private renderProjects() {
    const listEl = document.getElementById(`${this.type}-projects-list`)!
    listEl.innerHTML = ''
    for (const projItem of this.assignedProjects) {
      const listItem = document.createElement('li')
      listItem.textContent = projItem.title
      listEl.appendChild(listItem)
    }
  }
  configure() {
    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter((prj) => {
        if (this.type === 'active') {
          return prj.status === ProjectStatus.Active
        }
        return prj.status === ProjectStatus.Finished
      })
      this.assignedProjects = relevantProjects
      this.renderProjects()
    })
  }
  renderContent() {
    const listId = `${this.type}-projects-list`
    this.element.querySelector('ul')!.id = listId
    this.element.querySelector('h2')!.textContent =
      this.type.toUpperCase() + ' PROJECTS'
  }
}
// Project Input class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInputElement: HTMLInputElement
  descriptionInputElement: HTMLInputElement
  peopleInputElement: HTMLInputElement

  constructor() {
    super('project-input', 'app', true, `user-input`)
    this.titleInputElement = this.element.querySelector(
      '#title'
    )! as HTMLInputElement

    this.descriptionInputElement = this.element.querySelector(
      '#description'
    )! as HTMLInputElement
    this.peopleInputElement = this.element.querySelector(
      '#people'
    )! as HTMLInputElement

    this.configure()
  }
  configure() {
    this.element.addEventListener('submit', this.submitHandler)
  }

  renderContent(): void {}

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
}

const prjInput = new ProjectInput()
const activeProjectList = new ProjectList('active')
const finishedProjectList = new ProjectList('finished')
