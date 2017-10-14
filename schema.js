const fetch = require('node-fetch')
const util = require('util')
const parseXML = util.promisify(require('xml2js').parseString)

const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLInt,
    GraphQLString,
    GraphQLList
  } = require('graphql')


const BookType = new GraphQLObjectType({
    name: 'Book',
    description: '...',
  
    fields: () => ({
      title: {
        type: GraphQLString,
        args: {
          lang: { type: GraphQLString }
        },
        resolve: (xml, args) => {
          const title = xml.GoodreadsResponse.book[0].title[0]
          return title
          //return args.lang ? translate(args.lang, title) : title
        }
      },
      isbn: {
        type: GraphQLString,
        resolve: xml => xml.GoodreadsResponse.book[0].isbn[0]
      },
      authors: {
        type: new GraphQLList(AuthorType),
        resolve: (xml, args, context) => {
          const authorElements = xml.GoodreadsResponse.book[0].authors[0].author
          const ids = authorElements.map(elem => elem.id[0])
          return context.authorLoader.loadMany(ids)
        }
      }
    })
  })
  
  const AuthorType = new GraphQLObjectType({
    name: 'Author',
    description: '...',
  
    fields: () => ({
      name: {
        type: GraphQLString,
        resolve: xml =>
          xml.GoodreadsResponse.author[0].name[0]
      },
      books: {
        type: new GraphQLList(BookType),
        resolve: (xml, args, context) => {
          const ids = xml.GoodreadsResponse.author[0].books[0].book.map(elem => elem.id[0]._)
          return context.bookLoader.loadMany(ids)
        }
      }
    })
  })
  

  module.exports = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      description: '...',  
      fields: () => ({
        author: {
          type: AuthorType,
          args: {
            id: { type: GraphQLInt }
          },      
          resolve: (root, args, context) => 
            fetch(`https://www.goodreads.com/author/show.xml?id=${args.id}&key=PLLctUbSIRJGsVLi7sIcg`)
          .then(response => response.text())
          .then(parseXML)
        }
      })
    })
  })