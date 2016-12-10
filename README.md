# GraphDL

Graph Description Language is a GraphQL Schema Definition Language / syntax that enables terse GraphQL Schema creation with far fewer lines of code.

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
