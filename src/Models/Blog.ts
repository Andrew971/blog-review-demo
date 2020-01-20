import Collection from '../utils/dataStore'

const schema = {
  Key: {
    HashKey: 'Id',
    SortKey: 'Title'
  },
  Index: {
    Author_Index: {
      HashKey: 'Author',
      SortKey: 'Title'
    }
  },
  Item: {
    Id: 'S',
    Author: 'S',
    Body: 'S'
  }
}

export default new Collection('Blog', schema)
