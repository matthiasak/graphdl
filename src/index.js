import * as graphql from 'graphql'
const {
    // These are the basic GraphQL types
    GraphQLInt:INT
    , GraphQLFloat:FLOAT
    , GraphQLString:STRING
    , GraphQLList:LIST
    , GraphQLObjectType:OBJ
    , GraphQLEnumType:ENUM
    , GraphQLBoolean:BOOL

    // This is used to create required fields and arguments
    , GraphQLNonNull:REQ

    // This is the class we need to create the schema
    , GraphQLSchema:SCHEMA
    , graphql: g
} = graphql

// // https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form
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

const
	PARTS = {
        KEY : "\\w+"
        , CURL0 : "{"
        , CURL1 : "}"
        , SQ0 : "\\["
        , SQ1 : "\\]"
    	, P0 :  "\\("
    	, P1 :  "\\)"
    	, EXCL: "\\!"
        , COLON : ":"
    }
	// , COMMENT = "(#.*(?=\\n*))"
	, ALL = Object.keys(PARTS).map(k => PARTS[k])
	, ANY = new RegExp(`${ALL.join('|')}`,`ig`)
	, r = s => new RegExp(s, 'ig')
	, t = (type,val) => ({type, val})
    , m = (str, regex) => str.match(r(regex))

const lexer = s =>
	s
    .match(ANY)
	.map(x => {
        if(m(x, PARTS.KEY)) return t('key',x)
		if(m(x, PARTS.CURL0)) return t('open-curly', x)
        if(m(x, PARTS.CURL1)) return t('close-curly', x)
        if(m(x, PARTS.SQ0)) return t('open-sq', x)
        if(m(x, PARTS.SQ1)) return t('close-sq', x)
        if(m(x, PARTS.P0)) return t('open-paren', x)
        if(m(x, PARTS.P1)) return t('close-paren', x)
        if(m(x, PARTS.COLON)) return t('colon', x)
        if(m(x, PARTS.EXCL)) return t('excl', x)
		throw `Token not identified: ${x}`
    })

const indexOf = (arr,fn) => {
    for(var i = 0, len = arr.length; i < len; i++)
        if(fn(arr[i], i)) return i

    return -1
}

const parseType = tokens => {
    let n = tokens.shift()

    if(n.type === 'key') {
        let peek = tokens[0]
        	, required = peek && (peek.type === 'excl') && tokens.shift()
        	, r = required ? t('required') : t('optional')

        r.val = n.val
        return r
    } else if (n.type === 'open-sq') {
        let n1 = tokens.shift()
        	, n2 = tokens.shift()

        if(n2.type !== 'close-sq')
            throw new Error(`Syntax error: ${n.type}_${n.val}`)

        return t('array-of', n1.val)
    }
    throw new Error(`Syntax error: ${n.type}_${n.val}`)
}

const parseExprBodies = tokens => {
    let result = []
    while(tokens.length > 0){
        let key = tokens.shift()
        	, colon = tokens.shift()
        	, type = parseType(tokens)
        type.name = key.val
        result.push(type)
    }
    return result
}

const parseMutExpr = tokens => {
    let result = []
    while(tokens.length > 0){
        let p1 = indexOf(tokens, x => x.type === 'close-paren')
        if(p1 === -1) throw "Closing ) not found in mutation"

        let [first, p0, ...rest] = tokens.splice(0,p1+1+2)
        	, [type, colon] = rest.concat().reverse()

        rest = rest.slice(0,rest.length-3)

        let mutation = t('arguments', parseExprBodies(rest))
        mutation.outputType = type
        mutation.name = first.val
        result.push(mutation)
    }
    return result
}

const parseSection = tokens => {
    if(tokens.length === 0) return

    let indexOfClose = indexOf(tokens, x => x.type === 'close-curly')
    	, slice = indexOfClose !== -1 ? tokens.splice(0, indexOfClose+1) : []
		, [first, ...rest] = slice
    	, AST
        , checkForBrackets = () => {
            let f = rest.shift()
                , l = rest.pop()

            if(f.type !== 'open-curly') throw `Syntax, { expected`
            if(l.type !== 'close-curly') throw `Syntax, } expected`
        }

    if(first.type !== 'key') throw `Syntax error with ${first.type}:${first.val}, expected a KEY`

    if(first.val === 'Query') {
        AST = t('Query')
        checkForBrackets()
        AST.children = parseExprBodies(rest)
    } else if(first.val === 'Mutation') {
        AST = t('Mutation')
        checkForBrackets()
        AST.children = parseMutExpr(rest)
    } else {
        AST = t('Model', first.val)
        checkForBrackets()
        AST.children = parseExprBodies(rest)
    }

    return AST
}

const parseProgram = (tokens) => {
    let AST =  t('graphql', [])
    	, section

    while((section = parseSection(tokens))){
        AST.val.push(section)
    }

    return AST
}

const parser = tokens => parseProgram(tokens)

const parse = str => parser(lexer(str))

const config = (AST, resolvers) => {

    const GQLType = (t) => {
        switch(t){
            case 'Int':
                return INT
            case 'Float':
                return FLOAT
            case 'Boolean':
                return BOOL
            case 'String':
                return STRING
            default:
                return map[t]
        }
    }

    const GQLMod = (type, scalar) => {
        switch(type){
            case 'required':
                return new REQ(scalar)
            case 'optional':
                return scalar
            case 'array-of':
                return new LIST(scalar)
            default: throw `Field type ${type} not recognized`
        }
    }

    const GQLTypeNeedsResolver = type =>
    	'Int|Float|Boolean|String'.split('|').indexOf(type) === -1

    const createFields = (children, modelName) =>
        children.reduce((acc, {type, val, name}) => {
            let scalar = GQLType(val)
                , t = GQLMod(type, scalar)
            	, typeDescr = GQLTypeNeedsResolver(val)
            		? {type: t, resolve: resolvers[modelName][name]}
                	: {type: t}

            return {...acc, [name]: typeDescr}
        }, {})

    const createModel = ({val:name, children}) => {
        let m = new OBJ({
            name,
            fields: createFields(children, name)
        })
        map[name] = m
        return m
    }

    const createQuery = () => {
        const {children} = query
        let f = children.reduce((acc, {type, val, name}) => ({
            ...acc
            , [name]: {
                type: GQLMod(type, GQLType(val))
                , resolve: resolvers["Query"][name]
            }
        }), {})

        return new OBJ({
            name: 'queries'
            , fields: () => f
        })
    }

    const createMutation = () => {
        const {children} = mutation
        let f = children.reduce((acc, {val:args, outputType:{val:out}, name}) => ({
            ...acc
            , [name]: {
                type: GQLType(out)
                , args: args.reduce((acc,{type,val,name}) => {
                    return {
                        ...acc
                        , [name]: {type: GQLMod(type, GQLType(val))}
                    }
                }, {})
        		, resolve: resolvers["Mutation"][name]
            }
        }), {})

        return new OBJ({
            name: 'mutations'
            , fields: () => f
        })
    }

    let models = AST.val
    	, query = models.filter(x => x.type === 'Query')
    	, mutation = models.filter(x => x.type === 'Mutation')
    	, map = {} // key:val pairs of Models

    if(query.length !== 1) throw `Should only be 1 Query object with a Schema`
    if(mutation.length !== 1) throw `Should only be 1 Query object with a Schema`

    query = query[0]
    mutation = mutation[0]
    models = models
        .filter(x => x.type === 'Model')
        .map(x => createModel(x))

    return new SCHEMA({
        query: createQuery()
        , mutation: createMutation()
    })
}

const init = (str, resolvers) => {
	let schema = config(parse(str), resolvers)
	return (query, params={}) => g(schema, query, params)
}
export default init