import Collection, {IEvent} from '../utils/dataStore'
import Blog from './Blog'

const schema = {
  Key: {
    HashKey: 'BlogId',
    SortKey: 'Id'
  },
  Item: {
    Id: 'S',
    Author: 'S',
    Body: 'S',
    BlogId: 'S'
  }
}

async function streamEventHandler(event: IEvent) {
  
  if (event.eventName === 'INSERT') {
    const { OldImage, NewImage } = event.body
    // blog.update(param)
    // console.log('stream', event)
    const queryParam = {
      Where: {
        HashKey: NewImage.BlogId
      }
    }

    const queryResult = await Blog.query(queryParam)
    const blogItem = queryResult.Item[0]

    const params = {
      Key: {
        HashKey: blogItem.Id,
        SortKey: blogItem.Title
      },
      Item: {
        Replies: blogItem.Replies ? blogItem.Replies + 1 : 1
      }
    }

    const result = await Blog.update(params)
    return result
  }


}


export default new Collection('Comment', schema, {
  stream: streamEventHandler,
  batchSize: 1
})
