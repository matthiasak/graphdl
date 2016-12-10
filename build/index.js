module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmory imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmory exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		Object.defineProperty(exports, name, {
/******/ 			configurable: false,
/******/ 			enumerable: true,
/******/ 			get: getter
/******/ 		});
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/index.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_graphql__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_graphql___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_graphql__);
var _extends=Object.assign||function(target){for(var i=1;i<arguments.length;i++){var source=arguments[i];for(var key in source)Object.prototype.hasOwnProperty.call(source,key)&&(target[key]=source[key])}return target};const{// These are the basic GraphQL types
GraphQLInt:INT,GraphQLFloat:FLOAT,GraphQLString:STRING,GraphQLList:LIST,GraphQLObjectType:OBJ,GraphQLEnumType:ENUM,GraphQLBoolean:BOOL// This is used to create required fields and arguments
,GraphQLNonNull:REQ// This is the class we need to create the schema
,GraphQLSchema:SCHEMA,graphql:g}=__WEBPACK_IMPORTED_MODULE_0_graphql__,PARTS={KEY:"\\w+",CURL0:"{",CURL1:"}",SQ0:"\\[",SQ1:"\\]",P0:"\\(",P1:"\\)",EXCL:"\\!",COLON:":"}// , COMMENT = "(#.*(?=\\n*))"
,ALL=Object.keys(PARTS).map(a=>PARTS[a]),ANY=new RegExp(`${ALL.join("|")}`,`ig`),r=a=>new RegExp(a,"ig"),t=(a,b)=>({type:a,val:b}),m=(a,b)=>a.match(r(b)),lexer=a=>a.match(ANY).map(b=>{if(m(b,PARTS.KEY))return t("key",b);if(m(b,PARTS.CURL0))return t("open-curly",b);if(m(b,PARTS.CURL1))return t("close-curly",b);if(m(b,PARTS.SQ0))return t("open-sq",b);if(m(b,PARTS.SQ1))return t("close-sq",b);if(m(b,PARTS.P0))return t("open-paren",b);if(m(b,PARTS.P1))return t("close-paren",b);if(m(b,PARTS.COLON))return t("colon",b);if(m(b,PARTS.EXCL))return t("excl",b);throw`Token not identified: ${b}`}),indexOf=(a,b)=>{for(var c=0,d=a.length;c<d;c++)if(b(a[c],c))return c;return-1},parseType=a=>{let b=a.shift();if("key"===b.type){let c=a[0],d=c&&"excl"===c.type&&a.shift(),e=d?t("required"):t("optional");return e.val=b.val,e}if("open-sq"===b.type){let c=a.shift(),d=a.shift();if("close-sq"!==d.type)throw new Error(`Syntax error: ${b.type}_${b.val}`);return t("array-of",c.val)}throw new Error(`Syntax error: ${b.type}_${b.val}`)},parseExprBodies=a=>{let b=[];for(;0<a.length;){let c=a.shift(),d=a.shift(),e=parseType(a);e.name=c.val,b.push(e)}return b},parseMutExpr=a=>{let b=[];for(;0<a.length;){let c=indexOf(a,q=>"close-paren"===q.type);if(-1===c)throw"Closing ) not found in mutation";let[d,e,...h]=a.splice(0,c+1+2),[j,o]=h.concat().reverse();h=h.slice(0,h.length-3);let p=t("arguments",parseExprBodies(h));p.outputType=j,p.name=d.val,b.push(p)}return b},parseSection=a=>{if(0!==a.length){let h,b=indexOf(a,o=>"close-curly"===o.type),c=-1===b?[]:a.splice(0,b+1),[d,...e]=c,j=()=>{let o=e.shift(),p=e.pop();if("open-curly"!==o.type)throw`Syntax, { expected`;if("close-curly"!==p.type)throw`Syntax, } expected`};if("key"!==d.type)throw`Syntax error with ${d.type}:${d.val}, expected a KEY`;return"Query"===d.val?(h=t("Query"),j(),h.children=parseExprBodies(e)):"Mutation"===d.val?(h=t("Mutation"),j(),h.children=parseMutExpr(e)):(h=t("Model",d.val),j(),h.children=parseExprBodies(e)),h}},parseProgram=a=>{let c,b=t("graphql",[]);for(;c=parseSection(a);)b.val.push(c);return b},parser=a=>parseProgram(a),parse=a=>parser(lexer(a)),config=(a,b)=>{const c=v=>{return"Int"===v?INT:"Float"===v?FLOAT:"Boolean"===v?BOOL:"String"===v?STRING:u[v]},d=(v,w)=>{switch(v){case"required":return new REQ(w);case"optional":return w;case"array-of":return new LIST(w);default:throw`Field type ${v} not recognized`;}},e=v=>-1==="Int|Float|Boolean|String".split("|").indexOf(v),h=(v,w)=>v.reduce((y,{type:z,val:A,name:B})=>{let C=c(A),D=d(z,C),E=e(A)?{type:D,resolve:b[w][B]}:{type:D};return _extends({},y,{[B]:E})},{}),j=({val:v,children:w})=>{let y=new OBJ({name:v,fields:h(w,v)});return u[v]=y,y};let o=a.val,p=o.filter(v=>"Query"===v.type),q=o.filter(v=>"Mutation"===v.type),u={};// key:val pairs of Models
if(1!==p.length)throw`Should only be 1 Query object with a Schema`;if(1!==q.length)throw`Should only be 1 Query object with a Schema`;return p=p[0],q=q[0],o=o.filter(v=>"Model"===v.type).map(v=>j(v)),new SCHEMA({query:(()=>{const{children:v}=p;let w=v.reduce((y,{type:z,val:A,name:B})=>_extends({},y,{[B]:{type:d(z,c(A)),resolve:b.Query[B]}}),{});return new OBJ({name:"queries",fields:()=>w})})(),mutation:(()=>{const{children:v}=q;let w=v.reduce((y,{val:z,outputType:{val:B},name:A})=>_extends({},y,{[A]:{type:c(B),args:z.reduce((C,{type:D,val:E,name:F})=>{return _extends({},C,{[F]:{type:d(D,c(E))}})},{}),resolve:b.Mutation[A]}}),{});return new OBJ({name:"mutations",fields:()=>w})})()})},init=(a,b)=>{let c=config(parse(a),b);return(d,e={})=>g(c,d,e)};// // https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form
// const BNF = `
// PROGRAM = SECTION | SECTION PROGRAM
// SECTION = MODEL | QUERY | MUTATION
// MODEL = KEY { EXPR-BODY }
// KEY = [a-z_0-9]
// EXPR-BODY = EXPR | EXPR EXPR-BODY
// EXPR = KEY : TYPE-EXPR
// TYPE-EXPR = [ TYPE ] | TYPE! | TYPE
// TYPE = Int | String | Boolean | Float | KEY
// QUERY = Query { EXPR-BODY }
// MUTATION = Mutation { MUT-EXPR }
// MUT-EXPR = KEY ( EXPR-BODY ) : TYPE
// `
/* harmony default export */ exports["default"] = init;

/***/ },

/***/ 0:
/***/ function(module, exports) {

module.exports = require("graphql");

/***/ },

/***/ 2:
/***/ function(module, exports, __webpack_require__) {

module.exports = __webpack_require__("./src/index.js");


/***/ }

/******/ });