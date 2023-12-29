<script setup lang="ts">
import { Form, FormItem, RadioGroup, RadioButton, Input, message, Spin } from 'ant-design-vue'
import { BarcodeOutlined, LoadingOutlined } from '@ant-design/icons-vue';
import { FieldType, bitable, IOpenSegmentType } from '@lark-base-open/js-sdk';
import type { IOpenSegment, ISingleSelectField, IOpenSingleSelect, ITextField } from '@lark-base-open/js-sdk';
import { ref } from 'vue';
import TableSelect from '@/components/TableSelect.vue'
import FieldSelect from '@/components/FieldSelect.vue';
import { findRecord } from '@/utils/table'

const tableId = ref<string | undefined>(undefined)
bitable.base.getActiveTable().then(async (table) => {
  const id = table.id
  tableId.value = id
})

const codeFieldId = ref<string | undefined>(undefined)
const statusFieldId = ref<string | undefined>(undefined)
const logFieldId = ref<string | undefined>(undefined)
const mode = ref<'in' | 'out'>('in')
const code = ref<string | undefined>(undefined)

const loading = ref(false)
const onInput = async () => {
  if (loading.value) {
    message.error('正在处理上条数据中，请稍候')
    return
  }
  loading.value = true
  try {
    await handleData()
    code.value = undefined
  } catch (error) {
    message.error(String(error))
  }
  loading.value = false
}

const handleData = async () => {
  if (!tableId.value) {
    return
  }
  if (!codeFieldId.value) {
    return
  }
  if (!statusFieldId.value) {
    return
  }
  if (!code.value) {
    return
  }

  const table = await bitable.base.getTableById(tableId.value)
  const codeField = await table.getFieldById<ITextField>(codeFieldId.value)
  const statusField = await table.getFieldById<ISingleSelectField>(statusFieldId.value)
  const logField = logFieldId.value ? await table.getFieldById<ITextField>(logFieldId.value) : null
  const statusOptions = await statusField.getOptions()
  let statusInOptionId: string | undefined
  let statusOutOptionId: string | undefined
  for (const option of statusOptions) {
    if (option.name === '入库') {
      statusInOptionId = option.id
    } else if (option.name === '出库') {
      statusOutOptionId = option.id
    }
  }
  if (statusInOptionId === undefined) {
    statusInOptionId = await statusField.addOption('入库')
  }
  if (statusOutOptionId === undefined) {
    statusOutOptionId = await statusField.addOption('出库')
  }

  const record = await findRecord(table, (record) => {
    if (!codeFieldId.value) {
      return false
    }
    const codeFieldValue = record.fields[codeFieldId.value] as IOpenSegment[] | null
    if (!codeFieldValue) {
      return false
    }
    if (codeFieldValue.length === 0) {
      return false
    } else if (codeFieldValue[0].text === code.value) {
      return true
    }
    return false
  })
  let recordId: string | undefined

  if (record) {
    const statusFieldValue = record.fields[statusFieldId.value] as IOpenSingleSelect || null
    if (!statusFieldValue) {
      message.error('存在该条码，但状态字段为空')
      return
    }
    if (['入库', '出库'].indexOf(statusFieldValue.text) === -1) {
      message.error('该条码状态异常')
      return
    }

    if (mode.value === 'in') {
      if (statusFieldValue.text === '入库') {
        message.error('该条码已入库，请勿重复操作')
        return
      } else if (statusFieldValue.text === '出库') {
        await statusField.setValue(record.recordId, statusInOptionId)
      }
    } else {
      if (statusFieldValue.text === '出库') {
        message.error('该条码已出库，请勿重复操作')
        return
      } else if (statusFieldValue.text === '入库') {
        await statusField.setValue(record.recordId, statusOutOptionId)
      }
    }
    recordId = record.recordId
  } else {
    if (mode.value === 'in') {
      recordId = await table.addRecord([
        await codeField.createCell(code.value),
        await statusField.createCell(statusInOptionId),
      ])
    } else {
      message.error('该条码不存在，无法出库')
      return
    }
  }
  if (logField) {
    const logFieldValue = await logField.getValue(recordId)
    if (logFieldValue) {
      logField.setValue(recordId, [
        ...logFieldValue,
        {
          type: IOpenSegmentType.Text,
          text: `\n${new Date().toLocaleString()}：${mode.value === 'in' ? '入库' : '出库'}`,
        },
      ])
    } else {
      logField.setValue(recordId, [
        {
          type: IOpenSegmentType.Text,
          text: `${new Date().toLocaleString()}：${mode.value === 'in' ? '入库' : '出库'}`,
        },
      ])
    }
  }
  message.success(`${mode.value === 'in' ? '入库' : '出库'}成功`)
}

</script>
<template>
  <main class="px-5 pb-5">
    <Form :layout="'vertical'">
      <FormItem label="仓库表格" required>
        <TableSelect v-model:table-id="tableId"></TableSelect>
      </FormItem>
      <FormItem label="条码字段" required>
        <FieldSelect v-model:table-id="tableId" v-model:field-id="codeFieldId" :field-type-list="[FieldType.Text]">
        </FieldSelect>
      </FormItem>
      <FormItem label="出入库状态字段" required>
        <FieldSelect v-model:table-id="tableId" v-model:field-id="statusFieldId"
          :field-type-list="[FieldType.SingleSelect]"></FieldSelect>
      </FormItem>
      <FormItem label="日志字段">
        <FieldSelect v-model:table-id="tableId" v-model:field-id="logFieldId" :field-type-list="[FieldType.Text]">
        </FieldSelect>
      </FormItem>
      <FormItem label="模式" required>
        <RadioGroup v-model:value="mode">
          <RadioButton value="in">入库</RadioButton>
          <RadioButton value="out">出库</RadioButton>
        </RadioGroup>
      </FormItem>
      <FormItem label="条码" required>
        <Input placeholder="光标聚焦到此，可扫码录入" v-model:value="code" @press-enter="onInput">
        <template #suffix>
          <Spin v-if="loading" :size="'small'">
            <template #indicator>
              <LoadingOutlined class="block mt-[1px]"/>
            </template>
          </Spin>
          <BarcodeOutlined v-else class="text-gray-500" />
        </template>
        </Input>
      </FormItem>
    </Form>
  </main>
</template>
<style scoped></style>