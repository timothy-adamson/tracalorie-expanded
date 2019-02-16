//This app uses the Module pattern, aiming to decouple UI and data functions

//Item Controller handles foodList data structure and changes made to it
const ItemController = (function(){

  //Data object stores 
  const data = {
    foodList: [],
    currentItem: null,
    totalCalories: 0,
    goalCalories: 0,
    lastId: 0 //Most recent ID added is cached to generate incremental IDs, regardless of removal of items
  }

  //Food constructor
  Food = function(id,name,calories){
    this.id = id,
    this.name = name,
    this.calories = calories
  }

  //Add, edit and delete foods in foodList data structure

  const add = () => {

    name = document.querySelector(UIController.getSelectors.foodInput).value;
    calories = parseInt(document.querySelector(UIController.getSelectors.caloriesInput).value);

    if (data.foodList.length > 0){
      id = data.lastId + 1;
      data.lastId = id;
    }
    else{
      id = 0
    }

    food = new Food(id, name, calories);

    data.foodList.push(food);
    console.log(`Added ${food.name} with ${food.calories} calories, ID: ${food.id}`);
  }

  const editItem = (editTarget) => {
    name = document.querySelector(UIController.getSelectors.foodInput).value;
    calories = parseInt(document.querySelector(UIController.getSelectors.caloriesInput).value);
    id = data.foodList[editTarget].id;

    data.foodList[editTarget] = new Food(id, name, calories);
    console.log(`Item ID ${editTarget} updated!`);
  }

  const deleteItem = (editTarget) => {
    data.foodList.splice(editTarget,1);
  }

  const setGoalCalories = () => {
    data.goalCalories = parseInt(document.querySelector(UIController.getSelectors.goalInput).value);
  }

  const updateTotalCalories = () => {
    data.totalCalories = data.foodList.reduce((acc,item) => acc + (parseFloat(item.calories) || 0), 0)
  }

  //Return the index of an item in foodList based on its ID, since they can differ due to removals
  //This is used for setting an edit target
  const cycleFoodIDs = (targetID) => {
    for (i = 0; i < data.foodList.length; i++){
      if (data.foodList[i].id == targetID){
        return i;
      }
    }
  }

  //Expose functions
  return {
    add: function(){
      add();
      updateTotalCalories();
    },
    edit: function(editTarget){
      editItem(editTarget);
      updateTotalCalories();
    },
    delete: function(editTarget){
      deleteItem(editTarget);
      updateTotalCalories();
    },
    logData: function(){
      return data;
    },
    clearAll: function(){
      data.foodList = [];
      currentItem = null;
      data.goalCalories = 0;
      data.totalCalories = 0;
    },
    getListIndex: (ID) => {
      return cycleFoodIDs(ID);
    },
    updateTotalCalories: updateTotalCalories,
    setGoalCalories: setGoalCalories
  }
})();

//UI Controller handles UI changes including state, list and form validation
const UIController = (function(){

  //UI Selectors provide a reference area for DOM elements whose ID's/classes may be changed
  const UISelectors = {
    itemList: '#item-list',
    addBtn: '#add-btn',
    updateBtn: '#update-btn',
    deleteBtn: '#remove-btn',
    backBtn: '#back-btn',
    searchBtn: '#search-btn',
    setBtn: '#set-btn',
    clearAll: '#clear-btn',
    foodInput: '#food-input',
    caloriesInput: '#calories-input',
    goalInput: '#goal-input',
    totalCaloriesText: '#total-calories',
    remainingText: '#remaining-text',
    errorLabel: '#error-label'
  }

  const APIKeys = {
    appID: '6efa4d5d',
    appKey: '96c466cb78d34b4a4b2ba6c1368cbd4c'
  }

  //State Management
  const initState = function(){
    clearInputs();
    document.querySelector(UISelectors.addBtn).style.display = 'inline-flex';
    document.querySelector(UISelectors.updateBtn).style.display = 'none';
    document.querySelector(UISelectors.deleteBtn).style.display = 'none';
    document.querySelector(UISelectors.backBtn).style.display = 'none';
    document.querySelector(UISelectors.searchBtn).classList.add('disabled');
  }

  const editState = function(editItemID){
    const items = ItemController.logData().foodList;

    document.querySelector(UISelectors.foodInput).value = items[editItemID].name;
    document.querySelector(UISelectors.caloriesInput).value = items[editItemID].calories;

    document.querySelector(UISelectors.addBtn).style.display = 'none';
    document.querySelector(UISelectors.updateBtn).style.display = 'inline-flex';
    document.querySelector(UISelectors.deleteBtn).style.display = 'inline-flex';
    document.querySelector(UISelectors.backBtn).style.display = 'inline-flex';
  }

  //UI Functionality
  const checkGoalValid = () => {
    const goalInput = document.querySelector(UISelectors.goalInput).value;

    return ((goalInput !== '') ? true : false);
  }

  const checkInputValid = () => {

    const foodInput = document.querySelector(UISelectors.foodInput).value;
    const caloriesInput = document.querySelector(UISelectors.caloriesInput).value;

    return ((foodInput !== '' && caloriesInput !== '') ? true : false);
  }

  const checkFoodEntry = () => {
    const foodInput = document.querySelector(UISelectors.foodInput).value;

    return ((foodInput !== '') ? true : false);
  }

  //Edamam DB search
  const getSearchResult = async () => {
    const input = document.querySelector(UISelectors.foodInput).value
    fetch(
      `https://api.edamam.com/api/food-database/parser?ingr=${encodeURIComponent(input)}&app_id=${APIKeys.appID}&app_key=${APIKeys.appKey}`
    )
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      if (json.parsed.length > 0){
        const calories = json.parsed[0].food.nutrients.ENERC_KCAL;
        document.querySelector(UISelectors.caloriesInput).value = calories;
      }
      else{
        displaySearchError(input);
      }
    });
  }

  const displaySearchError = (foodInput) => {
    document.querySelector(UISelectors.searchBtn).classList.add('disabled');
    document.querySelector(UISelectors.errorLabel).textContent = `\"${foodInput}\" not found in database`;
    
    setTimeout(() => {
      document.querySelector(UISelectors.searchBtn).classList.remove('disabled');
      document.querySelector(UISelectors.errorLabel).textContent = '';
    }, 3000);
  }

  //Update list generates items from foodList each time it is called
  //Eliminates need for removing/adding/editing items in UI as this is done in ItemCtrl
  const updateList = function(){

    const items = ItemController.logData().foodList

    let updateText = '';

    items.forEach(item => {
      updateText += `<tr id="item-${item.id}">
      <td><strong>${item.name}:</strong> <em>${item.calories} calories</em></td>
      <td><a href="#" class="btn right light-blue darken-4" id="edit-btn">Edit</a></td>
      </tr>`
    })
    document.querySelector(UISelectors.itemList).innerHTML = updateText;
    clearInputs();
  }

  const updateTotalCalories = () => {
    const totalCalories = ItemController.logData().totalCalories;
    const goalCalories = ItemController.logData().goalCalories;

    if (goalCalories != null){
      document.querySelector(UISelectors.totalCaloriesText).textContent = `${totalCalories} / ${goalCalories}`;
      document.querySelector(UISelectors.remainingText).innerHTML =
      `Only ${goalCalories - totalCalories} calories to go!`;
    }
    else{
      document.querySelector(UISelectors.totalCaloriesText).textContent = totalCalories;
      document.querySelector(UISelectors.remainingText).innerHTML = '';
    }
  }

  const clearInputs = () => {
    document.querySelector(UISelectors.foodInput).value = null;
    document.querySelector(UISelectors.caloriesInput).value = null;
    document.querySelector(UISelectors.goalInput).value = null;
  }

  //Expose Functions
  return{
    updateList: updateList,
    updateTotal: updateTotalCalories,
    getSelectors: UISelectors,
    checkGoalValid: checkGoalValid,
    checkInputValid: checkInputValid,
    initState: initState,
    editState: editState,
    getSearchResult: getSearchResult,
    checkFoodEntry: checkFoodEntry
  }

})()

//Storage Controller enables persistence to local storage
const StorageController = (() => {
  const getStorage = () => {
    if (localStorage.getItem('foods') !== null){
      ItemController.logData().foodList = JSON.parse(localStorage.getItem('foods'));
    }
    if (localStorage.getItem('goal') !== null){
      ItemController.logData().goalCalories = JSON.parse(localStorage.getItem('goal'))
    }
  }

  const updateStorage = () => {
    localStorage.setItem('foods', JSON.stringify(ItemController.logData().foodList));
    localStorage.setItem('goal', JSON.stringify(ItemController.logData().goalCalories));
  }

  const clearStorage = () => {
    if (localStorage.getItem('foods') !== null){
      localStorage.removeItem('foods');
    }
    if (localStorage.getItem('goal') !== null){
      localStorage.removeItem('goal');
    }
  }

  return{
    getStorage: getStorage,
    updateStorage: updateStorage,
    clearStorage: clearStorage
  }
})()

//App contains functional event logic including init
const App = (function(ItemController, UIController){

  const loadEventListeners = function(){
    const UISelectors = UIController.getSelectors;

    document.querySelector(UISelectors.addBtn).addEventListener('click',itemAddSubmit);
    document.querySelector(UISelectors.updateBtn).addEventListener('click',itemEditSubmit);
    document.querySelector(UISelectors.deleteBtn).addEventListener('click',itemDeleteSubmit);
    document.querySelector(UISelectors.backBtn).addEventListener('click',cancelEdit);
    document.querySelector(UISelectors.itemList).addEventListener('click',goToEdit);
    document.querySelector(UISelectors.setBtn).addEventListener('click',setGoal);
    document.querySelector(UISelectors.clearAll).addEventListener('click',clearAll);
    document.querySelector(UISelectors.searchBtn).addEventListener('click', searchDB);
    document.querySelector(UISelectors.foodInput).addEventListener('input', checkFoodEntry);
  }

  //Search from Edamam API
  const checkFoodEntry = () => {
    const searchBtn = document.querySelector(UIController.getSelectors.searchBtn);
    //Enable search button on valid input
    if (UIController.checkFoodEntry()){
      if (searchBtn.className.includes('disabled')){
        searchBtn.classList.remove('disabled');
      }
    }
    else{
      searchBtn.classList.add('disabled');
    }
  }

  const searchDB = (e) => {
    UIController.getSearchResult();
    e.preventDefault();
  }

  //Adding items to list
  const itemAddSubmit = (e) => {
    if(UIController.checkInputValid()){
      ItemController.add();
      UIController.updateList();
      UIController.updateTotal();
      StorageController.updateStorage();
    }
    e.preventDefault();
  }

  //Editing existing items

  let editTarget; //Using let variable persists the edit target for update/removal functions
  const goToEdit = (e) => {
    if (e.target.id === 'edit-btn'){
      const itemID = e.target.parentNode.parentNode.id.slice(5);
      editTarget = ItemController.getListIndex(itemID);

      UIController.editState(editTarget);
    }
    e.preventDefault();
  }

  const itemEditSubmit = (e) => {
    if(UIController.checkInputValid()){

      ItemController.edit(editTarget);
      UIController.updateList();
      UIController.updateTotal();
      UIController.initState();
      StorageController.updateStorage();
      editTarget = null;
    }
    e.preventDefault();
  }

  const itemDeleteSubmit = (e) => {
    if (confirm(`Are you sure you want to delete ${ItemController.logData().foodList[editTarget].name}?`)){
      ItemController.delete(editTarget);
      UIController.updateList();
      UIController.updateTotal();
      UIController.initState();
      StorageController.updateStorage();
      editTarget = null;
    }
    e.preventDefault();
  }

  const cancelEdit = (e) => {
    UIController.initState();
    editTarget = null;
    e.preventDefault();
  }

  const setGoal = (e) => {
    ItemController.setGoalCalories();
    UIController.updateTotal();
    StorageController.updateStorage();
    e.preventDefault();
  }

  const clearAll = (e) => {
    ItemController.clearAll();
    UIController.updateList();
    UIController.updateTotal();
    UIController.initState();
    StorageController.clearStorage();
    editTarget = null;
    e.preventDefault();
  }

  return{
    init: function(){
      console.log('Initializing...')

      StorageController.getStorage();
      ItemController.updateTotalCalories();
      UIController.initState();
      UIController.updateList();
      UIController.updateTotal();
      loadEventListeners();
    }
  }

})(ItemController,UIController)

App.init();