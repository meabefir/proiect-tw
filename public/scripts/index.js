// const response = await fetch("http://localhost:3000/test/34");
// var data = await response.json();
// console.log(data);

// var data = await fetch("http://localhost:3000/test/34")
//                     .then(res => res.json())
//                     .then(data => {
//                         return data;
//                     })

const baseUrl = "http://localhost:3000/";

var button = document.getElementById("button");
var input = document.getElementById("input");
var container = document.getElementById("container");

var prio_map = {
    "low": 1,
    "medium": 2,
    "high": 3
}

var app = {
    currentUser: undefined,
    cards: undefined,
    errorDuration: 1500,
    errorInterval: undefined,
    sortBy: undefined
}

// get cards of current user
function getCardsData(){
    fetch(baseUrl+`tasks/${app.currentUser}`)
        .then(res => res.json())
        .then(data => {
            app.sortBy = data.preferences.sort_by;
            //console.log(app.sortBy);
            console.log(data.tasks);
            buildCards(data.tasks, true);
        })
}

function getUsers(){
    return fetch(baseUrl+"users")
            .then(res => res.json())
            .then(data => {
                //console.log(data);
                window.localStorage.clear("user");
                buildUserSelection(data);
            })
}

// dom building functions

function clearElement(el){
    el.innerHTML = ``;
    // while (el.firstChild)
    //     el.removeChild(el.firstChild);
}

function buildCards(cards, shouldSort = false){
    clearElement(container);
    app.cards = cards;

    var cards_container = document.createElement("div");
    container.appendChild(cards_container);
    cards_container.className = "cards-container";

    for (card of cards){
        
        var new_card = document.createElement("div");
        cards_container.appendChild(new_card);
        new_card.classList.add("card");
        // set id attribute
        new_card.setAttribute("id", card.id);
        // set color based on priority
        // new_card.classList.add(card.priority);

        // prio ribbon
        var new_ribbon = document.createElement("div");
        new_card.appendChild(new_ribbon);
        new_ribbon.classList = `ribbon ${card.priority}`;

        // title
        var task_title = document.createElement("h2");
        new_card.appendChild(task_title);
        task_title.innerText = card.title;

        // description
        var task_description = document.createElement("p");
        new_card.appendChild(task_description);
        task_description.innerText = card.description;

        // date
        var date_container = document.createElement("div");
        new_card.appendChild(date_container);
        date_container.className = "flex-row no-wrap";

        var calendar_icon = document.createElement("i");
        date_container.appendChild(calendar_icon);
        calendar_icon.className = "far fa-calendar-alt";

        var new_date = document.createElement("div");
        date_container.appendChild(new_date);
        new_date.className = "date";
        new_date.innerText = getDateString(card.deadline);

        // create delete and edit buttons
        var card_buttons = document.createElement("div");
        new_card.appendChild(card_buttons);
        card_buttons.className = "card-buttons-container flex-row";

        var new_delete_button = document.createElement("button");
        card_buttons.appendChild(new_delete_button);
        new_delete_button.setAttribute("id", card.id);

        var new_edit_button = document.createElement("button");
        card_buttons.appendChild(new_edit_button);
        new_edit_button.setAttribute("id", card.id);

        new_delete_button.innerHTML = `<i class="fas fa-trash"></i>`;
        new_delete_button.className = "hover-button";
        new_edit_button.innerHTML = `<i class="fas fa-pen"></i>`;
        new_edit_button.className = "hover-button";

        // ability to delete cards
        new_delete_button.addEventListener("click", (e) => {
            var id = e.currentTarget.getAttribute("id");

            // createConfirmationMenu(`Are you sure you want to remove the task "${app.cards.find(c => e.currentTarget.getAttribute("id") == c.id).title}"?`, () =>{
            createConfirmationMenu(`Are you sure you want to remove the task "${app.cards.find(c => id == c.id).title}"?`, () =>{
                var data = {
                    user: app.currentUser,
                    taskId: id
                    // taskId: e.currentTarget.getAttribute("id")
                }
                //console.log("deleting "+e.currentTarget.getAttribute("id"));
                fetch(`${baseUrl}delete_task`,
                {
                    method: 'delete',
                    headers: {
                        "Content-type": "application/json"
                    },
                    body: JSON.stringify(data)
                })
                    .then(res => res.json())
                    .then(data => {
                        buildCards(data, true);
                    })
            })
        })

        // ability to edit cards
        new_edit_button.addEventListener("click", (e) => {
            var card_data = app.cards.find(c => c.id == e.currentTarget.getAttribute("id"));
            
            console.log(card_data);
            createCreationMenu(card_data);
        })

    }

    // new card button
    var new_card_button = document.createElement("button");
    cards_container.appendChild(new_card_button);
    new_card_button.className = "new-card";
    new_card_button.innerHTML = `<i class="fas fa-plus"></i>`;

    new_card_button.addEventListener("click", () => {
        createCreationMenu();
    })

    // aside
    var aside = document.createElement("aside");
    container.appendChild(aside);
    
    var user_h = document.createElement("h2");
    aside.appendChild(user_h);
    user_h.innerText = app.currentUser;
    user_h.style.marginBottom = "10px";
    user_h.style.fontSize = "40px";

    var change_user_button = document.createElement("button");
    aside.appendChild(change_user_button);
    change_user_button.innerText = "Change user";
    change_user_button.className = "md";
    change_user_button.addEventListener("click", () => {
        getUsers();
    })

    var aside_title = document.createElement("h2");
    aside.appendChild(aside_title);
    aside_title.style.marginTop = "20px";
    aside_title.style.marginBottom = "10px";
    aside_title.innerText = "Sort tasks by:";

    var sorting_types = ["Priority", "Deadline", "Date created"];
    for (sort of sorting_types)
    {
        let new_button = document.createElement("button");
        aside.appendChild(new_button);
        new_button.innerText = sort;
        new_button.className = "button-sort md";
        new_button.setAttribute("sort", sort);
        
        new_button.addEventListener("click", (e) => {
            sortCards(e.currentTarget.getAttribute("sort"));

            fetch(baseUrl+"update_preferences/"+app.currentUser, 
            {
                method: "put",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({sort_by: e.currentTarget.getAttribute("sort")})
            }).then(res => res.json())
              .then(data => {
                console.log(data)
              })
        })
    }

    // sort them if needed
    if (app.sortBy != undefined && shouldSort == true)
    {
        sortCards(app.sortBy);
    }
}

function sortCards(type){
    app.sortBy = type;
    var callback;

    if (type == "Priority"){
        callback = (c1, c2) => { return prio_map[c2.priority] - prio_map[c1.priority]};
    }

    if (type == "Deadline"){
        callback = (c1, c2) => { return c1.deadline - c2.deadline};
    }
    
    if (type == "Date created"){
        callback = (c1, c2) => { return c2.created_at - c1.created_at};
    }

    app.cards.sort(callback);

    buildCards(app.cards);
}

function buildUserSelection(users){
    clearElement(container);

    var user_seleciton_div = document.createElement("div");
    container.appendChild(user_seleciton_div);
    user_seleciton_div.className = "user-selection";
    
    var new_ul = document.createElement("ul");
    user_seleciton_div.appendChild(new_ul);
    new_ul.className = "no-style";
    
    for (user of users){
        var new_li = document.createElement("li");
        new_ul.appendChild(new_li);

        // user button
        var new_button = document.createElement("button");
        new_li.appendChild(new_button);
        new_button.innerText = user;
        new_button.className = "button-user";
        
        new_button.addEventListener("click", (e) => {
            app.currentUser = e.currentTarget.innerText;
            window.localStorage.setItem("user", app.currentUser);
            //console.log(app.currentUser);
            getCardsData();
        });
        
        // user delete button
        var new_remove_button = document.createElement("button");
        new_li.appendChild(new_remove_button);
        new_remove_button.innerHTML = `<i class="fas fa-trash"></i>`;
        new_remove_button.className = "button-user-remove";
        new_remove_button.setAttribute("user", user);

        new_remove_button.addEventListener("click", (e) => {
            var id = e.currentTarget.previousSibling.innerText;
          //  fetch(`${baseUrl}delete_user/${e.currentTarget.previousSibling.innerText}`, {method: "delete"})
            createConfirmationMenu(`Are you sure you want to delete user ${id}?`, () => {
                //fetch(baseUrl+"delete_user/"+e.target.previousSibling.innerText, {method: "delete"})
                console.log("deleting ", id);
                fetch(baseUrl+"delete_user/"+id, {method: "delete"})
                    .then(res => res.json())
                    .then(data => {
                        console.log(data);
                        buildUserSelection(data);
                    })
            })
        })
    }

    // new user input
    var new_li = document.createElement("li");
    new_ul.appendChild(new_li);
    new_li.className = "flex-row";

    var new_user_input = document.createElement("input");
    new_li.appendChild(new_user_input);

    new_user_input.class = "input-new-user";
    new_user_input.type = "text";
    new_user_input.placeholder = "Enter new user...";

    new_add_button = document.createElement("button");
    new_add_button.innerHTML = `<i class="fas fa-plus"></i>`;
    new_add_button.className = "low";
    new_li.appendChild(new_add_button);
    new_add_button.addEventListener("click", (e) => {
        // var new_user_name = e.currentTarget.previousElementSibling.value.trim();
        var new_user_name = new_user_input.value.trim();
        
        if (new_user_name == "")
        {
            createError("You need a name for a new user!");
            return;
        }

        fetch(baseUrl+"user", 
        {
            method: "post",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({user: new_user_name})
        }).then(res => res.json())
            .then(data => {
                if (data.err != undefined)
                {
                    createError(data.err);
                    return;
                }
                buildUserSelection(data);
            })
            .catch(err => {
                console.log(err);
            })
    })

}

function createCreationMenu(data){
    createCover();

    var new_div = document.createElement("div");

    document.body.appendChild(new_div);

    new_div.className = "creation-container temp-container flex-col cover";
    new_div.id = "creation-container";

    new_div.innerHTML = `
        <label> Task title </label>
        <input type="text" id="title-input" placeholder="Enter title...">

        <label> Task description </label>
        <textarea id="description-input" rows="4" placeholder="Enter description..."></textarea>

        <label> Deadline </label>
        <input type="date" id="deadline-input">

        <label> Priority </label>
        <div class="flex-row" id="priority-inputs">
            <div>
                <input type="radio" name="priority" value="low" ${data != undefined && data.priority == "low" ? "checked": ""}>
                <label for="priority">low</label>
            </div>
            <div>
                <input type="radio" name="priority" value="medium" ${data != undefined && data.priority == "medium" ? "checked": ""}>
                <label for="priority">medium</label>
            </div>
            <div>
                <input type="radio" name="priority" value="high" ${data != undefined && data.priority == "high" ? "checked": ""}>
                <label for="priority">high</label>
            </div>
        </div>

        <div class="flex-row creation-buttons">
            <button class="button confirm big" id="button-confirm"> Confirm </button>
            <button class="button cancel big" id="button-cancel"> Cancel </button>
        </div>
    `

    // if we are creating edit menu
    if (data != undefined)
    {
        document.getElementById("title-input").value = data.title;
        document.getElementById("description-input").value = data.description;

        var date_string = getDateString(data.deadline);
       // console.log(date_string);
        document.getElementById("deadline-input").value = date_string;

    }

    // exit creation menu
    document.getElementById("button-cancel").addEventListener("click", () => {
        document.body.removeChild(document.getElementById("creation-container"));
        removeCover();
    })

    // create new card
    document.getElementById("button-confirm").addEventListener("click", () => {
        var priority = undefined;
        var titleInput = document.getElementById("title-input");
        var descriptionInput = document.getElementById("description-input");
        var deadlineInput = document.getElementById("deadline-input");

        for (child of document.getElementById("priority-inputs").children){
            if (child.children[0].checked){
                priority = child.children[0].value;
            }
        }

        if (titleInput.value.trim() == "")
        {
            createError("You need a title for the task!");
            return;
        }
        if (titleInput.value.length > 50)
        {
            createError("Title is too long! Enter at most 40 characters!");
            return;
        }
        if (descriptionInput.value.trim() == "")
        {
            createError("You need a description for the task!");
            return;
        }
        if (deadlineInput.value == "")
        {
            createError("You need to add a deadline for the task!");
            return;
        }
        if (priority == undefined)
        {
            createError("You have to select a priority for the task!");
            return;
        }
        
        var date = new Date(Date.parse(deadlineInput.value));
        //console.log(date);

        // if we passed all the checks we can create a new card
        var new_card_data = {
            "user": app.currentUser,
            "title": titleInput.value,
            "description": descriptionInput.value,
            "priority": priority,
            "deadline": date
        }
        
        // if creating
        if (data == undefined)
        {
            var url = baseUrl + `create_task`;
            fetch(url, {
                method: 'post',
                headers: {
                "Content-type": "application/json"
                },
                body: JSON.stringify(new_card_data)
            }).then(res => res.json()
            ).then(data => {
                document.body.removeChild(document.getElementById("creation-container"));
                removeCover();
                buildCards(data, true);
            })
            .catch(err => {
                console.log(`Rip this is the error ${err}`);
            })
        }
        // if editting
        else
        {
            new_card_data.id = data.id;
            var url = baseUrl + `edit_task`;
            fetch(url, {
                method: 'put',
                headers: {
                "Content-type": "application/json"
                },
                body: JSON.stringify(new_card_data)
            }).then(res => res.json()
            ).then(data => {
                document.body.removeChild(document.getElementById("creation-container"));
                removeCover();
                buildCards(data, true);
            })
            .catch(err => {
                console.log(`Rip this is the error ${err}`);
            })
        }
    })
}

function getDateString(date)
{
    var temp_date = new Date(date);

    var month = String(temp_date.getMonth());
    month = month.length > 1 ? month : '0'+month;

    var day = String(temp_date.getDay());
    day = day.length > 1 ? day : '0'+day;

    var year = String(temp_date.getFullYear());
    while (year.length < 4)
        year = '0'+year;

    var date_string = `${year}-${month}-${day}`;
    return date_string;
}

function createConfirmationMenu(str, callback){
    createCover();

    var new_div = document.createElement("div");
    document.body.appendChild(new_div);

    new_div.className = "confirmation-container temp-container";
    new_div.id = "confirmation-container";
    new_div.innerHTML = `
        <h2 class="wrap">${str}</h2>
        <button class="button confirm big" id="button-confirm"> Confirm </button>
        <button class="button cancel big" id="button-cancel"> Cancel </button>
    `

    document.getElementById("button-cancel").addEventListener("click", () => {
        document.body.removeChild(document.getElementById("confirmation-container"));
        removeCover();
    })

    document.getElementById("button-confirm").addEventListener("click", () => {
        callback();
        document.body.removeChild(document.getElementById("confirmation-container"));
        removeCover();
    })
}

function createCover(){
    var new_cover = document.createElement("div");
    new_cover.id = "cover";
    document.body.appendChild(new_cover);
}

function removeCover(){
    document.body.removeChild(document.getElementById("cover"));
}

function createError(str){
    if (document.getElementById("error") != null)
        document.body.removeChild(document.getElementById("error"));

    var new_error = document.createElement("div");
    document.body.appendChild(new_error);
    new_error.innerText = str;
    new_error.id = "error";

    if (app.errorInterval != undefined)
        clearInterval(app.errorInterval);
    app.errorInterval = setTimeout(() => {
        if (document.getElementById("error") != null)
        document.body.removeChild(document.getElementById("error"));
        app.errorInterval = undefined;
    }, app.errorDuration);

}

function init(){
    if (window.localStorage.getItem("user") != null){
        app.currentUser = window.localStorage.getItem("user");
        getCardsData();
    }
    else
    getUsers();

}
init();