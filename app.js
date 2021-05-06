var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");
const PORT = 3000;
var events = require("events");

var app = express();
var eventsEmitter = new events.EventEmitter();

app.use("/public", express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.json());


var data = fs.readFileSync('./db.json', 'utf8', (err, jsonString) => {
                if (err) {
                    console.log("File read failed:", err)
                    return
                }
                return jsonString;
            })

data = JSON.parse(data);
            
function saveDatabase(){
    fs.writeFileSync('db.json', JSON.stringify(data), function (err) {
        console.log("could not save");
      });
}

var newUserTemplate = {
    tasks: [],
    preferences: {
        sort_by: "default"
    }
}

// helper functions
function getUserNames(){
    var users = [];
    for (key in data)
        users.push(key);
    return users;
}

// ROUTES

// add new card
app.post('/create_task', (req, res) => {
    // if user is not in database yet
    if (data[req.body.user] == undefined)
        data[req.body.user] = newUserTemplate;

    user_data = data[req.body.user];

    user_data.tasks.push({
        "id": Math.floor(Math.random() * 1000000000),
        "user": req.body.user,
        "title": req.body.title,
        "description": req.body.description,
        "priority": req.body.priority,
        "created_at": Date.now(),
        "deadline": new Date(req.body.deadline).getTime()
    })

    saveDatabase();

    res.send(user_data.tasks);
})

// edit task
app.put("/edit_task", (req, res) => {
    var task = data[req.body.user].tasks.find(t => t.id == req.body.id);

    task.title = req.body.title;
    task.description = req.body.description;
    task.deadline = new Date(req.body.deadline).getTime();
    task.priority = req.body.priority;

    saveDatabase();

    res.send(data[req.body.user].tasks);
})

// delete task
app.delete("/delete_task", (req, res) => {
    var user = req.body.user;
    var taskId = req.body.taskId;

    data[user].tasks = data[user].tasks.filter(task => task.id != taskId); 

    saveDatabase();

    res.send(data[user].tasks);
})

// get all tasks
app.get("/tasks/:user", (req, res) => {

    // if user is not in database yet
    if (data[req.params.user] == undefined)
        data[req.params.user] = newUserTemplate;

    res.send(data[req.params.user]);
})

// get all users
app.get("/users", (req, res) => {
    res.send(getUserNames());
})

// delete user
app.delete("/delete_user/:user", (req, res) => {
    var user_to_delete = req.params.user;
    
    if (data[user_to_delete] != undefined)
        delete data[user_to_delete];
    saveDatabase();

    res.send(getUserNames());
})

// create user
app.post("/user", (req, res) => {
    for (key in data)
    {
        if (key == req.body.user)
        {
            res.send({err: "User already exists!"});
            return;
        }
    }

    var new_user = newUserTemplate;
    data[req.body.user] = new_user;
    saveDatabase();

    res.send(getUserNames());
})

app.put("/update_preferences/:user", (req, res) => {
    var new_prefs = req.body;
    var user = req.params.user;

    for (pref in data[user].preferences)
    {
        for (pref2 in new_prefs)
        {
            if (pref == pref2)
            {
                data[user].preferences[pref] = new_prefs[pref2];
            }
        }
    }

    saveDatabase();

    res.send({msg: "prefs updated"});
})

// home page
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
})