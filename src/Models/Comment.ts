import Collection, {IEvent} from '../utils/dataStore'
import Blog from './Blog'

const schema = {
  Key: {
    HashKey: 'BlogPostId',
    SortKey: 'Id'
  },
  Index: {
    Id_Index: {
      HashKey: 'Id'
    }
  },
  Item: {
    Id: 'S',
    Author: 'S',
    Body: 'S',
    BlogPostId: 'S'
  }
}

function streamEventHandler(event: IEvent) {
  if (event.eventName === 'INSERT') {

    // blog.update(param)
    // console.log('stream', event)

  }

  // console.log('stream', event.eventName)

}


export default new Collection('Comment', schema, {
  stream: streamEventHandler,
  batchSize: 1
})
