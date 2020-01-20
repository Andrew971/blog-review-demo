import EventEmitter from 'events'
import uuid from 'uuid/v4'
const CollectionEmitter = new EventEmitter()

export interface IEvent {
  eventName: string
  body: any
  timeStamp: number
}

interface IStore {
  [key: string]: Map<string, any>
}

interface IOption {
  stream: (event: IEvent) => void
  batchSize: number
}
interface IItem {
  [key: string]: string | number
}
interface IKey {
  [key: string]: string | number
}

interface IPutItem {
  Item: IItem
}

interface IQuery {
  Index?: string
  Where: {
    HashKey: string | number
    SortKey?: string | number
  }
}

interface ICollectionKey {
  HashKey: string | number
  SortKey?: string | number
}

interface IDelete {
  Index?: string
  Where: {
    HashKey: string | number
    SortKey?: string | number
  }
}

interface IUpdate {
  Key: IKey
  Item: IItem
}

interface IResult {
  Item: IItem[]
}
enum DataType {
  'S',
  'N'
}
type IDataType = keyof typeof DataType;

interface ISchema {
  Key: {
    HashKey: string | number
    SortKey?: string | number
  }
  Index: {
    [key: string]: {
      HashKey: string | number
      SortKey?: string | number
    }
  }
  Item: {
    [key: string]: string
  }
}

class Collection {
  public name: string
  public store: IStore
  public stream: any | null
  public schema: ISchema | null
  public collectionKey: ICollectionKey | null
  public batchSize: number

  constructor(
    name: string | null = null,
    schemaDefinition: ISchema,
    options: IOption | null = null
  ) {
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
    this.initializeStore()
  }

  private initializeStore() {
    const initializedStore: IStore = {
      default: new Map()
    }
    for (const IndexName of Object.keys(this.schema!.Index)) {
      initializedStore[IndexName] = new Map()
    }
    this.store = initializedStore
  }

  public putItem(params: IPutItem) {

    try {
      validatePutParams(params)
      validateKeyCondition(params, this.collectionKey!, this.store)
      const HashKey: string = `${params.Item[this.collectionKey!.HashKey]}`

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

      if (this.stream) {
        CollectionEmitter.emit(
          'streamInsert',
          eventPayload,
          this.stream
        )
      }

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

  public update(params: IUpdate) {

    try {
      validateUpdateParams(params)
      const { Key, Item } = params

      if (Item[this.collectionKey!.HashKey]) {
        delete Item[this.collectionKey!.HashKey]
      }

      const data = this.store.default.get(`${Key.HashKey}`) || []

      const oldImage = JSON.parse(JSON.stringify(data))
      const newImage = JSON.parse(JSON.stringify(data))

      if (newImage.length > 0) {

        if (newImage.length > 1 && !Key.SortKey) {

          throw new Error('You must provide a sortKey. Non-unique HashKey are only Allowed when a sortKey is provided')

        }

        const itemIndex = Key.SortKey
          ? newImage.findIndex((item: IItem) => item[this.collectionKey!.SortKey!] === Key.SortKey)
          : 0

        if (itemIndex < 0) {
          const newPutItem = {
            [this.collectionKey!.HashKey]: Key.HashKey,
            ...Item
          }
          return this.putItem({
            Item: newPutItem
          })
            .then((result: IResult) => Promise.resolve({
              Item: result.Item[0]
            }))
        }
        newImage[itemIndex] = Object.assign(newImage[itemIndex], Item)

        this.store.default.set(`${Key.HashKey}`, newImage)

        const eventPayload = {
          OldImage: oldImage[itemIndex],
          NewImage: newImage[itemIndex]
        }

        CollectionEmitter.emit(
          'update',
          eventPayload,
          this.updateEventCallback.bind(this)
        )

        if (this.stream) {
          CollectionEmitter.emit(
            'streamUpdate',
            eventPayload,
            this.stream
          )
        }

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

  public query(params: IQuery) {

    try {
      validateQueryParams(params)

      const IndexName = params.Index ? params.Index : 'default'

      const keyDefenition = params.Index
        ? this.schema!.Index[IndexName]
        : this.collectionKey

      const { Where } = params

      const data = this.store[IndexName].get(`${Where.HashKey}`)

      if (!data) {
        return Promise.resolve({
          Item: []
        })
      }
      const result = JSON.parse(JSON.stringify(data))

      const filteredResult = Where.SortKey
        ? result.filter((item: IItem) => item[keyDefenition!.SortKey!] === Where.SortKey)
        : result

      const response = {
        Item: filteredResult
      }

      return Promise.resolve(response)

    } catch (err) {
      return Promise.reject(err)
    }

  }

  public delete(params: IDelete) {

    try {
      validateDeleteParams(params)
      const { Where } = params

      const data = this.store.default.get(`${Where.HashKey}`)

      if (!data) {
        throw new Error(' Item Not Found ')
      }

      const result = JSON.parse(JSON.stringify(data))

      const filteredResult = Where.SortKey
        ? result.filter((item: IItem) => item[this.collectionKey!.SortKey!] !== Where.SortKey)
        : []

      const deletedImage = Where.SortKey
        ? result.filter((item: IItem) => item[this.collectionKey!.SortKey!] === Where.SortKey)
        : []

      let streamEventPayload = {}
      if (!this.collectionKey!.SortKey || filteredResult.length === 0) {

        this.store.default.delete(`${Where.HashKey}`)
        streamEventPayload = {
          OldImage: result,
          NewImage: deletedImage
        }

      } else {
        this.store.default.set(`${Where.HashKey}`, filteredResult)

        streamEventPayload = {
          OldImage: result,
          NewImage: filteredResult
        }

      }

      const eventPayload = {
        OldImage: result,
        NewImage: null
      }

      CollectionEmitter.emit(
        'remove',
        eventPayload,
        this.removeEventCallback.bind(this)
      )

      if (this.stream) {
        CollectionEmitter.emit(
          'streamRemove',
          streamEventPayload,
          this.batchSize,
          this.stream
        )
      }

      const response = {
        Item: filteredResult
      }
      return Promise.resolve(response)

    } catch (err) {
      return Promise.reject(err)
    }
  }

  public insertEventCallback = (event: IEvent) => {

    const { NewImage = {} } = event.body
    try {
      if (!NewImage || Object.keys(NewImage).length === 0) {
        throw new Error('Invalid insert callback. Missing insert event payload')
      }
      for (const IndexName of Object.keys(this.schema!.Index)) {
        const key = NewImage[this.schema!.Index[IndexName].HashKey]
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

  public updateEventCallback(event: IEvent) {

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

      for (const IndexName of Object.keys(this.schema!.Index)) {
        const key = NewImage[this.schema!.Index[IndexName].HashKey]
        const data = this.store[IndexName].get(key) || []
        const updatedImage = JSON.parse(JSON.stringify(data))

        const itemIndex = updatedImage.findIndex((item: IItem) => item.UNIQUE_ID === NewImage.UNIQUE_ID)

        updatedImage[itemIndex] = Object.assign(updatedImage[itemIndex], NewImage)
        this.store[IndexName].set(key, updatedImage)
      }
      return 'update event handled'
    } catch (err) {
      return err
    }
  }

  public removeEventCallback(event: IEvent) {

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
      for (const image of OldImage) {
        for (const IndexName of Object.keys(this.schema!.Index)) {
          const key = image[this.schema!.Index[IndexName].HashKey]
          const data = this.store[IndexName].get(key) || []
          const updatedImage = JSON.parse(JSON.stringify(data))

          const filteredResult = updatedImage.filter((item: IItem) => item.UNIQUE_ID !== image.UNIQUE_ID)

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

  for (const chunk of splitArrays) {
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

function validatePutParams(param: IPutItem) {

  if (!param.Item || isObjectEmpty(param.Item)) {
    throw new Error('Invalid request. Must provide an Item')
  }

}

function validateUpdateParams(param: IUpdate) {

  if (!param.Key || !param.Key.HashKey || isObjectEmpty(param.Key)) {
    throw new Error('Invalid HashKey. Please provide a valid Key')
  }

  if (!param.Item || isObjectEmpty(param.Item)) {
    throw new Error('Invalid request. Must update at least one field')
  }

}

function validateQueryParams(param: IQuery) {

  if (!param.Where || !param.Where.HashKey || isObjectEmpty(param.Where)) {
    throw new Error('Invalid Where keyword. Please provide a valid request')
  }

}

function validateDeleteParams(param: IDelete) {

  if (!param.Where || !param.Where.HashKey || isObjectEmpty(param.Where)) {
    throw new Error('Invalid Where keyword. Please provide a valid request')
  }

}

function validateKeyCondition(
  params: IPutItem,
  collectionKey: ICollectionKey ,
  store: IStore
) {
  const HashKey = params.Item[collectionKey.HashKey]
  const SortKey = collectionKey.SortKey
    ? params.Item[collectionKey.SortKey]
    : null
  const doesKeyExist = store.default.has(`${HashKey}`)

  if (doesKeyExist && SortKey) {
    const data = store.default.get(`${HashKey}`)
    const doesSortKeyExist = collectionKey.SortKey
      ? data.findIndex((item: IItem) => item[collectionKey!.SortKey!] === SortKey)
      : -1
    if (doesSortKeyExist >= 0) {
      throw new Error('Item already exist !')
    }

  } else if (doesKeyExist && !SortKey) {

    throw new Error('Item already exist !')
  }
}

function isObjectEmpty(object: any) {
  return Object.keys(object).length === 0 && object.constructor === Object
}

export default Collection

