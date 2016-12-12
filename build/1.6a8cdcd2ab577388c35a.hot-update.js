exports.id = 1;
exports.modules = {

/***/ "./src/index.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_graphql__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_graphql___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_graphql__);
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };


const {
    // These are the basic GraphQL types
    GraphQLInt: INT,
    GraphQLFloat: FLOAT,
    GraphQLString: STRING,
    GraphQLList: LIST,
    GraphQLObjectType: OBJ,
    GraphQLEnumType: ENUM,
    GraphQLBoolean: BOOL

    // This is used to create required fields and arguments
    , GraphQLNonNull: REQ

    // This is the class we need to create the schema
    , GraphQLSchema: SCHEMA,
    graphql: g
} = __WEBPACK_IMPORTED_MODULE_0_graphql__;

/*
BNF
PROGRAM = OBJECTQUERY | OBJECTQUERY PROGRAM
OBJECTQUERY = NAME { FIELDLIST }
FIELDLIST = FIELD | FIELD FIELDLIST
FIELD = NAME ( ARGLIST ) : TYPE
ARGLIST = NAME : TYPE | NAME : TYPE ARGLIST
TYPE = Int | Float | String | Enum | Boolean | NAME REQUIREDFLAG
REQUIREDFLAG = ? | ''
*/

const PARTS = {
    KEY: "\\w+",
    CURL0: "{",
    CURL1: "}",
    SQ0: "\\[",
    SQ1: "\\]",
    P0: "\\(",
    P1: "\\)",
    EXCL: "\\!",
    COLON: ":"
},
      COMMENT = /#.*$/igm,
      ALL = Object.keys(PARTS).map(k => PARTS[k]),
      ANY = new RegExp(`${ ALL.join('|') }`, `ig`),
      r = s => new RegExp(s, 'ig'),
      t = (type, val) => {
    let r = { type };
    if (val !== undefined) r = _extends({}, r, { val });
    return r;
},
      m = (str, regex) => str.match(r(regex));

const lexer = s => s.replace(COMMENT, '').match(ANY).map(x => {
    if (m(x, PARTS.KEY)) return t('key', x);
    if (m(x, PARTS.CURL0)) return t('open-curly', x);
    if (m(x, PARTS.CURL1)) return t('close-curly', x);
    if (m(x, PARTS.SQ0)) return t('open-sq', x);
    if (m(x, PARTS.SQ1)) return t('close-sq', x);
    if (m(x, PARTS.P0)) return t('open-paren', x);
    if (m(x, PARTS.P1)) return t('close-paren', x);
    if (m(x, PARTS.COLON)) return t('colon', x);
    if (m(x, PARTS.EXCL)) return t('excl', x);
    throw `Token not identified: ${ x }`;
});

const indexOf = (arr, fn) => {
    for (var i = 0, len = arr.length; i < len; i++) if (fn(arr[i], i)) return i;

    return -1;
};

const parseType = tokens => {
    let n = tokens.shift();

    if (n.type === 'key') {
        let peek = tokens[0],
            required = peek && peek.type === 'excl' && tokens.shift(),
            r = required ? t('required') : t('optional');

        r.val = n.val;
        return r;
    } else if (n.type === 'open-sq') {
        let n1 = tokens.shift(),
            n2 = tokens.shift();

        if (n2.type !== 'close-sq') throw new Error(`Syntax error: ${ n.type }_${ n.val } -- from ${ pretty(tokens) }`);

        return t('array-of', n1.val);
    }
    throw new Error(`Syntax error: ${ n.type }_${ n.val } -- from ${ pretty(tokens) }`);
};

const parseExpressions = tokens => {
    let result = [];
    while (tokens.length > 0) {
        let key = tokens.shift(),
            colon = tokens.shift(),
            type = parseType(tokens);

        if (!is('colon')(colon)) throw `Colon expected in ${ pretty(tokens) }`;
        if (!is('key')(key)) throw `NAME expected in ${ pretty(tokens) }`;

        type.name = key.val;
        result.push(type);
    }
    return result;
};

const pretty = a => a.map(x => x.val).join(' ');
const p = a => JSON.stringify(a, null, '  ');

const is = t => x => x.type === t;

const parseArgs = tokens => {
    let p0 = indexOf(tokens, is('open-paren')),
        p1 = indexOf(tokens, is('close-paren'));
    if (p0 === -1 && p1 !== -1 || p0 !== -1 && p1 === -1) throw `Unmatched parentheses in ${ pretty(tokens) }`;
    if (p0 === -1 && p1 === -1) return null;
    let [p0_match, ...rest] = tokens.splice(0, p1 + 1);
    rest.pop(); // remove closing paren
    return parseExpressions(rest);
};

const parseField = tokens => {
    let name = tokens.shift();
    if (!is('key')(name)) throw `NAME expected at ${ pretty(tokens) }`;
    let AST = t('field');
    AST.name = name.val;
    let args = parseArgs(tokens);
    if (args) AST.args = args;
    if (!is('colon')(tokens.shift())) throw `Colon : expected in ${ pretty(tokens) }`;
    AST.outputType = parseType(tokens);
    return AST;
};

const parseSection = tokens => {
    if (tokens.length === 0) return;

    let indexOfClose = indexOf(tokens, is('close-curly')),
        slice = indexOfClose !== -1 ? tokens.splice(0, indexOfClose + 1) : [],
        [first, ...rest] = slice,
        AST,
        checkForBrackets = () => {
        let f = rest.shift(),
            l = rest.pop();

        if (f.type !== 'open-curly') throw `Syntax, { expected`;
        if (l.type !== 'close-curly') throw `Syntax, } expected`;
    };

    if (first.type !== 'key') throw `Syntax error with ${ first.type }:${ first.val }, expected a KEY; ${ pretty(tokens) }`;

    AST = t('OBJECT', first.val);
    checkForBrackets();

    let fields = [];
    while (rest.length > 0) {
        fields.push(parseField(rest));
    }

    AST.fields = fields;
    return AST;
};

const parseProgram = tokens => {
    let AST = t('SCHEMA'),
        section;
    AST.children = [];
    while (section = parseSection(tokens)) AST.children.push(section);
    return AST;
};

const parser = tokens => parseProgram(tokens);

const parse = str => parser(lexer(str));

const groupBy = (arr, fn) => arr.reduce((acc, v, i, arr) => {
    let key = fn(v, i);
    if (!acc[key]) return _extends({}, acc, { [key]: [v] });
    return _extends({}, acc, { [key]: [...acc[key], v] });
}, {});

const config = (AST, resolvers) => {

    const GQLType = t => {
        switch (t) {
            case 'Int':
                return INT;
            case 'Float':
                return FLOAT;
            case 'Boolean':
                return BOOL;
            case 'String':
                return STRING;
            default:
                return map[t];
        }
    };

    const GQLMod = (type, scalar) => {
        switch (type) {
            case 'required':
                return new REQ(scalar);
            case 'optional':
                return scalar;
            case 'array-of':
                return new LIST(scalar);
            default:
                throw `Field type ${ type } not recognized`;
        }
    };

    const createObjectType = ({ val, fields }) => {
        let f = fields.reduce((acc, { args, outputType, name }) => {
            let { val: out, type: outtype } = outputType;
            let r = { type: GQLMod(outtype, GQLType(out)) };

            if (args) r.args = args.reduce((acc, { type, val, name }) => {
                return _extends({}, acc, { [name]: { type: GQLMod(type, GQLType(val)) }
                });
            }, {});

            if (resolvers[val] && resolvers[val][name]) r.resolve = resolvers[val][name];

            return _extends({}, acc, { [name]: r });
        }, {});

        return map[val] = new OBJ({
            name: val,
            fields: () => f
        });
    };

    let map = {},
        { query, mutation, model: objs } = groupBy(AST.children, x => x.val === 'Query' ? 'query' : x.val === 'Mutation' ? 'mutation' : 'model');

    if (query.length !== 1) throw `There needs to be 1 Query object definition within your Schema.`;
    if (mutation.length > 1) throw `There can only be 1 Mutation object definition.`;

    objs = objs.map(x => createObjectType(x));
    query = createObjectType(query.shift());
    mutation = mutation.length ? createObjectType(mutation.shift()) : null;

    return new SCHEMA({ query, mutation });
};

const init = (str, resolvers) => {
    let schema = config(parse(str), resolvers);
    return (query, params = {}) => g(schema, query, params);
};
/* harmony default export */ exports["default"] = init;

/***/ }

};