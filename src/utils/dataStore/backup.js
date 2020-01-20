const EventEmitter = require('events')
const uuid = require('uuid/v4')
const CollectionEmitter = new EventEmitter()




class Collection {
  constructor(name = null, schemaDefinition, options = {}) {
    const defaults = {
      stream: null,
      batchSize: 1
    }
    const populated = Object.assign(defaults, options)
    this.name = name || `Collection-${Date.now}`
    this.stream = populated.stream || defaults.stream
    this.store = {}
    this.schema = schemaDefinition || null
    this.collectionKey = schemaDefinition.Key || null
    this.batchSize = populated.batchSize || defaults.batchSize
    // this.isSchemaProvided()
    this.initializeStore()
  }

  initializeStore() {
    const initializedStore = {
      default: new Map()
    }
    for (let IndexName of Object.keys(this.schema.Index)) {
      initializedStore[IndexName] = new Map()
    }
    this.store = initializedStore
  }

  // isSchemaProvided() {
  //   if (!this.schema) {
  //     console.log('no schema')
  //   }
  // }

  putItem(params) {

    try {
      validatePutParams(params)
      validateKeyCondition(params, this.collectionKey, this.store)
      const HashKey = params.Item[this.collectionKey.HashKey]

      if (!HashKey) {
        throw new Error('Missing Key')
      }
      const newInsert = Object.assign({
        UNIQUE_ID: uuid()
      }, params.Item)
      const oldImage = this.store.default.get(HashKey) || []
      const newImage = [
        ...oldImage,
        newInsert
      ]

      this.store.default.set(HashKey, newImage)

      const eventPayload = {
        OldImage: null,
        NewImage: newInsert
      }

      CollectionEmitter.emit(
        'insert',
        eventPayload,
        this.insertEventCallback.bind(this)
      )

      CollectionEmitter.emit(
        'streamInsert',
        eventPayload,
        this.stream
      )

      const response = {
        Item: [
          params.Item
        ]
      }

      return Promise.resolve(response)

    } catch (err) {

      return Promise.reject(err)
    }

  }

  update(params) {

    try {
      validateUpdateParams(params)
      const { Key, Item } = params

      if (Item[this.collectionKey.HashKey]) {
        delete Item[this.collectionKey.HashKey]
      }

      const data = this.store.default.get(Key.HashKey) || []

      const oldImage = JSON.parse(JSON.stringify(data))
      let newImage = JSON.parse(JSON.stringify(data))

      if (newImage.length > 0) {

        if (newImage.length > 1 && !Key.SortKey) {

          throw new Error('You must provide a sortKey. Non-unique HashKey are only Allowed when a sortKey is provided')

        }

        const itemIndex = Key.SortKey
          ? newImage.findIndex((item => item[this.collectionKey.SortKey] === Key.SortKey))
          : 0

        if (itemIndex < 0) {
          const newPutItem = {
            [this.collectionKey.HashKey]: Key.HashKey,
            ...Item
          }
          return this.putItem({
            Item: newPutItem
          })
            .then(result => Promise.resolve({
              Item: result.Item[0]
            }))
        }
        newImage[itemIndex] = Object.assign(newImage[itemIndex], Item)

        this.store.default.set(Key.HashKey, newImage)

        const eventPayload = {
          OldImage: oldImage[itemIndex],
          NewImage: newImage[itemIndex],
        }

        CollectionEmitter.emit(
          'update',
          eventPayload,
          this.updateEventCallback.bind(this)
        )

        CollectionEmitter.emit(
          'streamUpdate',
          eventPayload,
          this.stream
        )

        const response = {
          Item: newImage[itemIndex]
        }

        return Promise.resolve(response)
      } else {
        return Promise.reject('No item Found')
      }



    } catch (err) {
      return Promise.reject(err)
    }
  }

  query(params) {

    try {
      validateQueryParams(params)

      const IndexName = params.Index ? params.Index : 'default'

      const keyDefenition = params.Index
        ? this.schema.Index[IndexName]
        : this.collectionKey

      const { Where } = params

      const data = this.store[IndexName].get(Where.HashKey)

      if (!data) {
        return Promise.resolve({
          Item: []
        })
      }
      const result = JSON.parse(JSON.stringify(data))

      const filteredResult = Where.SortKey
        ? result.filter(item => item[keyDefenition.SortKey] === Where.SortKey)
        : result

      const response = {
        Item: filteredResult
      }

      return Promise.resolve(response)

    } catch (err) {
      return Promise.reject(err)
    }

  }

  delete(params) {

    try {
      validateDeleteParams(params)
      const { Where } = params

      const data = this.store.default.get(Where.HashKey)

      if (!data) {
        throw new Error(' Item Not Found ')
      }

      const result = JSON.parse(JSON.stringify(data))

      const filteredResult = Where.SortKey
        ? result.filter(item => item[this.collectionKey.SortKey] !== Where.SortKey)
        : []

      const deletedImage = Where.SortKey
        ? result.filter(item => item[this.collectionKey.SortKey] === Where.SortKey)
        : []

      let streamEventPayload = {}
      if (!this.collectionKey.SortKey || filteredResult.length === 0) {

        this.store.default.delete(Where.HashKey)
        streamEventPayload = {
          OldImage: result,
          NewImage: deletedImage,
        }

      } else {
        this.store.default.set(Where.HashKey, filteredResult)

        streamEventPayload = {
          OldImage: result,
          NewImage: filteredResult,
        }

      }

      let eventPayload = {
        OldImage: result,
        NewImage: null,
      }

      CollectionEmitter.emit(
        'remove',
        eventPayload,
        this.removeEventCallback.bind(this)
      )

      CollectionEmitter.emit(
        'streamRemove',
        streamEventPayload,
        this.batchSize,
        this.stream
      )

      const response = {
        Item: filteredResult
      }
      return Promise.resolve(response)

    } catch (err) {
      return Promise.reject(err)
    }
  }

  insertEventCallback(event) {
    const { NewImage = {} } = event.body
    try {
      if (!NewImage || Object.keys(NewImage).length === 0) {
        throw new Error('Invalid insert callback. Missing insert event payload')
      }
      for (let IndexName of Object.keys(this.schema.Index)) {
        const key = NewImage[this.schema.Index[IndexName].HashKey]
        const oldIndexImage = this.store[IndexName].get(key) || []


        this.store[IndexName].set(key, [
          ...oldIndexImage,
          NewImage
        ])
      }
      return 'insert event handled'
    } catch (err) {
      return err
    }

  }

  updateEventCallback(event) {

    const {
      NewImage = {},
      OldImage = {}
    } = event.body

    try {
      if (
        !NewImage ||
        isObjectEmpty(NewImage) ||
        !OldImage ||
        isObjectEmpty(OldImage)
      ) {
        throw new Error('Invalid update callBack. Missing update event payload')
      }

      for (let IndexName of Object.keys(this.schema.Index)) {
        const key = NewImage[this.schema.Index[IndexName].HashKey]
        const data = this.store[IndexName].get(key) || []
        let updatedImage = JSON.parse(JSON.stringify(data))

        const itemIndex = updatedImage.findIndex((item => item.UNIQUE_ID === NewImage.UNIQUE_ID))

        updatedImage[itemIndex] = Object.assign(updatedImage[itemIndex], NewImage)
        this.store[IndexName].set(key, updatedImage)
      }
      return 'update event handled'
    } catch (err) {
      return err
    }
  }

  removeEventCallback(event) {
    const isObjectEmpty = (object) => Object.keys(object).length === 0 && object.constructor === Object

    const {
      OldImage = {}
    } = event.body

    try {
      if (
        !OldImage ||
        isObjectEmpty(OldImage)
      ) {
        throw new Error('Invalid update callBack. Missing update event payload')
      }
      for (let image of OldImage) {
        for (let IndexName of Object.keys(this.schema.Index)) {
          const key = image[this.schema.Index[IndexName].HashKey]
          const data = this.store[IndexName].get(key) || []
          let updatedImage = JSON.parse(JSON.stringify(data))

          const filteredResult = updatedImage.filter(item => item.UNIQUE_ID !== image.UNIQUE_ID)

          if (filteredResult.length === 0) {
            this.store[IndexName].delete(key)
          } else {
            this.store[IndexName].set(key, filteredResult)
          }
        }
      }
      return 'delete event handled'
    } catch (err) {
      return err
    }
  }

}

CollectionEmitter.on('insert', (payload, callback) => {
  const insertEvent = {
    eventName: 'INSERT',
    body: payload,
    timeStamp: Date.now()
  }
  callback(insertEvent)
})

CollectionEmitter.on('streamInsert', (payload, callback) => {

  const insertEvent = {
    eventName: 'INSERT',
    body: payload,
    timeStamp: Date.now()
  }
  setImmediate(() => {
    callback(insertEvent)
  })

})

CollectionEmitter.on('update', (payload, callback) => {
  const updateEvent = {
    eventName: 'UPDATE',
    body: payload,
    timeStamp: Date.now()
  }
  callback(updateEvent)
})

CollectionEmitter.on('streamUpdate', (payload, callback) => {


  const updateEvent = {
    eventName: 'UPDATE',
    body: payload,
    timeStamp: Date.now()
  }
  setImmediate(() => {
    callback(updateEvent)
  })

})

CollectionEmitter.on('remove', (payload, callback) => {


  const removeEvent = {
    eventName: 'REMOVE',
    body: payload,
    timeStamp: Date.now()
  }
  callback(removeEvent)
})

CollectionEmitter.on('streamRemove', (payload, batchSize, callback) => {

  const removedItem = payload.OldImage
  const splitArrays = []
  const size = batchSize

  while (removedItem.length > 0) {
    splitArrays.push(removedItem.splice(0, size));
  }

  for (chunk of splitArrays) {
    const removeEvent = {
      eventName: 'REMOVE',
      body: {
        OldImage: chunk,
        NewImage: null
      },
      timeStamp: Date.now()
    }
    setImmediate(() => {
      callback(removeEvent)
    })
  }


})



function validatePutParams(param) {

  if (!param.Item || isObjectEmpty(param.Item)) {
    throw new Error('Invalid request. Must provide an Item')
  }

}

function validateUpdateParams(param) {

  if (!param.Key || !param.Key.HashKey || isObjectEmpty(param.Key)) {
    throw new Error('Invalid HashKey. Please provide a valid Key')
  }

  if (!param.Item || isObjectEmpty(param.Item)) {
    throw new Error('Invalid request. Must update at least one field')
  }

}

function validateQueryParams(param) {

  if (!param.Where || !param.Where.HashKey || isObjectEmpty(param.Where)) {
    throw new Error('Invalid Where keyword. Please provide a valid request')
  }

}

function validateDeleteParams(param) {

  if (!param.Where || !param.Where.HashKey || isObjectEmpty(param.Where)) {
    throw new Error('Invalid Where keyword. Please provide a valid request')
  }

}

function validateKeyCondition(params, collectionKey, store) {
  const HashKey = params.Item[collectionKey.HashKey]
  const SortKey = collectionKey.SortKey
    ? params.Item[collectionKey.SortKey]
    : null
  const doesKeyExist = store.default.has(HashKey)

  if (doesKeyExist && SortKey) {
    const data = store.default.get(HashKey)
    const doesSortKeyExist = collectionKey.SortKey
      ? data.findIndex(item => item[collectionKey.SortKey] === SortKey)
      : -1
    if (doesSortKeyExist >= 0) {
      throw new Error('Item already exist !')
    }

  } else if (doesKeyExist && !SortKey) {

    throw new Error('Item already exist !')
  }
}

function isObjectEmpty(object) {
  return Object.keys(object).length === 0 && object.constructor === Object
}

export default Collection