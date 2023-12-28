import { type IRecord, bitable } from '@lark-base-open/js-sdk'

export async function findRecord(tableId: string, findFn: (record: IRecord) => boolean) {
  const table = await bitable.base.getTable(tableId)
  const recordsResponse = await table.getRecords({})
  const { records } = recordsResponse

  let record = records.find(findFn)
  if (record) {
    return record
  }
  
  let { pageToken, hasMore } = recordsResponse
  while (hasMore) {
    const recordsResponse = await table.getRecords({ pageToken })
    const { records } = recordsResponse
    record = records.find(findFn)
    if (record) {
      return record
    }
    pageToken = recordsResponse.pageToken
    hasMore = recordsResponse.hasMore
  }
}