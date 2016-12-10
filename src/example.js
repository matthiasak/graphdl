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