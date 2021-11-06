
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');  // this tells our app (generated using express) to use ejs as its view engine

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public")); // this tells express to serve up the CSS file (styles.css) and location of it and tells it to use it

mongoose.connect("mongodb+srv://dbFarhan:farhanul12345@cluster0.v8u6e.mongodb.net/todolistDB", {useNewUrlParser: true});  // connecting to mongodb

const itemsSchema = {   // creating a schema for structure of the data in the database
  name: String
};

// creating model
const Item = mongoose.model("Item", itemsSchema);

// Adding documents
const item1 = new Item({
  name: "Welcome to my todolist!"   // this is a default item
});

const item2 = new Item({
  name: "Default item"   // this is a default item
});

// Array containing the items
const defaultItems = [item1, item2];

// creating list schema
const listSchema = {
  name: String,
  items: [itemsSchema]   // the schema is going to have an array of item documents associated with it
}

// creatign list model
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  // getting the items from the database
  Item.find({}, function(err, foundItems){  // {} finds all items in the collection

    if(foundItems.length === 0){
      // Inserting the items
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully saved default items.");
        }
      });
      res.redirect("/");  //redirects to root route and checks if there are items present. This time, it will fall into the else block.
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});  // passing over foundItems to list.ejs
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({  // creating document for the new item that was added
    name: itemName
  });

  if(listName === "Today"){

    item.save();  // saving the new item into the collection of items
    res.redirect("/"); // redirecting to home route. app.get is execited again

  }else{  // if the item comes from the custom list, we find the custom list and add that
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" +listName); //redirecting to route where the user came from
    });
  }

});

app.post("/delete", function(req, res){

  const itemToBeDeleted = req.body.checkbox; // saving the id of the item that was checked in the box to delete
  const listName = req.body.listName;

  if(listName === "Today"){

    Item.findByIdAndRemove(itemToBeDeleted, function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Successfully deleted.");
        res.redirect("/"); // goes back to app.get
      }
    });

  }else{
    // finding the list that we want and then updating
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemToBeDeleted}}}, function(err, foundList){
      if(err){
        console.log(err);
      }else{
        res.redirect("/" +listName); // redirecting to custom list path
      }
    });
  }

});

// For custom lists
app.get("/:customListName", function(req, res){  // using express route parameters to create to create a dynamic route. We can then have custom lists

  const customListName = _.capitalize(req.params.customListName);  // captured values are populated in the req.params object. First letter is converted to uppercase

  List.findOne({name: customListName}, function(err, foundList){  // returns the current list if it is found.
    if(err){
      console.log(err);
    }else{
      if(!foundList){  // if the list does not exist, a new list document that was written in the link is created

        // creating list documents
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save(); // saving it into the collection

        res.redirect("/" +customListName);  //redirecting back to the current route

      }else{  // showing an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});

let port = process.env.PORT;  // listening on a specific port for heroku
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
