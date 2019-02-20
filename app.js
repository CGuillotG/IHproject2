//Imports
require("dotenv").config()

let express = require("express") //Fast, unopinionated, minimalist web framework for node.
let session = require ("express-session") // every user of you API or website will be assigned a unique session, and this allows you to store the user state.
let mongoose = require("mongoose") //DB
let hbs =  require ("hbs") //views
let passport = require ("./helpers/passport") //Passport's sole purpose is to authenticate requests
let bodyParser = require ("body-parser") //Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
let cookieParser = require ("cookie-parser") //Parse Cookie header and populate req.cookies with an object keyed by the cookie names. 
let favicon = require ("serve-favicon") //Middleware for serving a favicon in memory thereby improving performance
let logger = require ("morgan") //HTTP request logger middleware
let path = require("path") //Utilities for working with file and directory paths
let paypal = require("paypal-rest-sdk") //paypal pays


let flash = require("connect-flash");
    
//DB Connection
mongoose.connect(process.env.DB, {useNewUrlParser: true})
  .then(x => console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`))
  .catch(err => console.error('Error connecting to mongo', err))

//App config
const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);
const app = express();

//Session Setup
app.use(session({
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true,
  cookie:{maxAge:60000}
}))
app.use(flash());

//Passport Setup
app.use(passport.initialize())
app.use(passport.session())

//PayPal Setup
paypal.configure({
    "mode":"sandbox",
    "client_id":process.env.PAYPAL_ID,
    "client_secret":process.env.PAYPAL_SECRET
})

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//Views Config
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//Public Setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

//HBS Helper
hbs.registerHelper('ifUndefined', (value, options) => {
  if (arguments.length < 2)
      throw new Error("Handlebars Helper ifUndefined needs 1 parameter");
  if (typeof value !== undefined ) {
      return options.inverse(this);
  } else {
      return options.fn(this);
  }
});

//Local Variables
app.locals.title = 'Community';
app.locals.loggedUser = false

//Logged In Check Middleware
function isLogged(req,res,next){
    if(req.isAuthenticated()){
        app.locals.loggedUser=true
        next()
    } else {
        app.locals.loggedUser=false
        next()
    }
}

//Routes
let index = require ("./routes/index")
let auth = require ("./routes/auth")
let products = require ("./routes/products")
let Paypal = require ("./routes/paypal")
let users = require("./routes/users")
app.use("/",isLogged,index)
app.use("/",isLogged,auth)
app.use("/",isLogged,products)
app.use("/",isLogged,users)
app.use("/",isLogged,Paypal)

app.listen(process.env.PORT, () => {
    console.log(`Listening on http://localhost:${process.env.PORT}`);
});

      
module.exports = app;
