import { type IRecord, bitable, type ITable } from '@lark-base-open/js-sdk'

export async function findRecord(tableOrId: string | ITable, findFn: (record: IRecord) => boolean) {
  const table = typeof tableOrId === 'string' ? await bitable.base.getTableById(tableOrId) : tableOrId
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