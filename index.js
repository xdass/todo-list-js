const taskField = document.querySelector('.taskForm');
const nameInput = document.querySelector('input[name="name"]');
const descriptionInput = document.querySelector('input[name="description"]');
const todoColumn = document.querySelector('.todo');
const inprogressColumn = document.querySelector('.inprogress');
const doneColumn = document.querySelector('.done');
const deleteTask = new CustomEvent('deleteTask', {bubbles: true, detail: { order: null, type: null } });
const addTask = new CustomEvent('addTask', {bubbles: true, detail: {name: null, description: null } } );
const moveItem = new CustomEvent('moveItem', {bubbles: true, detail: {obj: null, parent: null, direction: null} } );
Sortable.create(todo, {
  group: {
    name: 'todo',
    put: ['inprogress', 'done'],
  },
});

Sortable.create(inprogress, {
  group: {
    name: 'inprogress',
    put: ['todo', 'done'],
  },
});
Sortable.create(done, {
  group: {
    name: 'done',
    put: ['todo', 'inprogress'],
  },
});

class Board {
  constructor() {
    this.addTaskBtn = document.querySelector('.addTaskBtn');
    this.boardNode = document.querySelector('.board');
    this.todos = [
      { name: 'Дело 1', description: 'Закончить дело 1', status: 'todo', order: 2 },
      { name: 'Дело 2', description: 'Закупить комплектующие на самолет', status: 'inprogress', order: 1 },
      { name: 'Дело 3', description: 'Закончить дело 3', status: 'done', order: 0 },
      { name: 'Дело 4', description: 'Закончить дело 4', status: 'todo', order: 0 },
      { name: 'Дело 5', description: 'Закончить дело 55', status: 'todo', order: 1 },
      { name: 'Дело 26', description: 'Закупить комплектующие на самолет', status: 'inprogress', order: 0 },
    ];
    this.todoColumn = new Column(todoColumn, this.todos);
    this.inprogressColumn = new Column(inprogressColumn, this.todos);
    this.doneColumn = new Column(doneColumn, this.todos);
    this.addTaskBtn.addEventListener('click', (e) => {
      let newTask = {name: nameInput.value, description: descriptionInput.value, status: 'todo', order: this.todoColumn.todosList.length };
      this.todoColumn.addTask(newTask);
      nameInput.value = '';
      descriptionInput.value = '';
    });
    this.boardNode.addEventListener('moveItem', (e) => {
      if (e.detail.parent === 'inprogress') {
        if (e.detail.direction === 'right') {
          this.doneColumn.addTask(e.detail.obj);
        } else {
          this.todoColumn.addTask(e.detail.obj);
        }
      } else if (e.detail.parent === 'todo') {
        this.inprogressColumn.addTask(e.detail.obj);
      } else {
        this.inprogressColumn.addTask(e.detail.obj);
      }
    });
    this.boardNode.addEventListener('end', (e) => {
      console.log(e);
      if (e.srcElement.className.slice(9) === e.item.parentNode.className.slice(9)) {
        // Перетаскивание внетри столбца
        if (e.srcElement.className.slice(9) === 'todo') {
          this.todoColumn.todosList = this.getData(this.todoColumn.columnNode, e.newIndex);
        }
        if (e.srcElement.className.slice(9) === 'inprogress') {
          this.inprogressColumn.todosList = this.getData(this.inprogressColumn.columnNode, e.newIndex);
        }
        if (e.srcElement.className.slice(9) === 'done') {
          this.doneColumn.todosList = this.getData(this.doneColumn.columnNode, e.newIndex);
        }
      } else {
        let startColumn = this[`${e.srcElement.className.slice(9)}Column`].todosList;
        let startColumnState = this.getData(this[`${e.srcElement.className.slice(9)}Column`].columnNode, e.newIndex);
        let endColumn = this[`${e.item.parentNode.className.slice(9)}Column`].todosList;
        let endColumnState = this.getData(this[`${e.item.parentNode.className.slice(9)}Column`].columnNode, e.newIndex);
        this[`${e.srcElement.className.slice(9)}Column`].deleteTask(e.oldItem);
        this[`${e.item.parentNode.className.slice(9)}Column`].todosList = this.getData(this[`${e.item.parentNode.className.slice(9)}Column`].columnNode, e.newIndex);
        console.log(this.todoColumn);
        console.log(this.inprogressColumn);
        console.log(this.doneColumn);
      }
    });
  }
  getData(node, index) {
    let model = [];
    Object.keys(node.children).forEach((key) => {
      let data = {};
      data.status = node.className.slice(9);
      //data.order = parseInt(node.children[key].dataset.order, 10);
      data.order = index;
      data.name = node.children[key].children[0].innerText;
      data.description = node.children[key].children[1].innerText;
      model.push(data);
    });
    return model;
  }
}

class Column {
  constructor(columnNode, taskList) {
    const tmpList = [];
    this.columnNode = columnNode;
    taskList.forEach((item) => {
      if (item.status === this.columnNode.className.slice(9)) {
        tmpList.push(item);
      }
    });
    this.todosList = tmpList;
  }
  set todosList(newList) {
    newList.sort(function(a, b) {
      return a.order - b.order;
    });
    newList.forEach((item, index) => {
      item.order = index;
    });
    this._todosList = newList;
    this.render();
  }
  get todosList() {
    return this._todosList;
  }
  addTask(newTask) {
    const tmp = this.todosList;
    tmp.push(newTask);
    this.todosList = tmp;
  }
  deleteTask(taskOrder) {
    let tmp = this.todosList;
    tmp.splice(parseInt(taskOrder, 10), 1);
    this.todosList = tmp;
  }
  moveUp(taskOrder) {
    let tmp = this.todosList;
    tmp[parseInt(taskOrder, 10)].order -= 1;
    tmp[parseInt(taskOrder, 10) - 1].order += 1;
    this.todosList = tmp;
  }
  moveDown(taskOrder) {
    let tmp = this.todosList;
    tmp[parseInt(taskOrder, 10)].order += 1;
    tmp[parseInt(taskOrder, 10) + 1].order -= 1;
    this.todosList = tmp;
  }
  move(taskOrder, direction) {
    let tmp = this.todosList;
    const itemToMove = tmp.splice(parseInt(taskOrder, 10), 1);
    moveItem.detail.obj = itemToMove[0];
    moveItem.detail.parent = this.columnNode.className.slice(9);
    moveItem.detail.direction = direction;
    this.columnNode.dispatchEvent(moveItem);
    if (tmp.length !== 0) {
      tmp[0].order = 0;
    }
    this.todosList = tmp;
  }
  render() {
    this.columnNode.innerHTML = '';
    this.todosList.forEach((item) => {
      const div = document.createElement('div');
      const btn = document.createElement('span');
      const taskName = document.createElement('span');
      const backward = document.createElement('span');
      const forward = document.createElement('span');
      const up = document.createElement('span');
      const down = document.createElement('span');
      const description = document.createElement('p');
      btn.addEventListener('click', (e) => {
        this.deleteTask(e.target.parentNode.dataset.order);
      });
      up.addEventListener('click', (e) => {
        this.moveUp(e.target.parentNode.dataset.order);
      });
      down.addEventListener('click', (e) => {
        this.moveDown(e.target.parentNode.dataset.order);
      });
      backward.addEventListener('click', (e) => {
        this.move(e.target.parentNode.dataset.order, 'left');
      });
      forward.addEventListener('click', (e) => {
        this.move(e.target.parentNode.dataset.order, 'right');
      });
      btn.classList.add('deleteBtn');
      div.classList.add('task');
      backward.classList.add('backward');
      forward.classList.add('forward');
      up.classList.add('up');
      down.classList.add('down');
      taskName.classList.add('taskTitle');
      description.classList.add('taskDescription');
      div.dataset.order = item.order;
      taskName.innerText = item.name;
      description.innerText = item.description;
      div.appendChild(taskName);
      div.appendChild(description);
      div.appendChild(btn);
      if (this.columnNode.className.slice(9) !== 'todo') {
        div.appendChild(backward);
      }
      if (this.columnNode.className.slice(9) !== 'done') {
        div.appendChild(forward);
      }
      if (item.order !== 0) {
        div.appendChild(up);
      }
      if (item.order !== this.todosList.length - 1) {
        div.appendChild(down);
      }
      this.columnNode.appendChild(div);
    });
  }
}

const board = new Board();
