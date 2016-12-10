# GraphDL

Graph Description Language is a GraphQL Schema Definition Language / syntax that enables terse GraphQL Schema creation with far fewer lines of code.

## What? Why?

GraphQL is a pretty cool piece of tech that allows application clients (browsers, native apps, etc) to query for data from a server without making multiple RESTful requests. Imagine querying a GitHub user, all her/his projects, and each of those projects contributors from the GitHub API. If I were pulling my GitHub information (username `@matthiasak`), I would make these requests:

- https://api.github.com/users/matthiasak -> grab `repos_url` and request it, too
- https://api.github.com/users/matthiasak/repos -> for each of these (potentially hundreds of items), grab each `contributors_url`
- i.e. https://api.github.com/repos/matthiasak/3D-svg-model-viewer/contributors -> grabs list of contributors

The data being requested then, by you poor programmer, must be "stitched" back together into a usable data structure after waiting potentially 30 seconds for all your data to be requested:

The architecture of all the data you requested:

```
+---------------------------+
|                           |
|     users/matthiasak      +-----------------+
|                           |                 |
+---------------------------+                 |
                                              |
                                              |
                                     +--------v-------+
                                     |                |
                                     |                |
                                     |matthiasak/repos|
                                     |                |
                                     |                |
                                    ++------+-+-+-----+
                                    |       | | |     |
                                    |       | | |     |
                                    |       | | |     |
                                    |       | | |     |
                                    |       | | |     |
                                    |       | | |     |
+----------------+<-----------------+       v v v     +------------->+----------------------+
|                |                      +---+-+-+---+                |                      |
|      repo1     |                      |    ...    |                |      repoN           |
+----+-----------+                      +---+--+--+-+                +-------+--------------+
     |                                      |  |  |                          |
     |                                      |  |  |                          |
     |                                      |  |  |                          |
+----v-----------+                      +---v--v--v------+           +-------v--------+
|                |                      |                |           |                |
|  contributors  |                      |  contributors  |           |  contributors  |
+----------------+                      +----------------+           +----------------+
```

For every user there's 2 requests, for each repo there's 2 requests, so for a user with 30 repos that means we're looking at 2 + 30*2 = 62 JSON requests just for this data (barring some special `&include=...` features of some RESTful APIs).

With GraphQL, we make only one request, instead, *and* we can configure exactly what fields of each record we need:

```graphql
# graphql query
query getContributorGraph($user: String) {
	user(username: $user){
		username
		repos(limit: 100){
			contributors {
				username
			}
		}
	}
}
```

The problem - ah yes, there is one dear reader - is that defining the GraphQL *server* is a bunch of boilerplate:
<details>
<summary>Unroll for awful boilerplate</summary>
```js
const Author = new GraphQLObjectType({
	name: "Author"
	, fields: () => ({
		_id: {type: new GraphQLNonNull(GraphQLString)}
		, name: {type:GraphQLString}
		, posts: {
			type: new GraphQLList(Post)
			, resolve: author =>
				PostsList.filter(p => p.author === author._id)
		}
		, numPosts: {
			type: GraphQLInt
			, resolve: author =>
				PostsList.filter(p => p.author === author._id).length
		}
	})
})

const Post = new GraphQLObjectType({
	name: "Post"
	, fields: () => ({
		_id: {type: new GraphQLNonNull(GraphQLString)}
		, title: {
			type: new GraphQLNonNull(GraphQLString)
			, resolve: post => post.title || "Does not exist"
		}
		, content: {type: new GraphQLNonNull(GraphQLString)}
		, author: {
			type: Author
			, resolve: post =>
				AuthorsList.filter(a => a._id === post.author).shift()
		}
	})
})

const mutation = new GraphQLObjectType({
	name: "Mutations"
	, fields: () => ({
		createPost: {
			type: Post
			, args: {
				title: {type: new GraphQLNonNull(GraphQLString)}
				, content: {type: new GraphQLNonNull(GraphQLString)}
			}
			, resolve: (source, {title, content}) => {
				let post = {
					_id: `${Date.now()}::${Math.ceil(Math.random() * 9999999)}`
					, title
					, content
				}
				PostsList.push(post)
				return post
			}
		}
	})
})

// This is the Root Query
const query = new GraphQLObjectType({
    name: 'BlogSchema',
    fields: () => ({
        echo: {
            type: GraphQLString
            , args: {
                message: {
                	type: GraphQLString
                }
            }
            , resolve: (source, { message }) => `Echo: ${message}`
        }
        , posts: {
        	type: new GraphQLList(Post)
        	, resolve: () => PostsList
        }
        , authors: {
        	type: new GraphQLList(Author)
        	, resolve: () => AuthorsList
        }
    })
})

// The Schema
const Schema = new GraphQLSchema({ query, mutation })

export default Schema
```
</details>

<details>
<summary>Instead of doing that, I tried my hand at creating a language to specify all that mess:</summary>
```js
import gqlSchema from './index'

const schema = `

Author {
    id: Int!
    firstName: String
    lastName: String
	votes: Int
}

Post {
    id: Int!
    title: String
    votes: Int
	author: Author
}

Query {
	authors: [Author]
    posts: [Post]
}

Mutation {
    upvotePost(postId: Int!): Post
    updateAuthor(authorId: Int!): Author
    addPost(title:String votes:Int author:Int): Post
    addAuthor(firstName:String lastName:String votes:Int): Author
}

`

let queries = [
`
mutation {
	newAuthor: addAuthor(
		firstName:"Matt"
		lastName:"K"
		votes:1
    ){
		id, firstName, lastName, votes
    }
}
`,
`
mutation {
	newPost: addPost(title:"test", votes:0, author:0){
		id,
		title,
		votes,
		author {
			id, firstName, lastName, votes
        }
	}
}
`,
`
{
	authors { id firstName lastName votes  }
	posts { id title votes }
}
`
]


let posts = []
	, authors = []

const resolvers = {
    Query: {
        posts: () => posts
        , authors: () => authors
    }
    , Mutation: {
        upvotePost: (_, {postId}) => {
            const p = posts.filter(x => postId === x.id)
            if(!p) throw `Couldn't find post with id ${postId}`
            p.votes += 1
            return p
        }
        , upvoteAuthor: (_, {authorId}) => {
            const a = authors.filter(x => authorId === x.id)
            if(!a) throw `Couldn't find author with id ${authorId}`
            a.votes++
            return a
        }
        , addPost: (_, {title, votes, author}) => {
            let p ={
                id: posts.length
                , title
                , votes
                , author
            }
            posts.push(p)
            return p
        }
        , addAuthor: (_, {firstName, lastName, votes}) => {
            let a = {
                id: authors.length
                , firstName
                , lastName
                , votes
            }
            authors.push(a)
            return a
        }
    }
    , Post: {
        author: post =>
        	authors
        	.filter(x => x.id === post.author)
        	.shift()
    }
}

let s = gqlSchema(schema, resolvers)

const log = (a) => console.log(JSON.stringify(a, null, 2))

queries.reduce((acc,q) =>
	acc.then(() => s(q).then(log))
	, Promise.resolve(true))
```
</details>

Hopefully this proves as useful to you as it does to me. :-)

---

[![NPM](https://nodei.co/npm/graphdl.png)](https://nodei.co/npm/graphdl/)
[![Build Status](https://travis-ci.org/matthiasak/graphdl.svg?branch=master)](https://travis-ci.org/matthiasak/graphdl)

## Usage

```sh
yarn add graphdl
# or
npm install --save graphdl
```

## Try It Out!

Check out the code from [example.js](./src/example.js):

```js
import gqlSchema from 'graphql'

const schema = `

Author {
    id: Int!
    firstName: String
    lastName: String
	votes: Int
}

Post {
    id: Int!
    title: String
    votes: Int
	author: Author
}

Query {
	authors: [Author]
    posts: [Post]
}

Mutation {
    upvotePost(postId: Int!): Post
    updateAuthor(authorId: Int!): Author
    addPost(title:String votes:Int author:Int): Post
    addAuthor(firstName:String lastName:String votes:Int): Author
}

`

let queries = [
`
mutation {
	newAuthor: addAuthor(
		firstName:"Matt"
		lastName:"K"
		votes:1
    ){
		id, firstName, lastName, votes
    }
}
`,
`
mutation {
	newPost: addPost(title:"test", votes:0, author:0){
		id,
		title,
		votes,
		author {
			id, firstName, lastName, votes
        }
	}
}
`,
`
{
	authors { id firstName lastName votes  }
	posts { id title votes }
}
`
]


let posts = []
	, authors = []

const resolvers = {
    Query: {
        posts: () => posts
        , authors: () => authors
    }
    , Mutation: {
        upvotePost: (_, {postId}) => {
            const p = posts.filter(x => postId === x.id)
            if(!p) throw `Couldn't find post with id ${postId}`
            p.votes += 1
            return p
        }
        , upvoteAuthor: (_, {authorId}) => {
            const a = authors.filter(x => authorId === x.id)
            if(!a) throw `Couldn't find author with id ${authorId}`
            a.votes++
            return a
        }
        , addPost: (_, {title, votes, author}) => {
            let p ={
                id: posts.length
                , title
                , votes
                , author
            }
            posts.push(p)
            return p
        }
        , addAuthor: (_, {firstName, lastName, votes}) => {
            let a = {
                id: authors.length
                , firstName
                , lastName
                , votes
            }
            authors.push(a)
            return a
        }
    }
    , Post: {
        author: post =>
        	authors
        	.filter(x => x.id === post.author)
        	.shift()
    }
}

let s = gqlSchema(schema, resolvers)

const log = (a) => console.log(JSON.stringify(a, null, 2))

queries.reduce((acc,q) =>
	acc.then(() => s(q).then(log))
	, Promise.resolve(true))
```

## Caught a bug?

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Install the dependencies: `yarn`
3. Bundle the source code and watch for changes: `npm start`

After that, you'll find the code in the `./build` folder!

## Authors

- Matthew Keas, [@matthiasak](https://twitter.com/@matthiasak). Need help / support? Create an issue or ping on Twitter.
